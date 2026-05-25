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
