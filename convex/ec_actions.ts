import { ConvexError, v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { getUser } from "./lib/auth";
import { readUniqueVoters } from "./lib/tallies";

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

/**
 * @deprecated Scans the whole electorate *and* the whole ballot log on every
 * vote — this single subscription accounted for the bulk of the deployment's
 * database read volume. Superseded by `getVoterTurnout` + `getElectorBase`.
 * Kept only so an in-flight browser session on the previous frontend build
 * keeps working; safe to delete once the new frontend is deployed.
 *
 * It doubles as the reconciliation check for the counters: if this disagrees
 * with `getVoterTurnout`, re-run `tallies:startTallyBackfill`.
 */
export const getTurnout = query({
  args: { electionId: v.id("elections") },
  returns: v.object({ uniqueVoters: v.number(), registeredCount: v.number() }),
  handler: async (ctx, args) => {
    const user = await getUser(ctx);
    if (user.role !== "ec" && user.role !== "hod") throw new ConvexError("Forbidden");

    const votes = await ctx.db
      .query("voted_log")
      .withIndex("by_election", (q) => q.eq("electionId", args.electionId))
      .take(10000);

    const uniqueVoterIds = new Set(votes.map((v) => v.studentId));

    const [students, candidates] = await Promise.all([
      ctx.db.query("users").withIndex("by_role", (q) => q.eq("role", "student")).take(3000),
      ctx.db.query("users").withIndex("by_role", (q) => q.eq("role", "candidate")).take(100),
    ]);

    const verifiedCount =
      students.filter((s) => !s.isFirstLogin).length +
      candidates.filter((c) => !c.isFirstLogin).length;

    return {
      uniqueVoters: uniqueVoterIds.size,
      registeredCount: verifiedCount,
    };
  },
});

/**
 * Live ballot count for an election — one document read.
 *
 * Deliberately split from `getElectorBase` below. Both halves used to live in
 * `getTurnout`, which meant every ballot invalidated the subscription and forced
 * a re-read of all ~3k user documents on top of the whole `voted_log`, for every
 * connected EC/HOD client. Split apart, the half that changes on every vote is
 * one document, and the half that reads the user table only re-runs when a user
 * record actually changes.
 */
export const getVoterTurnout = query({
  args: { electionId: v.id("elections") },
  returns: v.object({ uniqueVoters: v.number() }),
  handler: async (ctx, args) => {
    const user = await getUser(ctx);
    if (user.role !== "ec" && user.role !== "hod") throw new ConvexError("Forbidden");
    return { uniqueVoters: await readUniqueVoters(ctx, args.electionId) };
  },
});

/**
 * Size of the verified electorate — students and candidates who have completed
 * first login. Independent of any election, and unaffected by voting activity.
 */
export const getElectorBase = query({
  args: {},
  returns: v.object({ registeredCount: v.number() }),
  handler: async (ctx) => {
    const user = await getUser(ctx);
    if (user.role !== "ec" && user.role !== "hod") throw new ConvexError("Forbidden");

    const [students, candidates] = await Promise.all([
      ctx.db.query("users").withIndex("by_role", (q) => q.eq("role", "student")).take(3000),
      ctx.db.query("users").withIndex("by_role", (q) => q.eq("role", "candidate")).take(100),
    ]);

    return {
      registeredCount:
        students.filter((s) => !s.isFirstLogin).length +
        candidates.filter((c) => !c.isFirstLogin).length,
    };
  },
});

export const getRecentEcActions = query({
  args: { electionId: v.id("elections") },
  returns: v.array(
    v.object({
      _id: v.id("ec_action_log"),
      action: v.string(),
      timestamp: v.number(),
      actorId: v.id("users"),
    }),
  ),
  handler: async (ctx, args) => {
    const user = await getUser(ctx);
    if (user.role !== "ec") throw new ConvexError("Forbidden");

    const actions = await ctx.db
      .query("ec_action_log")
      .withIndex("by_election", (q) => q.eq("electionId", args.electionId))
      .order("desc")
      .take(10);

    return actions.map((a) => ({
      _id: a._id,
      action: a.action,
      timestamp: a.timestamp,
      actorId: a.actorId,
    }));
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
