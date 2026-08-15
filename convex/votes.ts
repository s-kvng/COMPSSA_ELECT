import { ConvexError, v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { assertStudentVoter, getUser } from "./lib/auth";
import { bumpUniqueVoters, bumpVoteTally } from "./lib/tallies";

export const castVote = mutation({
  args: {
    electionId: v.id("elections"),
    categoryId: v.id("categories"),
    candidateId: v.optional(v.id("candidates")),
    noVote: v.optional(v.boolean()),
  },
  returns: v.object({ status: v.literal("success") }),
  handler: async (ctx, args) => {
    const user = await assertStudentVoter(ctx);
    if (user.isFirstLogin) throw new ConvexError("Must change password before voting");

    const election = await ctx.db.get(args.electionId);
    if (!election) throw new ConvexError("Election not found");
    if (election.status !== "active") throw new ConvexError("Election is not active");
    if (Date.now() >= election.endTime) throw new ConvexError("Election has ended");

    const category = await ctx.db.get(args.categoryId);
    if (!category || category.electionId !== args.electionId)
      throw new ConvexError("Category does not belong to this election");

    if (args.noVote) {
      // No-vote path: just verify the category is a single-candidate category
      const candidateCount = await ctx.db
        .query("candidates")
        .withIndex("by_category", (q) => q.eq("categoryId", args.categoryId))
        .take(2);
      if (candidateCount.length !== 1)
        throw new ConvexError("No-vote is only allowed for single-candidate categories");
    } else {
      if (!args.candidateId) throw new ConvexError("candidateId is required for a yes vote");
      const candidate = await ctx.db.get(args.candidateId);
      if (
        !candidate ||
        candidate.categoryId !== args.categoryId ||
        candidate.electionId !== args.electionId
      )
        throw new ConvexError("Candidate does not belong to this category or election");
    }

    const existingVote = await ctx.db
      .query("voted_log")
      .withIndex("by_voter_category", (q) =>
        q.eq("studentId", user._id).eq("categoryId", args.categoryId),
      )
      .unique();
    if (existingVote) throw new ConvexError("Already voted in this category");

    await ctx.db.insert("voted_log", {
      electionId: args.electionId,
      studentId: user._id,
      categoryId: args.categoryId,
      ...(args.noVote ? { noVote: true } : { candidateId: args.candidateId }),
      timestamp: Date.now(),
    });

    // Keep the dashboard counters in step with the ballot just written. These
    // are a cache over `voted_log` — see `lib/tallies.ts` — so a failure here
    // rolls back the ballot too, which is what we want: the two never diverge.
    await bumpVoteTally(ctx, {
      electionId: args.electionId,
      categoryId: args.categoryId,
      candidateId: args.noVote ? undefined : args.candidateId,
      delta: 1,
    });

    // Turnout counts *students*, not ballots. This is the student's first
    // ballot in the election iff the row just inserted is the only one.
    const ballotsThisElection = await ctx.db
      .query("voted_log")
      .withIndex("by_voter_election", (q) =>
        q.eq("studentId", user._id).eq("electionId", args.electionId),
      )
      .take(2);
    if (ballotsThisElection.length === 1) {
      await bumpUniqueVoters(ctx, args.electionId, 1);
    }

    return { status: "success" as const };
  },
});

export const getMyVotes = query({
  args: { electionId: v.id("elections") },
  returns: v.array(
    v.object({
      categoryId: v.id("categories"),
      candidateId: v.optional(v.id("candidates")),
      noVote: v.optional(v.boolean()),
    }),
  ),
  handler: async (ctx, args) => {
    const user = await getUser(ctx);
    const votes = await ctx.db
      .query("voted_log")
      .withIndex("by_voter_election", (q) =>
        q.eq("studentId", user._id).eq("electionId", args.electionId),
      )
      .take(100);
    return votes.map((row) => ({
      categoryId: row.categoryId,
      candidateId: row.candidateId,
      noVote: row.noVote,
    }));
  },
});
