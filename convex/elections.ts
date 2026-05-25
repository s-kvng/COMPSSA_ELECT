import { getAuthUserId } from "@convex-dev/auth/server";
import { ConvexError, v } from "convex/values";
import { internalMutation, mutation, query } from "./_generated/server";
import { getUser } from "./lib/auth";
import { electionStatusValidator } from "./schema";

export const createElection = mutation({
  args: {
    title: v.string(),
    description: v.optional(v.string()),
    startTime: v.number(),
    endTime: v.number(),
  },
  returns: v.id("elections"),
  handler: async (ctx, args) => {
    const user = await getUser(ctx);
    if (user.role !== "ec") throw new ConvexError("Forbidden");
    return await ctx.db.insert("elections", {
      title: args.title,
      description: args.description,
      status: "draft",
      startTime: args.startTime,
      endTime: args.endTime,
    });
  },
});

export const markReady = mutation({
  args: { electionId: v.id("elections") },
  returns: v.null(),
  handler: async (ctx, args) => {
    const user = await getUser(ctx);
    if (user.role !== "ec") throw new ConvexError("Forbidden");

    const election = await ctx.db.get(args.electionId);
    if (!election) throw new ConvexError("Election not found");
    if (election.status !== "draft") throw new ConvexError("Election must be in draft status");
    if (election.startTime >= election.endTime) throw new ConvexError("Start time must be before end time");

    const categories = await ctx.db
      .query("categories")
      .withIndex("by_election", (q) => q.eq("electionId", args.electionId))
      .take(100);

    if (categories.length === 0) throw new ConvexError("Election must have at least one category");

    for (const category of categories) {
      const candidates = await ctx.db
        .query("candidates")
        .withIndex("by_category", (q) => q.eq("categoryId", category._id))
        .take(1);
      if (candidates.length === 0) {
        throw new ConvexError(`Category "${category.name}" must have at least one candidate`);
      }
    }

    await ctx.db.patch(args.electionId, { status: "ready" });
    return null;
  },
});

export const getElections = query({
  args: {},
  returns: v.array(
    v.object({
      _id: v.id("elections"),
      _creationTime: v.number(),
      title: v.string(),
      description: v.optional(v.string()),
      status: electionStatusValidator,
      startTime: v.number(),
      endTime: v.number(),
      earlyClosedAt: v.optional(v.number()),
      publishedAt: v.optional(v.number()),
    }),
  ),
  handler: async (ctx) => {
    const user = await getUser(ctx);
    if (user.role !== "ec") throw new ConvexError("Forbidden");
    return await ctx.db.query("elections").order("desc").take(100);
  },
});

export const getElection = query({
  args: { electionId: v.id("elections") },
  returns: v.union(
    v.null(),
    v.object({
      _id: v.id("elections"),
      title: v.string(),
      description: v.optional(v.string()),
      status: electionStatusValidator,
      startTime: v.number(),
      endTime: v.number(),
      earlyClosedAt: v.optional(v.number()),
      publishedAt: v.optional(v.number()),
      categories: v.array(
        v.object({
          _id: v.id("categories"),
          name: v.string(),
          description: v.optional(v.string()),
          candidates: v.array(
            v.object({
              _id: v.id("candidates"),
              userId: v.id("users"),
              userName: v.string(),
              bio: v.optional(v.string()),
            }),
          ),
        }),
      ),
    }),
  ),
  handler: async (ctx, args) => {
    const election = await ctx.db.get(args.electionId);
    if (!election) return null;

    const userId = await getAuthUserId(ctx);
    const user = userId ? await ctx.db.get(userId) : null;
    const isEcOrHod = user?.role === "ec" || user?.role === "hod";
    const isAccessible = ["active", "closed", "published"].includes(election.status);

    if (!isEcOrHod && !isAccessible) return null;

    const categories = await ctx.db
      .query("categories")
      .withIndex("by_election", (q) => q.eq("electionId", args.electionId))
      .take(50);

    const categoriesWithCandidates = await Promise.all(
      categories.map(async (category) => {
        const candidateDocs = await ctx.db
          .query("candidates")
          .withIndex("by_category", (q) => q.eq("categoryId", category._id))
          .take(20);

        const candidates = await Promise.all(
          candidateDocs.map(async (c) => {
            const candUser = await ctx.db.get(c.userId);
            return {
              _id: c._id,
              userId: c.userId,
              userName: candUser?.name ?? "Unknown",
              bio: c.bio,
            };
          }),
        );

        return {
          _id: category._id,
          name: category.name,
          description: category.description,
          candidates,
        };
      }),
    );

    return {
      _id: election._id,
      title: election.title,
      description: election.description,
      status: election.status,
      startTime: election.startTime,
      endTime: election.endTime,
      earlyClosedAt: election.earlyClosedAt,
      publishedAt: election.publishedAt,
      categories: categoriesWithCandidates,
    };
  },
});

// Internal: called by crons.advanceStates
export const activateElection = internalMutation({
  args: { electionId: v.id("elections") },
  returns: v.null(),
  handler: async (ctx, args) => {
    const activeElections = await ctx.db
      .query("elections")
      .withIndex("by_status", (q) => q.eq("status", "active"))
      .take(1);
    if (activeElections.length > 0) throw new ConvexError("Another election is already active");

    const election = await ctx.db.get(args.electionId);
    if (!election) throw new ConvexError("Election not found");
    if (election.status !== "ready") throw new ConvexError("Election must be in ready status");

    await ctx.db.patch(args.electionId, { status: "active" });
    return null;
  },
});

// Internal: called by crons.advanceStates and ec_actions.earlyClose indirectly
export const closeElection = internalMutation({
  args: { electionId: v.id("elections") },
  returns: v.null(),
  handler: async (ctx, args) => {
    const election = await ctx.db.get(args.electionId);
    if (!election) throw new ConvexError("Election not found");
    if (election.status !== "active") throw new ConvexError("Election must be active to close");

    await ctx.db.patch(args.electionId, { status: "closed" });
    return null;
  },
});
