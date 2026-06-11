import { action, internalMutation } from "./_generated/server";
import { createAccount } from "@convex-dev/auth/server";
import { internal } from "./_generated/api";
import { v } from "convex/values";
import { allStudents } from "./data/students";
import type { StudentData } from "./data/students";
import { sendSms, passwordSmsMessage } from "./lib/sms";

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
 * Usage: bunx convex run seed:seedTestUsers
 */
export const seedTestUsers = action({
  args: {},
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
// Real student seed
// ---------------------------------------------------------------------------

function generatePassword(): string {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  const bytes = new Uint8Array(8);
  crypto.getRandomValues(bytes);
  return Array.from(bytes, (b) => chars[b % chars.length]).join("");
}

/**
 * Seeds real student accounts from convex/data/students.ts.
 * Generates a unique password per student, creates their auth account,
 * and sends their credentials via Arkesel SMS (if ARKESEL_API_KEY is set).
 *
 * Safe to re-run — skips students already in the DB.
 *
 * Usage (all levels):  bunx convex run seed:seedStudents
 * Usage (one level):   bunx convex run seed:seedStudents '{"level":100}'
 */
export const seedStudents = action({
  args: {
    level: v.optional(v.union(v.literal(100), v.literal(200), v.literal(300), v.literal(400))),
  },
  handler: async (ctx, args) => {
    const batch: StudentData[] = args.level
      ? allStudents.filter((s) => s.level === args.level)
      : allStudents;

    if (batch.length === 0) {
      return { seeded: 0, skipped: 0, smsSent: 0, errors: [] as string[], message: "No students in data file for this level." };
    }

    const apiKey = process.env.ARKESEL_API_KEY;
    if (!apiKey) console.warn("ARKESEL_API_KEY not set — accounts will be created but no SMS will be sent.");

    let seeded = 0;
    let skipped = 0;
    let smsSent = 0;
    const errors: string[] = [];

    for (const s of batch) {
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
          skipped++;
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

        seeded++;

        if (apiKey) {
          const firstName = s.name.split(" ")[0];
          const message = passwordSmsMessage(firstName, s.email, password);
          try {
            await sendSms(apiKey, s.phone, message);
            smsSent++;
          } catch (smsErr) {
            const msg = smsErr instanceof Error ? smsErr.message : String(smsErr);
            errors.push(`SMS failed for ${s.studentId}: ${msg}`);
          }
        }
      } catch (e: unknown) {
        const msg = e instanceof Error ? e.message : String(e);
        errors.push(`Account failed for ${s.studentId} (${s.email}): ${msg}`);
      }
    }

    return { seeded, skipped, smsSent, errors };
  },
});
