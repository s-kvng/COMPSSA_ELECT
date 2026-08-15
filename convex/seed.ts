import { action, internalAction, internalMutation, internalQuery } from "./_generated/server";
import { createAccount } from "@convex-dev/auth/server";
import { internal } from "./_generated/api";
import { v } from "convex/values";
import { allStudents } from "./data/students";
import type { StudentData } from "./data/students";
import { sendBatchSms } from "./lib/sms";
import { generatePassword } from "./lib/password";
import { studentLevelValidator, seedJobStatusValidator } from "./schema";
import type { Doc, Id } from "./_generated/dataModel";

// ---------------------------------------------------------------------------
// Test seed
// ---------------------------------------------------------------------------

const TEST_USERS = [
  { name: "Yaw Voter",       email: "voter@compssa.org", studentId: "COMP-501",  role: "student"   as const },
  { name: "Kwame Boateng",   email: "kwame@compssa.org", studentId: "COMP-502",  role: "candidate" as const },
  { name: "Ama Mensah",      email: "ama@compssa.org",   studentId: "COMP-503",  role: "student"   as const },
  { name: "EC Commissioner", email: "ec@compssa.org",    studentId: "COMP-EC01", role: "ec"        as const },
  { name: "Prof. Asante",    email: "hod@compssa.org",   studentId: "COMP-HOD1", role: "hod"       as const },
];

const DEFAULT_PASSWORD = "COMPSSA_2026";

/**
 * Seeds test accounts. Safe to re-run — skips existing emails.
 * Only 5 rows — no chunking needed. Usage: bunx convex run seed:seedTestUsers
 */
export const seedTestUsers = action({
  args: {},
  returns: v.object({
    results: v.array(v.string()),
    password: v.string(),
  }),
  handler: async (ctx) => {
    const results: string[] = [];

    for (const u of TEST_USERS) {
      try {
        await ctx.runMutation(internal.seed.insertUserIfMissing, {
          name: u.name,
          email: u.email,
          studentId: u.studentId,
          role: u.role,
        });

        await createAccount(ctx, {
          provider: "password",
          account: { id: u.email, secret: DEFAULT_PASSWORD },
          profile: { name: u.name, email: u.email, studentId: u.studentId, role: u.role, isFirstLogin: false },
        });

        results.push(`✓ ${u.email} (${u.role})`);
      } catch (e: unknown) {
        const msg = e instanceof Error ? e.message : String(e);
        results.push(`— ${u.email} skipped: ${msg}`);
      }
    }

    return { results, password: DEFAULT_PASSWORD };
  },
});

// ---------------------------------------------------------------------------
// Shared internal mutation
// ---------------------------------------------------------------------------

// Returns true if the user was newly inserted, false if already existed.
export const insertUserIfMissing = internalMutation({
  args: {
    name: v.string(),
    email: v.string(),
    studentId: v.string(),
    role: v.union(v.literal("student"), v.literal("candidate"), v.literal("ec"), v.literal("hod")),
    phone: v.optional(v.string()),
    level: v.optional(v.number()),
    sex: v.optional(v.union(v.literal("M"), v.literal("F"))),
    regular: v.optional(v.union(v.literal("regular"), v.literal("weekend"))),
    programme: v.optional(v.string()),
  },
  returns: v.boolean(),
  handler: async (ctx, args): Promise<boolean> => {
    const exists = await ctx.db
      .query("users")
      .withIndex("by_email", (q) => q.eq("email", args.email))
      .unique();
    if (exists) return false;
    await ctx.db.insert("users", {
      name: args.name,
      email: args.email,
      studentId: args.studentId,
      role: args.role,
      isFirstLogin: true,
      phone: args.phone,
      level: args.level,
      sex: args.sex,
      regular: args.regular,
      programme: args.programme,
    });
    return true;
  },
});

// ---------------------------------------------------------------------------
// Real student seed — chunked across scheduled action invocations so a large
// batch (account creation does bcrypt hashing per row; SMS is an HTTP call)
// never risks a single action running past Convex's execution time limit.
// Progress is tracked in the `seed_jobs` table; poll with getSeedJobStatus.
// ---------------------------------------------------------------------------

// Students processed (account created + SMS'd) per action invocation before
// it reschedules itself for the next chunk. Small enough that bcrypt hashing
// + one batched SMS HTTP call for the chunk comfortably fits one action run.
const ACCOUNT_CHUNK_SIZE = 25;
// Cap on how many error strings we keep on the job doc (full count is in
// `errorCount`) so a run with many failures can't blow past document limits.
const MAX_STORED_ERRORS = 50;

function studentBatchForLevel(level?: 100 | 200 | 300 | 400): StudentData[] {
  return level ? allStudents.filter((s) => s.level === level) : allStudents;
}

/**
 * Kicks off a chunked seeding run for convex/data/students.ts and returns
 * immediately with a job id. The actual work happens in scheduled
 * `processSeedChunk` invocations; poll progress with:
 *   bunx convex run seed:getSeedJobStatus '{"jobId":"<id>"}'
 *
 * Safe to re-run — students already in the DB are skipped.
 *
 * Usage (all levels):  bunx convex run seed:seedStudents
 * Usage (one level):   bunx convex run seed:seedStudents '{"level":100}'
 */
export const seedStudents = action({
  args: {
    level: v.optional(studentLevelValidator),
  },
  returns: v.object({
    jobId: v.optional(v.id("seed_jobs")),
    totalStudents: v.number(),
    message: v.string(),
  }),
  handler: async (ctx, args) => {
    const batch = studentBatchForLevel(args.level);

    if (batch.length === 0) {
      return {
        jobId: undefined,
        totalStudents: 0,
        message: "No students in data file for this level.",
      };
    }

    if (!process.env.ARKESEL_API_KEY) {
      console.warn("ARKESEL_API_KEY not set — accounts will be created but no SMS will be sent.");
    }

    const jobId: Id<"seed_jobs"> = await ctx.runMutation(internal.seed.createSeedJob, {
      level: args.level,
      totalStudents: batch.length,
    });

    await ctx.scheduler.runAfter(0, internal.seed.processSeedChunk, { jobId });

    return {
      jobId,
      totalStudents: batch.length,
      message: `Seeding started in the background across ${Math.ceil(batch.length / ACCOUNT_CHUNK_SIZE)} chunk(s). Check progress with: bunx convex run seed:getSeedJobStatus '{"jobId":"${jobId}"}'`,
    };
  },
});

export const createSeedJob = internalMutation({
  args: {
    level: v.optional(studentLevelValidator),
    totalStudents: v.number(),
  },
  returns: v.id("seed_jobs"),
  handler: async (ctx, args): Promise<Id<"seed_jobs">> => {
    return await ctx.db.insert("seed_jobs", {
      level: args.level,
      status: "running",
      totalStudents: args.totalStudents,
      processedIndex: 0,
      seeded: 0,
      skipped: 0,
      smsSent: 0,
      smsFailed: 0,
      errorCount: 0,
      errors: [],
      startedAt: Date.now(),
    });
  },
});

export const getSeedJob = internalQuery({
  args: { jobId: v.id("seed_jobs") },
  returns: v.union(
    v.object({
      _id: v.id("seed_jobs"),
      _creationTime: v.number(),
      level: v.optional(studentLevelValidator),
      status: seedJobStatusValidator,
      totalStudents: v.number(),
      processedIndex: v.number(),
      seeded: v.number(),
      skipped: v.number(),
      smsSent: v.number(),
      smsFailed: v.number(),
      errorCount: v.number(),
      errors: v.array(v.string()),
      startedAt: v.number(),
      completedAt: v.optional(v.number()),
    }),
    v.null(),
  ),
  handler: async (ctx, { jobId }): Promise<Doc<"seed_jobs"> | null> => {
    return await ctx.db.get(jobId);
  },
});

/**
 * Same shape as getSeedJob — kept as a separate public-facing entry point for
 * CLI polling (`bunx convex run seed:getSeedJobStatus ...`) so the internal
 * job-loading query used by processSeedChunk can change independently.
 */
export const getSeedJobStatus = internalQuery({
  args: { jobId: v.id("seed_jobs") },
  returns: v.union(
    v.object({
      status: seedJobStatusValidator,
      totalStudents: v.number(),
      processedIndex: v.number(),
      seeded: v.number(),
      skipped: v.number(),
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
      seeded: job.seeded,
      skipped: job.skipped,
      smsSent: job.smsSent,
      smsFailed: job.smsFailed,
      errorCount: job.errorCount,
      errors: job.errors,
      startedAt: job.startedAt,
      completedAt: job.completedAt,
    };
  },
});

export const applySeedChunkResult = internalMutation({
  args: {
    jobId: v.id("seed_jobs"),
    seededDelta: v.number(),
    skippedDelta: v.number(),
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

    const errors = [...job.errors, ...args.newErrors].slice(0, MAX_STORED_ERRORS);

    await ctx.db.patch(args.jobId, {
      processedIndex: args.newProcessedIndex,
      seeded: job.seeded + args.seededDelta,
      skipped: job.skipped + args.skippedDelta,
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
 * Processes one chunk (ACCOUNT_CHUNK_SIZE students) of a seeding job:
 * inserts each student's user row + auth account, then sends their
 * credentials via one batched Arkesel SMS call for the whole chunk.
 * Reschedules itself for the next chunk until the batch is exhausted.
 */
export const processSeedChunk = internalAction({
  args: { jobId: v.id("seed_jobs") },
  returns: v.null(),
  handler: async (ctx, { jobId }): Promise<null> => {
    const job: Doc<"seed_jobs"> | null = await ctx.runQuery(internal.seed.getSeedJob, { jobId });
    if (!job || job.status === "done") return null;

    const batch = studentBatchForLevel(job.level);
    const chunk = batch.slice(job.processedIndex, job.processedIndex + ACCOUNT_CHUNK_SIZE);

    if (chunk.length === 0) {
      await ctx.runMutation(internal.seed.applySeedChunkResult, {
        jobId,
        seededDelta: 0,
        skippedDelta: 0,
        smsSentDelta: 0,
        smsFailedDelta: 0,
        newErrors: [],
        newProcessedIndex: job.processedIndex,
        done: true,
      });
      return null;
    }

    const apiKey = process.env.ARKESEL_API_KEY;
    let seededDelta = 0;
    let skippedDelta = 0;
    const errors: string[] = [];
    const smsRecipients: { phone: string; name: string; email: string; password: string }[] = [];

    for (const s of chunk) {
      const password = generatePassword();
      try {
        const wasInserted: boolean = await ctx.runMutation(internal.seed.insertUserIfMissing, {
          name: s.name,
          email: s.email,
          studentId: s.studentId,
          role: "student",
          phone: s.phone,
          level: s.level,
          sex: s.sex,
          regular: s.regular,
          programme: s.programme,
        });

        if (!wasInserted) {
          skippedDelta++;
          continue;
        }

        await createAccount(ctx, {
          provider: "password",
          account: { id: s.email, secret: password },
          profile: {
            name: s.name,
            email: s.email,
            studentId: s.studentId,
            role: "student",
            isFirstLogin: true,
          },
        });

        seededDelta++;

        if (apiKey) {
          smsRecipients.push({
            phone: s.phone,
            name: s.name.split(" ")[0],
            email: s.email,
            password,
          });
        }
      } catch (e: unknown) {
        const msg = e instanceof Error ? e.message : String(e);
        errors.push(`Account failed for ${s.studentId} (${s.email}): ${msg}`);
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

    const newProcessedIndex = job.processedIndex + chunk.length;
    const done = newProcessedIndex >= batch.length;

    await ctx.runMutation(internal.seed.applySeedChunkResult, {
      jobId,
      seededDelta,
      skippedDelta,
      smsSentDelta,
      smsFailedDelta,
      newErrors: errors,
      newProcessedIndex,
      done,
    });

    if (!done) {
      await ctx.scheduler.runAfter(0, internal.seed.processSeedChunk, { jobId });
    }

    return null;
  },
});
