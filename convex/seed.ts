import { action, internalMutation } from "./_generated/server";
import { createAccount } from "@convex-dev/auth/server";
import { internal } from "./_generated/api";
import { v } from "convex/values";

const TEST_USERS = [
  { name: "Yaw Voter",       email: "voter@compssa.org", studentId: "COMP-501",  role: "student"   as const },
  { name: "Kwame Boateng",   email: "kwame@compssa.org", studentId: "COMP-502",  role: "candidate" as const },
  { name: "Ama Mensah",      email: "ama@compssa.org",   studentId: "COMP-503",  role: "student"   as const },
  { name: "EC Commissioner", email: "ec@compssa.org",    studentId: "COMP-EC01", role: "ec"        as const },
  { name: "Prof. Asante",    email: "hod@compssa.org",   studentId: "COMP-HOD1", role: "hod"       as const },
];

const DEFAULT_PASSWORD = "COMPSSA_2026";

/**
 * Seeds test accounts: inserts into `users` AND creates hashed credentials
 * in `authAccounts` so users can sign in immediately.
 *
 * Safe to re-run — skips emails that already have a users row.
 *
 * Usage:
 *   bunx convex run seed:seedTestUsers
 */
export const seedTestUsers = action({
  args: {},
  handler: async (ctx) => {
    const results: string[] = [];

    for (const u of TEST_USERS) {
      try {
        // Step 1: pre-insert into users table so createOrUpdateUser callback can find it
        await ctx.runMutation(internal.seed.insertUserIfMissing, {
          name: u.name,
          email: u.email,
          studentId: u.studentId,
          role: u.role,
        });

        // Step 2: create hashed credentials in authAccounts (calls createOrUpdateUser internally)
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

export const insertUserIfMissing = internalMutation({
  args: {
    name: v.string(),
    email: v.string(),
    studentId: v.string(),
    role: v.union(v.literal("student"), v.literal("candidate"), v.literal("ec"), v.literal("hod")),
  },
  handler: async (ctx, args) => {
    const exists = await ctx.db
      .query("users")
      .withIndex("by_email", (q) => q.eq("email", args.email))
      .unique();
    if (!exists) {
      await ctx.db.insert("users", { ...args, isFirstLogin: false });
    }
  },
});
