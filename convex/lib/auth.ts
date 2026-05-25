import { getAuthUserId } from "@convex-dev/auth/server";
import { ConvexError } from "convex/values";
import { MutationCtx, QueryCtx } from "../_generated/server";

export async function getUser(ctx: QueryCtx | MutationCtx) {
  const userId = await getAuthUserId(ctx);
  if (!userId) throw new ConvexError("Unauthenticated");
  const user = await ctx.db.get(userId);
  if (!user) throw new ConvexError("User record not found");
  return user;
}

/** Throws unless the caller is a student or candidate (i.e. a voter). */
export async function assertStudentVoter(ctx: QueryCtx | MutationCtx) {
  const user = await getUser(ctx);
  if (user.role !== "student" && user.role !== "candidate") {
    throw new ConvexError("Only students and candidates may vote");
  }
  return user;
}
