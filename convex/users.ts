import { getAuthUserId, modifyAccountCredentials } from "@convex-dev/auth/server";
import { ConvexError, v } from "convex/values";
import { action, internalAction, internalMutation, internalQuery, query } from "./_generated/server";
import { internal } from "./_generated/api";
import { getUser } from "./lib/auth";
import {
  userRoleValidator,
  sexValidator,
  studentTypeValidator,
  studentLevelValidator,
  seedJobStatusValidator,
} from "./schema";
import { sendSms, sendBatchSms, passwordSmsMessage } from "./lib/sms";
import { generatePassword } from "./lib/password";
import type { Doc, Id } from "./_generated/dataModel";

export type CurrentUserResult = {
  _id: Id<"users">;
  name: string;
  email: string;
  studentId: string;
  role: "student" | "candidate" | "ec" | "hod";
  isFirstLogin: boolean;
  phone?: string;
  level?: number;
  sex?: "M" | "F";
  regular?: "regular" | "weekend";
  programme?: string;
};

export const getCurrentUser = query({
  args: {},
  returns: v.union(
    v.object({
      _id: v.id("users"),
      name: v.string(),
      email: v.string(),
      studentId: v.string(),
      role: userRoleValidator,
      isFirstLogin: v.boolean(),
      phone: v.optional(v.string()),
      level: v.optional(v.number()),
      sex: v.optional(sexValidator),
      regular: v.optional(studentTypeValidator),
      programme: v.optional(v.string()),
    }),
    v.null(),
  ),
  handler: async (ctx): Promise<CurrentUserResult | null> => {
    const userId = await getAuthUserId(ctx);
    if (userId === null) return null;
    const user = await ctx.db.get(userId);
    if (user === null) return null;
    return {
      _id: user._id,
      name: user.name,
      email: user.email,
      studentId: user.studentId,
      role: user.role,
      isFirstLogin: user.isFirstLogin,
      phone: user.phone,
      level: user.level,
      sex: user.sex,
      regular: user.regular,
      programme: user.programme,
    };
  },
});

export const searchStudents = query({
  args: {
    searchText: v.string(),
    excludeUserIds: v.array(v.id("users")),
  },
  returns: v.array(
    v.object({
      _id: v.id("users"),
      name: v.string(),
      studentId: v.string(),
      role: userRoleValidator,
    }),
  ),
  handler: async (ctx, { searchText, excludeUserIds }) => {
    const user = await getUser(ctx);
    if (user.role !== "ec") throw new ConvexError("Forbidden");

    const q = searchText.trim();
    if (!q) return [];

    const excludeSet = new Set(excludeUserIds);
    const isEligible = (u: { _id: Id<"users">; role: string }) =>
      !excludeSet.has(u._id) && u.role !== "hod" && u.role !== "ec";
    const toDto = (u: { _id: Id<"users">; name: string; studentId: string; role: "student" | "candidate" | "ec" | "hod" }) => ({
      _id: u._id,
      name: u.name,
      studentId: u.studentId,
      role: u.role,
    });

    // Digit-led query → prefix range on studentId index
    if (/^\d/.test(q)) {
      const results = await ctx.db
        .query("users")
        .withIndex("by_student_id", (idx) =>
          idx.gte("studentId", q).lte("studentId", q + "￿"),
        )
        .take(30);
      return results.filter(isEligible).slice(0, 10).map(toDto);
    }

    // Name full-text search
    const results = await ctx.db
      .query("users")
      .withSearchIndex("search_name", (idx) => idx.search("name", q))
      .take(30);
    return results.filter(isEligible).slice(0, 10).map(toDto);
  },
});

export const getStudents = query({
  args: {},
  handler: async (ctx) => {
    const user = await getUser(ctx);
    if (user.role !== "ec") throw new ConvexError("Forbidden");
    const [students, candidates, ecs] = await Promise.all([
      ctx.db.query("users").withIndex("by_role", (q) => q.eq("role", "student")).collect(),
      ctx.db.query("users").withIndex("by_role", (q) => q.eq("role", "candidate")).collect(),
      ctx.db.query("users").withIndex("by_role", (q) => q.eq("role", "ec")).collect(),
    ]);
    return [...students, ...candidates, ...ecs].map((u) => ({
      _id: u._id,
      name: u.name,
      email: u.email,
      studentId: u.studentId,
      role: u.role,
      isFirstLogin: u.isFirstLogin,
      phone: u.phone,
      level: u.level,
      sex: u.sex,
      regular: u.regular,
      programme: u.programme,
    }));
  },
});

export const markFirstLoginDone = internalMutation({
  args: { userId: v.id("users") },
  returns: v.null(),
  handler: async (ctx, { userId }): Promise<null> => {
    await ctx.db.patch(userId, { isFirstLogin: false });
    return null;
  },
});

export const patchUser = internalMutation({
  args: {
    userId: v.id("users"),
    phone: v.optional(v.string()),
    isFirstLogin: v.optional(v.boolean()),
  },
  returns: v.null(),
  handler: async (ctx, { userId, ...fields }): Promise<null> => {
    await ctx.db.patch(userId, fields);
    return null;
  },
});

export const getUserById = internalQuery({
  args: { userId: v.id("users") },
  handler: async (ctx, { userId }) => {
    return await ctx.db.get(userId);
  },
});

export const completeFirstLogin = action({
  args: { newPassword: v.string() },
  returns: v.null(),
  handler: async (ctx, { newPassword }): Promise<null> => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new ConvexError("Unauthenticated");

    const user: Doc<"users"> | null = await ctx.runQuery(internal.users.getUserById, { userId });
    if (!user?.email) throw new ConvexError("User not found");

    await modifyAccountCredentials(ctx, {
      provider: "password",
      account: { id: user.email, secret: newPassword },
    });

    await ctx.runMutation(internal.users.markFirstLoginDone, { userId });
    return null;
  },
});

/**
 * EC resets a student's password and re-sends it via SMS.
 * Use when: student didn't receive initial SMS, wrong number was on record,
 * or student is locked out and can't self-serve.
 *
 * If the original phone was wrong, pass `correctedPhone` and it will be
 * saved to the student's record before sending.
 *
 * A brand-new password is generated — the original is unrecoverable.
 */
export const resetStudentPassword = action({
  args: {
    userId: v.id("users"),
    correctedPhone: v.optional(v.string()),
  },
  returns: v.object({ smsSent: v.boolean(), phone: v.string() }),
  handler: async (ctx, args): Promise<{ smsSent: boolean; phone: string }> => {
    const callerId = await getAuthUserId(ctx);
    if (!callerId) throw new ConvexError("Unauthenticated");
    const caller: Doc<"users"> | null = await ctx.runQuery(internal.users.getUserById, { userId: callerId });
    if (!caller || caller.role !== "ec") throw new ConvexError("Forbidden");

    const student: Doc<"users"> | null = await ctx.runQuery(internal.users.getUserById, { userId: args.userId });
    if (!student) throw new ConvexError("Student not found");
    if (student.role !== "student" && student.role !== "candidate") {
      throw new ConvexError("Can only reset passwords for students");
    }

    const phone: string = args.correctedPhone ?? student.phone ?? "";
    if (!phone) throw new ConvexError("No phone number on record — provide correctedPhone");

    // Persist corrected phone and re-arm first-login flag
    await ctx.runMutation(internal.users.patchUser, {
      userId: args.userId,
      ...(args.correctedPhone ? { phone: args.correctedPhone } : {}),
      isFirstLogin: true,
    });

    // Generate a fresh password and overwrite the hashed credentials
    const newPassword = generatePassword();

    await modifyAccountCredentials(ctx, {
      provider: "password",
      account: { id: student.email, secret: newPassword },
    });

    const apiKey = process.env.ARKESEL_API_KEY;
    let smsSent = false;
    if (apiKey) {
      const firstName = student.name.split(" ")[0];
      const message = passwordSmsMessage(firstName, student.email, newPassword);
      try {
        await sendSms(apiKey, phone, message);
        smsSent = true;
      } catch (err) {
        console.error("SMS failed during password reset:", err);
      }
    } else {
      console.warn("ARKESEL_API_KEY not set — password was reset but SMS not sent");
    }

    return { smsSent, phone };
  },
});

export const getUserByEmail = internalQuery({
  args: { email: v.string() },
  returns: v.union(
    v.object({
      _id: v.id("users"),
      _creationTime: v.number(),
      name: v.string(),
      email: v.string(),
      studentId: v.string(),
      role: userRoleValidator,
      isFirstLogin: v.boolean(),
      phone: v.optional(v.string()),
      level: v.optional(v.number()),
      sex: v.optional(sexValidator),
      regular: v.optional(studentTypeValidator),
      programme: v.optional(v.string()),
    }),
    v.null(),
  ),
  handler: async (ctx, { email }) => {
    return await ctx.db
      .query("users")
      .withIndex("by_email", (q) => q.eq("email", email))
      .unique();
  },
});

/**
 * Resets password + re-sends credentials via SMS for a specific, small list
 * of accounts looked up by email — any role (student, candidate, ec, hod).
 * Built for spot-testing/handling a handful of accounts (e.g. ECs
 * themselves) ahead of a full resetAllStudentPasswords run, without waiting
 * on the chunked job machinery. Not chunked — keep the list small (a few
 * dozen at most); sendBatchSms still internally chunks its own HTTP calls.
 *
 * CLI-run admin operation, same trust model as resetAllStudentPasswords —
 * see the comment there for why there's no getAuthUserId/EC check here.
 *
 * Usage: bunx convex run users:resetPasswordsByEmail '{"emails":["ec@compssa.org"]}'
 */
export const resetPasswordsByEmail = action({
  args: { emails: v.array(v.string()) },
  returns: v.object({
    resetCount: v.number(),
    smsSent: v.number(),
    smsFailed: v.number(),
    errors: v.array(v.string()),
  }),
  handler: async (ctx, { emails }) => {
    const apiKey = process.env.ARKESEL_API_KEY;
    if (!apiKey) console.warn("ARKESEL_API_KEY not set — passwords will be reset but no SMS will be sent.");

    let resetCount = 0;
    const errors: string[] = [];
    const smsRecipients: { phone: string; name: string; email: string; password: string }[] = [];

    for (const email of emails) {
      const user: Doc<"users"> | null = await ctx.runQuery(internal.users.getUserByEmail, { email });
      if (!user) {
        errors.push(`No user found for ${email}`);
        continue;
      }
      if (!user.phone) {
        errors.push(`No phone on record for ${email} — skipped`);
        continue;
      }

      try {
        const newPassword = generatePassword();

        await modifyAccountCredentials(ctx, {
          provider: "password",
          account: { id: user.email, secret: newPassword },
        });

        await ctx.runMutation(internal.users.patchUser, { userId: user._id, isFirstLogin: true });

        resetCount++;

        if (apiKey) {
          smsRecipients.push({
            phone: user.phone,
            name: user.name.split(" ")[0],
            email: user.email,
            password: newPassword,
          });
        }
      } catch (e: unknown) {
        const msg = e instanceof Error ? e.message : String(e);
        errors.push(`Reset failed for ${email}: ${msg}`);
      }
    }

    let smsSent = 0;
    let smsFailed = 0;
    if (apiKey && smsRecipients.length > 0) {
      const result = await sendBatchSms(apiKey, smsRecipients);
      smsSent = result.sentCount;
      smsFailed = result.failedPhones.length;
      if (result.failedPhones.length > 0) {
        errors.push(`SMS batch failed for: ${result.failedPhones.join(", ")}`);
      }
    }

    return { resetCount, smsSent, smsFailed, errors };
  },
});

// ---------------------------------------------------------------------------
// Bulk password reset — chunked across scheduled action invocations, same
// pattern as convex/seed.ts's seed_jobs (see that file for the rationale).
// Prod-critical: students are already seeded, so this is the path actually
// used to get everyone working credentials. Progress tracked in reset_jobs;
// poll with getResetJobStatus.
// ---------------------------------------------------------------------------

const RESET_CHUNK_SIZE = 25;
const MAX_STORED_RESET_ERRORS = 50;

export const getResettableStudentIds = internalQuery({
  args: {
    level: v.optional(studentLevelValidator),
    excludeEmails: v.optional(v.array(v.string())),
  },
  returns: v.array(v.id("users")),
  handler: async (ctx, { level, excludeEmails }): Promise<Id<"users">[]> => {
    const [students, candidates] = await Promise.all([
      ctx.db.query("users").withIndex("by_role", (q) => q.eq("role", "student")).collect(),
      ctx.db.query("users").withIndex("by_role", (q) => q.eq("role", "candidate")).collect(),
    ]);
    const all = [...students, ...candidates];
    const excludeSet = new Set((excludeEmails ?? []).map((e) => e.toLowerCase()));
    const filtered = all
      .filter((u) => level === undefined || u.level === level)
      .filter((u) => !excludeSet.has(u.email.toLowerCase()));
    return filtered.map((u) => u._id);
  },
});

/**
 * Bulk password reset + re-SMS for every student/candidate (optionally
 * filtered to one `level`, and optionally excluding specific emails — e.g.
 * accounts already handled individually via resetPasswordsByEmail so they
 * don't get a second, redundant reset + SMS).
 *
 * This is a CLI-run admin operation (like seed:seedStudents) — access is
 * controlled by possession of deploy-key CLI access, not an app session, so
 * it deliberately has no getAuthUserId/EC-role check: `bunx convex run`
 * carries no authenticated identity and that check would always reject it.
 * Once an EC-facing UI exists for this, add a thin auth-checked wrapper
 * action rather than gating this one.
 *
 * Mirrors seed.ts's chunked-job pattern: returns immediately with a jobId,
 * the actual work happens in scheduled processResetChunk invocations.
 *
 * Usage: bunx convex run users:resetAllStudentPasswords
 *        bunx convex run users:resetAllStudentPasswords '{"level":100}'
 *        bunx convex run users:resetAllStudentPasswords '{"excludeEmails":["ec@compssa.org"]}'
 * Poll:  bunx convex run users:getResetJobStatus '{"jobId":"<id>"}'
 */
export const resetAllStudentPasswords = action({
  args: {
    level: v.optional(studentLevelValidator),
    excludeEmails: v.optional(v.array(v.string())),
  },
  returns: v.object({
    jobId: v.optional(v.id("reset_jobs")),
    totalStudents: v.number(),
    message: v.string(),
  }),
  handler: async (ctx, args) => {
    const userIds: Id<"users">[] = await ctx.runQuery(internal.users.getResettableStudentIds, {
      level: args.level,
      excludeEmails: args.excludeEmails,
    });

    if (userIds.length === 0) {
      return { jobId: undefined, totalStudents: 0, message: "No matching students found." };
    }

    if (!process.env.ARKESEL_API_KEY) {
      console.warn("ARKESEL_API_KEY not set — passwords will be reset but no SMS will be sent.");
    }

    const jobId: Id<"reset_jobs"> = await ctx.runMutation(internal.users.createResetJob, { userIds });

    await ctx.scheduler.runAfter(0, internal.users.processResetChunk, { jobId });

    return {
      jobId,
      totalStudents: userIds.length,
      message: `Reset started in the background across ${Math.ceil(userIds.length / RESET_CHUNK_SIZE)} chunk(s). Check progress with: bunx convex run users:getResetJobStatus '{"jobId":"${jobId}"}'`,
    };
  },
});

export const createResetJob = internalMutation({
  args: { userIds: v.array(v.id("users")) },
  returns: v.id("reset_jobs"),
  handler: async (ctx, { userIds }): Promise<Id<"reset_jobs">> => {
    return await ctx.db.insert("reset_jobs", {
      status: "running",
      userIds,
      totalStudents: userIds.length,
      processedIndex: 0,
      reset: 0,
      smsSent: 0,
      smsFailed: 0,
      errorCount: 0,
      errors: [],
      startedAt: Date.now(),
    });
  },
});

export const getResetJob = internalQuery({
  args: { jobId: v.id("reset_jobs") },
  returns: v.union(
    v.object({
      _id: v.id("reset_jobs"),
      _creationTime: v.number(),
      status: seedJobStatusValidator,
      userIds: v.array(v.id("users")),
      totalStudents: v.number(),
      processedIndex: v.number(),
      reset: v.number(),
      smsSent: v.number(),
      smsFailed: v.number(),
      errorCount: v.number(),
      errors: v.array(v.string()),
      startedAt: v.number(),
      completedAt: v.optional(v.number()),
    }),
    v.null(),
  ),
  handler: async (ctx, { jobId }): Promise<Doc<"reset_jobs"> | null> => {
    return await ctx.db.get(jobId);
  },
});

export const getResetJobStatus = internalQuery({
  args: { jobId: v.id("reset_jobs") },
  returns: v.union(
    v.object({
      status: seedJobStatusValidator,
      totalStudents: v.number(),
      processedIndex: v.number(),
      reset: v.number(),
      smsSent: v.number(),
      smsFailed: v.number(),
      errorCount: v.number(),
      errors: v.array(v.string()),
      startedAt: v.number(),
      completedAt: v.optional(v.number()),
    }),
    v.null(),
  ),
  handler: async (ctx, { jobId }) => {
    const job = await ctx.db.get(jobId);
    if (!job) return null;
    return {
      status: job.status,
      totalStudents: job.totalStudents,
      processedIndex: job.processedIndex,
      reset: job.reset,
      smsSent: job.smsSent,
      smsFailed: job.smsFailed,
      errorCount: job.errorCount,
      errors: job.errors,
      startedAt: job.startedAt,
      completedAt: job.completedAt,
    };
  },
});

export const applyResetChunkResult = internalMutation({
  args: {
    jobId: v.id("reset_jobs"),
    resetDelta: v.number(),
    smsSentDelta: v.number(),
    smsFailedDelta: v.number(),
    newErrors: v.array(v.string()),
    newProcessedIndex: v.number(),
    done: v.boolean(),
  },
  returns: v.null(),
  handler: async (ctx, args): Promise<null> => {
    const job = await ctx.db.get(args.jobId);
    if (!job) return null;

    const errors = [...job.errors, ...args.newErrors].slice(0, MAX_STORED_RESET_ERRORS);

    await ctx.db.patch(args.jobId, {
      processedIndex: args.newProcessedIndex,
      reset: job.reset + args.resetDelta,
      smsSent: job.smsSent + args.smsSentDelta,
      smsFailed: job.smsFailed + args.smsFailedDelta,
      errorCount: job.errorCount + args.newErrors.length,
      errors,
      status: args.done ? "done" : "running",
      completedAt: args.done ? Date.now() : job.completedAt,
    });
    return null;
  },
});

/**
 * Processes one chunk (RESET_CHUNK_SIZE users) of a bulk reset job: for each
 * user, generates a fresh password, overwrites their hashed credentials,
 * re-arms isFirstLogin, and queues them for one batched Arkesel SMS call
 * covering the whole chunk. Reschedules itself until the job is exhausted.
 */
export const processResetChunk = internalAction({
  args: { jobId: v.id("reset_jobs") },
  returns: v.null(),
  handler: async (ctx, { jobId }): Promise<null> => {
    const job: Doc<"reset_jobs"> | null = await ctx.runQuery(internal.users.getResetJob, { jobId });
    if (!job || job.status === "done") return null;

    const chunkIds = job.userIds.slice(job.processedIndex, job.processedIndex + RESET_CHUNK_SIZE);

    if (chunkIds.length === 0) {
      await ctx.runMutation(internal.users.applyResetChunkResult, {
        jobId,
        resetDelta: 0,
        smsSentDelta: 0,
        smsFailedDelta: 0,
        newErrors: [],
        newProcessedIndex: job.processedIndex,
        done: true,
      });
      return null;
    }

    const apiKey = process.env.ARKESEL_API_KEY;
    let resetDelta = 0;
    const errors: string[] = [];
    const smsRecipients: { phone: string; name: string; email: string; password: string }[] = [];

    for (const userId of chunkIds) {
      const student: Doc<"users"> | null = await ctx.runQuery(internal.users.getUserById, { userId });
      if (!student) {
        errors.push(`User ${userId} no longer exists`);
        continue;
      }
      if (!student.phone) {
        errors.push(`No phone on record for ${student.studentId} (${student.email}) — skipped`);
        continue;
      }

      try {
        const newPassword = generatePassword();

        await modifyAccountCredentials(ctx, {
          provider: "password",
          account: { id: student.email, secret: newPassword },
        });

        await ctx.runMutation(internal.users.patchUser, { userId, isFirstLogin: true });

        resetDelta++;

        if (apiKey) {
          smsRecipients.push({
            phone: student.phone,
            name: student.name.split(" ")[0],
            email: student.email,
            password: newPassword,
          });
        }
      } catch (e: unknown) {
        const msg = e instanceof Error ? e.message : String(e);
        errors.push(`Reset failed for ${student.studentId} (${student.email}): ${msg}`);
      }
    }

    let smsSentDelta = 0;
    let smsFailedDelta = 0;
    if (apiKey && smsRecipients.length > 0) {
      const result = await sendBatchSms(apiKey, smsRecipients);
      smsSentDelta = result.sentCount;
      smsFailedDelta = result.failedPhones.length;
      if (result.failedPhones.length > 0) {
        errors.push(`SMS batch failed for: ${result.failedPhones.join(", ")}`);
      }
    }

    const newProcessedIndex = job.processedIndex + chunkIds.length;
    const done = newProcessedIndex >= job.userIds.length;

    await ctx.runMutation(internal.users.applyResetChunkResult, {
      jobId,
      resetDelta,
      smsSentDelta,
      smsFailedDelta,
      newErrors: errors,
      newProcessedIndex,
      done,
    });

    if (!done) {
      await ctx.scheduler.runAfter(0, internal.users.processResetChunk, { jobId });
    }

    return null;
  },
});
