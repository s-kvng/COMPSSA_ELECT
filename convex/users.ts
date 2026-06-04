import { getAuthUserId, modifyAccountCredentials } from "@convex-dev/auth/server";
import { ConvexError, v } from "convex/values";
import { action, internalMutation, mutation, query } from "./_generated/server";
import { internal } from "./_generated/api";
import { getUser } from "./lib/auth";
import { userRoleValidator } from "./schema";
import type { Id } from "./_generated/dataModel";

export type CurrentUserResult = {
  _id: Id<"users">;
  name: string;
  email: string;
  studentId: string;
  role: "student" | "candidate" | "ec" | "hod";
  isFirstLogin: boolean;
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
    }));
  },
});

const markFirstLoginDone = internalMutation({
  args: { userId: v.id("users") },
  returns: v.null(),
  handler: async (ctx, { userId }): Promise<null> => {
    await ctx.db.patch(userId, { isFirstLogin: false });
    return null;
  },
});

export const completeFirstLogin = action({
  args: { newPassword: v.string() },
  returns: v.null(),
  handler: async (ctx, { newPassword }): Promise<null> => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new ConvexError("Unauthenticated");

    const identity = await ctx.auth.getUserIdentity();
    const email = identity?.email;
    if (!email) throw new ConvexError("Could not resolve user email");

    await modifyAccountCredentials(ctx, {
      provider: "password",
      account: { id: email, secret: newPassword },
    });

    await ctx.runMutation(internal.users.markFirstLoginDone, { userId });
    return null;
  },
});

// TODO: bulkImportStudents — pending createAccount spike
