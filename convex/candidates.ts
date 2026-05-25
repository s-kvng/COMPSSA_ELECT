import { ConvexError, v } from "convex/values";
import { mutation } from "./_generated/server";
import { getUser } from "./lib/auth";

export const addCandidate = mutation({
  args: {
    electionId: v.id("elections"),
    categoryId: v.id("categories"),
    userId: v.id("users"),
    bio: v.optional(v.string()),
  },
  returns: v.id("candidates"),
  handler: async (ctx, args) => {
    const user = await getUser(ctx);
    if (user.role !== "ec") throw new ConvexError("Forbidden");

    const election = await ctx.db.get(args.electionId);
    if (!election) throw new ConvexError("Election not found");
    if (election.status !== "draft") throw new ConvexError("Can only modify elections in draft status");

    const candidateId = await ctx.db.insert("candidates", {
      electionId: args.electionId,
      categoryId: args.categoryId,
      userId: args.userId,
      bio: args.bio,
      count: 0,
    });

    await ctx.db.insert("ec_action_log", {
      electionId: args.electionId,
      action: "add_candidate",
      actorId: user._id,
      timestamp: Date.now(),
      metadata: JSON.stringify({ candidateId, userId: args.userId }),
    });

    return candidateId;
  },
});

export const removeCandidate = mutation({
  args: {
    electionId: v.id("elections"),
    candidateId: v.id("candidates"),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    const user = await getUser(ctx);
    if (user.role !== "ec") throw new ConvexError("Forbidden");

    const election = await ctx.db.get(args.electionId);
    if (!election) throw new ConvexError("Election not found");
    if (election.status !== "draft") throw new ConvexError("Can only modify elections in draft status");

    await ctx.db.insert("ec_action_log", {
      electionId: args.electionId,
      action: "remove_candidate",
      actorId: user._id,
      timestamp: Date.now(),
      metadata: JSON.stringify({ candidateId: args.candidateId }),
    });

    await ctx.db.delete(args.candidateId);
    return null;
  },
});
