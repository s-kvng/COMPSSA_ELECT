import { ConvexError, v } from "convex/values";
import { mutation } from "./_generated/server";
import { getUser } from "./lib/auth";

export const generateUploadUrl = mutation({
  args: {},
  returns: v.string(),
  handler: async (ctx) => {
    const user = await getUser(ctx);
    if (user.role !== "ec") throw new ConvexError("Forbidden");
    return await ctx.storage.generateUploadUrl();
  },
});

export const addCandidate = mutation({
  args: {
    electionId: v.id("elections"),
    categoryId: v.id("categories"),
    userId: v.id("users"),
    bio: v.optional(v.string()),
    photoStorageId: v.optional(v.id("_storage")),
  },
  returns: v.id("candidates"),
  handler: async (ctx, args) => {
    const user = await getUser(ctx);
    if (user.role !== "ec") throw new ConvexError("Forbidden");

    const election = await ctx.db.get(args.electionId);
    if (!election) throw new ConvexError("Election not found");
    if (election.status !== "draft") throw new ConvexError("Can only modify elections in draft status");

    const targetUser = await ctx.db.get(args.userId);
    if (!targetUser) throw new ConvexError("User not found");
    if (targetUser.role === "ec" || targetUser.role === "hod") {
      throw new ConvexError("EC and HOD users cannot be assigned as candidates");
    }

    const candidateId = await ctx.db.insert("candidates", {
      electionId: args.electionId,
      categoryId: args.categoryId,
      userId: args.userId,
      bio: args.bio,
      photoStorageId: args.photoStorageId,
    });

    await ctx.db.patch(args.userId, { role: "candidate" });

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

    const candidate = await ctx.db.get(args.candidateId);
    if (!candidate) throw new ConvexError("Candidate not found");

    await ctx.db.insert("ec_action_log", {
      electionId: args.electionId,
      action: "remove_candidate",
      actorId: user._id,
      timestamp: Date.now(),
      metadata: JSON.stringify({ candidateId: args.candidateId }),
    });

    await ctx.db.delete(args.candidateId);

    // Revert role to student if this was their only candidacy
    const otherCandidacies = await ctx.db
      .query("candidates")
      .withIndex("by_user", (q) => q.eq("userId", candidate.userId))
      .take(1);

    if (otherCandidacies.length === 0) {
      await ctx.db.patch(candidate.userId, { role: "student" });
    }

    return null;
  },
});
