import { ConvexError, v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { assertStudentVoter, getUser } from "./lib/auth";

export const castVote = mutation({
  args: {
    electionId: v.id("elections"),
    categoryId: v.id("categories"),
    candidateId: v.id("candidates"),
  },
  returns: v.object({ status: v.literal("success") }),
  handler: async (ctx, args) => {
    // 1. Verify authenticated, authorized role, and first login complete
    const user = await assertStudentVoter(ctx);
    if (user.isFirstLogin) throw new ConvexError("Must change password before voting");

    // 2. Assert election is active and within time window
    const election = await ctx.db.get(args.electionId);
    if (!election) throw new ConvexError("Election not found");
    if (election.status !== "active") throw new ConvexError("Election is not active");
    if (Date.now() >= election.endTime) throw new ConvexError("Election has ended");

    // 3. Verify referential consistency: category → election, candidate → category + election
    const category = await ctx.db.get(args.categoryId);
    if (!category || category.electionId !== args.electionId)
      throw new ConvexError("Category does not belong to this election");

    const candidate = await ctx.db.get(args.candidateId);
    if (
      !candidate ||
      candidate.categoryId !== args.categoryId ||
      candidate.electionId !== args.electionId
    )
      throw new ConvexError("Candidate does not belong to this category or election");

    // 4. Check for duplicate vote in this category
    const existingVote = await ctx.db
      .query("voted_log")
      .withIndex("by_voter_category", (q) =>
        q.eq("studentId", user._id).eq("categoryId", args.categoryId),
      )
      .unique();
    if (existingVote) throw new ConvexError("Already voted in this category");

    // 5. Record vote (append-only; tally is derived from this log)
    await ctx.db.insert("voted_log", {
      electionId: args.electionId,
      studentId: user._id,
      categoryId: args.categoryId,
      candidateId: args.candidateId,
      timestamp: Date.now(),
    });

    return { status: "success" as const };
  },
});

export const myVotingProgress = query({
  args: { electionId: v.id("elections") },
  returns: v.array(v.id("categories")),
  handler: async (ctx, args) => {
    const user = await getUser(ctx);
    const votes = await ctx.db
      .query("voted_log")
      .withIndex("by_voter_election", (q) =>
        q.eq("studentId", user._id).eq("electionId", args.electionId),
      )
      .collect();
    return votes.map((row) => row.categoryId);
  },
});
