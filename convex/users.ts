import { getAuthUserId } from "@convex-dev/auth/server";
import { ConvexError, v } from "convex/values";
import { mutation, query } from "./_generated/server";
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
    const allUsers = await ctx.db.query("users").take(500);
    return allUsers
      .filter((u) => u.role === "student")
      .map((u) => ({
        _id: u._id,
        name: u.name,
        email: u.email,
        studentId: u.studentId,
        role: u.role,
        isFirstLogin: u.isFirstLogin,
      }));
  },
});

export const setIsFirstLoginComplete = mutation({
  args: {},
  returns: v.null(),
  handler: async (ctx): Promise<null> => {
    const user = await getUser(ctx);
    if (!user.isFirstLogin) return null;
    await ctx.db.patch(user._id, { isFirstLogin: false });
    return null;
  },
});

// TODO: bulkImportStudents — pending createAccount spike
