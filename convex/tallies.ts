import { ConvexError, v } from "convex/values";
import { internal } from "./_generated/api";
import { Id } from "./_generated/dataModel";
import { internalMutation, mutation, query } from "./_generated/server";
import { getUser } from "./lib/auth";
import { bumpUniqueVoters, bumpVoteTally } from "./lib/tallies";

/**
 * Rebuilds `election_tallies` and `vote_tallies` from the `voted_log` source of
 * truth.
 *
 * Needed once at rollout — ballots cast before the counters existed are not in
 * them — and available afterwards as the repair path if the counters are ever
 * suspected of drifting from the log.
 *
 * Chunked across scheduled mutations because a full election's ballots exceed
 * the per-mutation document-read limit, the same pattern `seed_jobs` uses.
 */

const CHUNK_SIZE = 500;

/**
 * Zeroes the counters and starts the rebuild.
 *
 * Safe to run during live voting. The reset and the `cutoff` stamp happen in one
 * transaction, so each ballot is counted exactly once: a `castVote` that commits
 * before this mutation has its increment wiped by the reset but is re-counted by
 * the scan (its `_creationTime` precedes the cutoff), and one that commits after
 * keeps its live increment and is skipped by the scan.
 *
 * Idempotent — running it again simply rebuilds from scratch.
 */
export const startTallyBackfill = mutation({
  args: { electionId: v.id("elections") },
  returns: v.id("tally_jobs"),
  handler: async (ctx, args): Promise<Id<"tally_jobs">> => {
    const user = await getUser(ctx);
    if (user.role !== "ec") throw new ConvexError("Forbidden");
    return await ctx.runMutation(internal.tallies.beginBackfill, args);
  },
});

/**
 * The backfill itself, without the EC check — so it can be triggered from the
 * Convex dashboard or CLI during an incident, when nobody is holding an EC
 * session in a browser.
 */
export const beginBackfill = internalMutation({
  args: { electionId: v.id("elections") },
  returns: v.id("tally_jobs"),
  handler: async (ctx, args) => {
    const election = await ctx.db.get(args.electionId);
    if (!election) throw new ConvexError("Election not found");

    // Clear the counters. Bounded by (categories x candidates), so this stays
    // well inside a single transaction.
    const existingTallies = await ctx.db
      .query("vote_tallies")
      .withIndex("by_election", (q) => q.eq("electionId", args.electionId))
      .take(2000);
    for (const row of existingTallies) {
      await ctx.db.delete(row._id);
    }
    // Zeroed *and* marked not-ready in the same transaction: from here until the
    // scan finishes, the read paths fall back to `voted_log` rather than serving
    // a half-built counter.
    const electionTally = await ctx.db
      .query("election_tallies")
      .withIndex("by_election", (q) => q.eq("electionId", args.electionId))
      .unique();
    if (electionTally) {
      await ctx.db.patch(electionTally._id, { uniqueVoters: 0, countersReady: false });
    } else {
      await ctx.db.insert("election_tallies", {
        electionId: args.electionId,
        uniqueVoters: 0,
        countersReady: false,
      });
    }

    const jobId = await ctx.db.insert("tally_jobs", {
      electionId: args.electionId,
      status: "running",
      cutoff: Date.now(),
      cursor: null,
      lastStudentId: null,
      scanned: 0,
      uniqueVoters: 0,
      startedAt: Date.now(),
    });

    await ctx.scheduler.runAfter(0, internal.tallies.backfillChunk, { jobId });
    return jobId;
  },
});

/**
 * Scans one page of `voted_log` and folds it into the counters.
 *
 * Walks the `by_voter_election` index rather than `by_election` so that a
 * student's ballots arrive contiguously: a change in `studentId` between rows is
 * exactly one new voter, which is how `uniqueVoters` is accumulated without
 * carrying a set of every student across chunks.
 */
export const backfillChunk = internalMutation({
  args: { jobId: v.id("tally_jobs") },
  returns: v.null(),
  handler: async (ctx, { jobId }): Promise<null> => {
    const job = await ctx.db.get(jobId);
    if (!job || job.status === "done") return null;

    const page = await ctx.db
      .query("voted_log")
      .withIndex("by_voter_election")
      .paginate({ cursor: job.cursor, numItems: CHUNK_SIZE });

    let lastStudentId: Id<"users"> | null = job.lastStudentId;
    let newVoters = 0;

    for (const ballot of page.page) {
      if (ballot.electionId !== job.electionId) continue;
      // Counted live by `castVote` — see the cutoff rationale on
      // `startTallyBackfill`.
      if (ballot._creationTime >= job.cutoff) continue;

      if (ballot.studentId !== lastStudentId) {
        newVoters += 1;
        lastStudentId = ballot.studentId;
      }

      await bumpVoteTally(ctx, {
        electionId: ballot.electionId,
        categoryId: ballot.categoryId,
        candidateId: ballot.candidateId,
        delta: 1,
      });
    }

    if (newVoters > 0) {
      await bumpUniqueVoters(ctx, job.electionId, newVoters);
    }

    await ctx.db.patch(jobId, {
      cursor: page.isDone ? job.cursor : page.continueCursor,
      lastStudentId,
      scanned: job.scanned + page.page.length,
      uniqueVoters: job.uniqueVoters + newVoters,
      ...(page.isDone ? { status: "done" as const, completedAt: Date.now() } : {}),
    });

    if (!page.isDone) {
      await ctx.scheduler.runAfter(0, internal.tallies.backfillChunk, { jobId });
      return null;
    }

    // Every historical ballot is now folded in, so the counters are a complete
    // picture and the read paths can start trusting them.
    const electionTally = await ctx.db
      .query("election_tallies")
      .withIndex("by_election", (q) => q.eq("electionId", job.electionId))
      .unique();
    if (electionTally) {
      await ctx.db.patch(electionTally._id, { countersReady: true });
    }
    return null;
  },
});

export const getTallyJobStatus = query({
  args: { jobId: v.id("tally_jobs") },
  returns: v.union(
    v.null(),
    v.object({
      status: v.union(v.literal("running"), v.literal("done")),
      scanned: v.number(),
      uniqueVoters: v.number(),
      startedAt: v.number(),
      completedAt: v.optional(v.number()),
    }),
  ),
  handler: async (ctx, { jobId }) => {
    const user = await getUser(ctx);
    if (user.role !== "ec") throw new ConvexError("Forbidden");
    const job = await ctx.db.get(jobId);
    if (!job) return null;
    return {
      status: job.status,
      scanned: job.scanned,
      uniqueVoters: job.uniqueVoters,
      startedAt: job.startedAt,
      completedAt: job.completedAt,
    };
  },
});
