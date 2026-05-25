import { ConvexError, v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { getUser } from "./lib/auth";

export const earlyClose = mutation({
  args: { electionId: v.id("elections") },
  returns: v.null(),
  handler: async (ctx, args) => {
    const user = await getUser(ctx);
    if (user.role !== "ec") throw new ConvexError("Forbidden");

    const election = await ctx.db.get(args.electionId);
    if (!election) throw new ConvexError("Election not found");
    if (election.status !== "active") throw new ConvexError("Election is not active");

    await ctx.db.patch(args.electionId, {
      status: "closed",
      earlyClosedAt: Date.now(),
    });

    await ctx.db.insert("ec_action_log", {
      electionId: args.electionId,
      action: "early_close",
      actorId: user._id,
      timestamp: Date.now(),
    });

    return null;
  },
});

export const publishElection = mutation({
  args: { electionId: v.id("elections") },
  returns: v.null(),
  handler: async (ctx, args) => {
    const user = await getUser(ctx);
    if (user.role !== "ec") throw new ConvexError("Forbidden");

    const election = await ctx.db.get(args.electionId);
    if (!election) throw new ConvexError("Election not found");
    if (election.status !== "closed") throw new ConvexError("Election is not closed");

    await ctx.db.patch(args.electionId, {
      status: "published",
      publishedAt: Date.now(),
    });

    await ctx.db.insert("ec_action_log", {
      electionId: args.electionId,
      action: "publish",
      actorId: user._id,
      timestamp: Date.now(),
    });

    return null;
  },
});

export const auditLogExport = query({
  args: { electionId: v.id("elections") },
  returns: v.array(
    v.object({
      studentId: v.id("users"),
      categoryId: v.id("categories"),
      timestamp: v.number(),
    }),
  ),
  handler: async (ctx, args) => {
    const user = await getUser(ctx);
    if (user.role !== "ec") throw new ConvexError("Forbidden");

    const election = await ctx.db.get(args.electionId);
    if (!election) throw new ConvexError("Election not found");
    if (election.status !== "closed" && election.status !== "published") {
      throw new ConvexError("Audit log only available for closed or published elections");
    }

    const logs = await ctx.db
      .query("voted_log")
      .withIndex("by_election", (q) => q.eq("electionId", args.electionId))
      .take(10000);

    return logs.map((l) => ({
      studentId: l.studentId,
      categoryId: l.categoryId,
      timestamp: l.timestamp,
    }));
  },
});
