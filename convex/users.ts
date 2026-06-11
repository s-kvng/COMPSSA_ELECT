import { getAuthUserId, modifyAccountCredentials } from "@convex-dev/auth/server";
import { ConvexError, v } from "convex/values";
import { action, internalMutation, internalQuery, query } from "./_generated/server";
import { internal } from "./_generated/api";
import { getUser } from "./lib/auth";
import { userRoleValidator, sexValidator, studentTypeValidator } from "./schema";
import { sendSms, passwordSmsMessage } from "./lib/sms";
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
    const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
    const bytes = new Uint8Array(8);
    crypto.getRandomValues(bytes);
    const newPassword = Array.from(bytes, (b) => chars[b % chars.length]).join("");

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
