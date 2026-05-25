import { getAuthUserId } from "@convex-dev/auth/server";
import { ConvexError, v } from "convex/values";
import { query } from "./_generated/server";
import { getUser } from "./lib/auth";

export const electionResults = query({
  args: { electionId: v.id("elections") },
  returns: v.union(
    v.object({ status: v.literal("voting_in_progress") }),
    v.object({ status: v.literal("not_published") }),
    v.object({
      status: v.literal("ok"),
      categories: v.array(
        v.object({
          _id: v.id("categories"),
          name: v.string(),
          candidates: v.array(
            v.object({
              _id: v.id("candidates"),
              userId: v.id("users"),
              userName: v.string(),
              count: v.number(),
            }),
          ),
        }),
      ),
    }),
  ),
  handler: async (ctx, args) => {
    const election = await ctx.db.get(args.electionId);
    if (!election) throw new ConvexError("Election not found");

    const userId = await getAuthUserId(ctx);
    const user = userId ? await ctx.db.get(userId) : null;
    const role = user?.role ?? null;
    const isEcOrHod = role === "ec" || role === "hod";
    const isPublished = election.status === "published";

    if (!isEcOrHod && !isPublished) {
      if (role === "student" || role === "candidate") {
        return { status: "voting_in_progress" as const };
      }
      return { status: "not_published" as const };
    }

    const categories = await ctx.db
      .query("categories")
      .withIndex("by_election", (q) => q.eq("electionId", args.electionId))
      .take(50);

    const result = await Promise.all(
      categories.map(async (category) => {
        const candidateDocs = await ctx.db
          .query("candidates")
          .withIndex("by_category", (q) => q.eq("categoryId", category._id))
          .take(20);

        const candidates = await Promise.all(
          candidateDocs.map(async (c) => {
            const [candUser, votes] = await Promise.all([
              ctx.db.get(c.userId),
              ctx.db
                .query("voted_log")
                .withIndex("by_candidate", (q) => q.eq("candidateId", c._id))
                .collect(),
            ]);
            return {
              _id: c._id,
              userId: c.userId,
              userName: candUser?.name ?? "Unknown",
              count: votes.length,
            };
          }),
        );

        return { _id: category._id, name: category.name, candidates };
      }),
    );

    return { status: "ok" as const, categories: result };
  },
});

export const myVoteCount = query({
  args: {},
  returns: v.union(v.number(), v.null()),
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) return null;
    const user = await ctx.db.get(userId);
    if (!user || user.role !== "candidate") return null;

    // Find the active election
    const activeElections = await ctx.db
      .query("elections")
      .withIndex("by_status", (q) => q.eq("status", "active"))
      .take(1);
    if (activeElections.length === 0) return null;
    const election = activeElections[0];

    const candidateEntry = await ctx.db
      .query("candidates")
      .withIndex("by_user_election", (q) =>
        q.eq("userId", user._id).eq("electionId", election._id),
      )
      .unique();

    if (!candidateEntry) return null;
    const votes = await ctx.db
      .query("voted_log")
      .withIndex("by_candidate", (q) => q.eq("candidateId", candidateEntry._id))
      .collect();
    return votes.length;
  },
});
