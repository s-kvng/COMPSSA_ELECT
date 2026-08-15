import { ConvexError, v } from "convex/values";
import { modifyAccountCredentials } from "@convex-dev/auth/server";
import { internalAction, internalMutation, internalQuery, action } from "./_generated/server";
import { internal } from "./_generated/api";
import { seedJobStatusValidator } from "./schema";
import {
  normalizePhone,
  isValidGhanaPhone,
  describePhoneProblem,
  sendSms,
  passwordSmsMessage,
} from "./lib/sms";
import { generatePassword } from "./lib/password";
import type { Doc, Id } from "./_generated/dataModel";

/**
 * Recovery path for the 2026-08 level-100 reset run, where 200 students had
 * their passwords rotated but never received them.
 *
 * What happened: Arkesel's template-send endpoint rejects the ENTIRE request
 * with HTTP 422 when a single recipient key is malformed. Eight malformed
 * numbers in the roster therefore killed eight full chunks of 25 — 200
 * students — even though 192 of those numbers were perfectly valid. Because
 * the password rotation happens before the send and only the hash is stored,
 * the plaintext for those 200 is unrecoverable: they must be re-issued.
 *
 * This module is deliberately separate from users.ts's bulk-reset machinery,
 * which stays exactly as it is (the 890 students it delivered to are done and
 * must not be touched again). The difference here is the send: one HTTP call
 * PER RECIPIENT via the plain send endpoint, so a bad number can only ever
 * fail itself.
 */

const RECOVERY_CHUNK_SIZE = 25;

type PhoneMatch = {
  userId: Id<"users">;
  studentId: string;
  name: string;
  email: string;
  phone: string;
  valid: boolean;
  problem?: string;
};

type MatchPhonesResult = { matched: PhoneMatch[]; unmatchedPhones: string[] };

type BadPhone = {
  userId: Id<"users">;
  studentId: string;
  name: string;
  email: string;
  phone: string;
  problem: string;
};

type AuditResult = {
  sendableCount: number;
  invalidCount: number;
  unmatchedCount: number;
  invalid: Omit<BadPhone, "userId">[];
  unmatchedPhones: string[];
};

type InvalidPhonesResult = { count: number; students: BadPhone[] };

type RecoveryStartResult = {
  jobId?: Id<"sms_recovery_jobs">;
  targeted: number;
  skippedInvalid: number;
  unmatched: string[];
  message: string;
};

/**
 * Resolves raw phone strings (as pasted from a failed job's error list) to
 * user records, comparing on the normalized 233XXXXXXXXX form so "+233...",
 * "233..." and "0..." all match whatever is stored.
 */
export const matchPhones = internalQuery({
  args: { phones: v.array(v.string()) },
  returns: v.object({
    matched: v.array(
      v.object({
        userId: v.id("users"),
        studentId: v.string(),
        name: v.string(),
        email: v.string(),
        phone: v.string(),
        valid: v.boolean(),
        problem: v.optional(v.string()),
      }),
    ),
    unmatchedPhones: v.array(v.string()),
  }),
  handler: async (ctx, { phones }): Promise<MatchPhonesResult> => {
    const [students, candidates] = await Promise.all([
      ctx.db.query("users").withIndex("by_role", (q) => q.eq("role", "student")).collect(),
      ctx.db.query("users").withIndex("by_role", (q) => q.eq("role", "candidate")).collect(),
    ]);

    const byPhone = new Map<string, Doc<"users">>();
    for (const u of [...students, ...candidates]) {
      if (u.phone) byPhone.set(normalizePhone(u.phone), u);
    }

    const matched: PhoneMatch[] = [];
    const unmatchedPhones: string[] = [];
    const seen = new Set<string>();

    for (const raw of phones) {
      const key = normalizePhone(raw);
      if (seen.has(key)) continue;
      seen.add(key);

      const user = byPhone.get(key);
      if (!user) {
        unmatchedPhones.push(raw);
        continue;
      }
      const valid = isValidGhanaPhone(user.phone ?? "");
      matched.push({
        userId: user._id,
        studentId: user.studentId,
        name: user.name,
        email: user.email,
        phone: user.phone ?? "",
        valid,
        ...(valid ? {} : { problem: describePhoneProblem(user.phone ?? "") }),
      });
    }

    return { matched, unmatchedPhones };
  },
});

/**
 * Read-only triage: splits a list of phones into the ones that are safe to
 * send to and the ones whose numbers are malformed and must be corrected
 * first (via users:resetStudentPassword with `correctedPhone`).
 *
 * Usage:
 *   bunx convex run smsRecovery:auditPhones '{"phones":["+233...","+233..."]}' --prod
 */
export const auditPhones = action({
  args: { phones: v.array(v.string()) },
  returns: v.object({
    sendableCount: v.number(),
    invalidCount: v.number(),
    unmatchedCount: v.number(),
    invalid: v.array(
      v.object({
        studentId: v.string(),
        name: v.string(),
        email: v.string(),
        phone: v.string(),
        problem: v.string(),
      }),
    ),
    unmatchedPhones: v.array(v.string()),
  }),
  handler: async (ctx, { phones }): Promise<AuditResult> => {
    const { matched, unmatchedPhones }: MatchPhonesResult = await ctx.runQuery(
      internal.smsRecovery.matchPhones,
      { phones },
    );

    const invalid = matched
      .filter((m) => !m.valid)
      .map((m) => ({
        studentId: m.studentId,
        name: m.name,
        email: m.email,
        phone: m.phone,
        problem: m.problem ?? "invalid",
      }));

    return {
      sendableCount: matched.filter((m) => m.valid).length,
      invalidCount: invalid.length,
      unmatchedCount: unmatchedPhones.length,
      invalid,
      unmatchedPhones,
    };
  },
});

/**
 * Every student/candidate on record whose stored phone number could never be
 * delivered to. Run this once to isolate the bad data across the whole roster,
 * not just the phones from one failed job.
 *
 * Usage: bunx convex run smsRecovery:listInvalidPhones --prod
 */
export const listInvalidPhones = action({
  args: {},
  returns: v.object({
    count: v.number(),
    students: v.array(
      v.object({
        userId: v.id("users"),
        studentId: v.string(),
        name: v.string(),
        email: v.string(),
        phone: v.string(),
        problem: v.string(),
      }),
    ),
  }),
  handler: async (ctx): Promise<InvalidPhonesResult> => {
    return await ctx.runQuery(internal.smsRecovery.collectInvalidPhones, {});
  },
});

export const collectInvalidPhones = internalQuery({
  args: {},
  returns: v.object({
    count: v.number(),
    students: v.array(
      v.object({
        userId: v.id("users"),
        studentId: v.string(),
        name: v.string(),
        email: v.string(),
        phone: v.string(),
        problem: v.string(),
      }),
    ),
  }),
  handler: async (ctx) => {
    const [students, candidates] = await Promise.all([
      ctx.db.query("users").withIndex("by_role", (q) => q.eq("role", "student")).collect(),
      ctx.db.query("users").withIndex("by_role", (q) => q.eq("role", "candidate")).collect(),
    ]);

    const bad = [...students, ...candidates]
      .filter((u) => !isValidGhanaPhone(u.phone ?? ""))
      .map((u) => ({
        userId: u._id,
        studentId: u.studentId,
        name: u.name,
        email: u.email,
        phone: u.phone ?? "",
        problem: describePhoneProblem(u.phone ?? ""),
      }));

    return { count: bad.length, students: bad };
  },
});

/**
 * Re-issues credentials to exactly the students behind `phones`, skipping any
 * whose number is malformed. Chunked across scheduled invocations and tracked
 * in reset_jobs, so progress polls with the familiar
 * users:getResetJobStatus '{"jobId":"..."}'.
 *
 * CLI-run admin operation — same trust model as users:resetAllStudentPasswords
 * (deploy-key access, no app session), so no getAuthUserId check.
 *
 * Usage:
 *   bunx convex run smsRecovery:recoverFailedSms '{"phones":["+233...", ...]}' --prod
 */
export const recoverFailedSms = action({
  args: { phones: v.array(v.string()) },
  returns: v.object({
    jobId: v.optional(v.id("sms_recovery_jobs")),
    targeted: v.number(),
    skippedInvalid: v.number(),
    unmatched: v.array(v.string()),
    message: v.string(),
  }),
  handler: async (ctx, { phones }): Promise<RecoveryStartResult> => {
    if (!process.env.ARKESEL_API_KEY) {
      throw new ConvexError(
        "ARKESEL_API_KEY not set — refusing to rotate passwords that could not then be delivered.",
      );
    }

    const { matched, unmatchedPhones }: MatchPhonesResult = await ctx.runQuery(
      internal.smsRecovery.matchPhones,
      { phones },
    );

    const sendable = matched.filter((m) => m.valid);
    const skippedInvalid = matched.length - sendable.length;

    if (sendable.length === 0) {
      return {
        jobId: undefined,
        targeted: 0,
        skippedInvalid,
        unmatched: unmatchedPhones,
        message: "No deliverable numbers among the supplied phones — nothing was reset.",
      };
    }

    const jobId: Id<"sms_recovery_jobs"> = await ctx.runMutation(
      internal.smsRecovery.createRecoveryJob,
      { userIds: sendable.map((m) => m.userId), skippedInvalid },
    );

    await ctx.scheduler.runAfter(0, internal.smsRecovery.processRecoveryChunk, { jobId });

    return {
      jobId,
      targeted: sendable.length,
      skippedInvalid,
      unmatched: unmatchedPhones,
      message: `Re-issuing credentials to ${sendable.length} student(s). Poll with: bunx convex run smsRecovery:getRecoveryStatus '{"jobId":"${jobId}"}' --prod`,
    };
  },
});

export const createRecoveryJob = internalMutation({
  args: { userIds: v.array(v.id("users")), skippedInvalid: v.number() },
  returns: v.id("sms_recovery_jobs"),
  handler: async (ctx, { userIds, skippedInvalid }): Promise<Id<"sms_recovery_jobs">> => {
    return await ctx.db.insert("sms_recovery_jobs", {
      status: "running",
      userIds,
      totalStudents: userIds.length,
      processedIndex: 0,
      reset: 0,
      smsSent: 0,
      smsFailed: 0,
      skippedInvalid,
      errorCount: 0,
      errors: [],
      startedAt: Date.now(),
    });
  },
});

export const getRecoveryJob = internalQuery({
  args: { jobId: v.id("sms_recovery_jobs") },
  handler: async (ctx, { jobId }): Promise<Doc<"sms_recovery_jobs"> | null> => {
    return await ctx.db.get(jobId);
  },
});

export const getRecoveryStatus = internalQuery({
  args: { jobId: v.id("sms_recovery_jobs") },
  returns: v.union(
    v.object({
      status: seedJobStatusValidator,
      totalStudents: v.number(),
      processedIndex: v.number(),
      reset: v.number(),
      smsSent: v.number(),
      smsFailed: v.number(),
      skippedInvalid: v.number(),
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
      skippedInvalid: job.skippedInvalid,
      errorCount: job.errorCount,
      errors: job.errors,
      startedAt: job.startedAt,
      completedAt: job.completedAt,
    };
  },
});

const MAX_STORED_RECOVERY_ERRORS = 100;

export const applyRecoveryChunkResult = internalMutation({
  args: {
    jobId: v.id("sms_recovery_jobs"),
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

    await ctx.db.patch(args.jobId, {
      processedIndex: args.newProcessedIndex,
      reset: job.reset + args.resetDelta,
      smsSent: job.smsSent + args.smsSentDelta,
      smsFailed: job.smsFailed + args.smsFailedDelta,
      errorCount: job.errorCount + args.newErrors.length,
      errors: [...job.errors, ...args.newErrors].slice(0, MAX_STORED_RECOVERY_ERRORS),
      status: args.done ? "done" : "running",
      completedAt: args.done ? Date.now() : job.completedAt,
    });
    return null;
  },
});

/**
 * Rotates and delivers one chunk. Unlike the bulk path this sends per
 * recipient: the password is only rotated once the student's own SMS has
 * been accepted, so a delivery failure can never again strand someone with
 * a password nobody knows.
 */
export const processRecoveryChunk = internalAction({
  args: { jobId: v.id("sms_recovery_jobs") },
  returns: v.null(),
  handler: async (ctx, { jobId }): Promise<null> => {
    const job: Doc<"sms_recovery_jobs"> | null = await ctx.runQuery(
      internal.smsRecovery.getRecoveryJob,
      { jobId },
    );
    if (!job || job.status === "done") return null;

    const apiKey = process.env.ARKESEL_API_KEY;
    if (!apiKey) {
      await ctx.runMutation(internal.smsRecovery.applyRecoveryChunkResult, {
        jobId,
        resetDelta: 0,
        smsSentDelta: 0,
        smsFailedDelta: 0,
        newErrors: ["ARKESEL_API_KEY missing — job aborted before rotating any password"],
        newProcessedIndex: job.processedIndex,
        done: true,
      });
      return null;
    }

    const chunkIds = job.userIds.slice(job.processedIndex, job.processedIndex + RECOVERY_CHUNK_SIZE);

    if (chunkIds.length === 0) {
      await ctx.runMutation(internal.smsRecovery.applyRecoveryChunkResult, {
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

    let resetDelta = 0;
    let smsSentDelta = 0;
    let smsFailedDelta = 0;
    const errors: string[] = [];

    for (const userId of chunkIds) {
      const student: Doc<"users"> | null = await ctx.runQuery(internal.users.getUserById, { userId });
      if (!student) {
        errors.push(`User ${userId} no longer exists`);
        continue;
      }
      const phone = student.phone ?? "";
      if (!isValidGhanaPhone(phone)) {
        errors.push(
          `${student.studentId} (${student.email}) — ${describePhoneProblem(phone)}; skipped, password untouched`,
        );
        continue;
      }

      const newPassword = generatePassword();

      // Send FIRST. If Arkesel rejects this one number, the student keeps
      // whatever password they already have rather than being locked out.
      try {
        await sendSms(apiKey, phone, passwordSmsMessage(student.name.split(" ")[0], student.email, newPassword));
        smsSentDelta++;
      } catch (e: unknown) {
        smsFailedDelta++;
        errors.push(
          `${student.studentId} (${student.email}) ${phone} — SMS failed, password NOT rotated: ${e instanceof Error ? e.message : String(e)}`,
        );
        continue;
      }

      try {
        await modifyAccountCredentials(ctx, {
          provider: "password",
          account: { id: student.email, secret: newPassword },
        });
        await ctx.runMutation(internal.users.patchUser, { userId, isFirstLogin: true });
        resetDelta++;
      } catch (e: unknown) {
        errors.push(
          `${student.studentId} (${student.email}) — SMS DELIVERED but credential write failed: ${e instanceof Error ? e.message : String(e)}`,
        );
      }
    }

    const newProcessedIndex = job.processedIndex + chunkIds.length;
    const done = newProcessedIndex >= job.userIds.length;

    await ctx.runMutation(internal.smsRecovery.applyRecoveryChunkResult, {
      jobId,
      resetDelta,
      smsSentDelta,
      smsFailedDelta,
      newErrors: errors,
      newProcessedIndex,
      done,
    });

    if (!done) {
      await ctx.scheduler.runAfter(0, internal.smsRecovery.processRecoveryChunk, { jobId });
    }

    return null;
  },
});
