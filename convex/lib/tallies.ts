import { MutationCtx, QueryCtx } from "../_generated/server";
import { Doc, Id } from "../_generated/dataModel";

/**
 * Counter maintenance for the live dashboards.
 *
 * `voted_log` stays the source of truth for every ballot. These counters exist
 * purely so the reactive dashboard queries stop re-scanning it: a subscription
 * that reads N documents re-reads all N every time any of them changes, so a
 * single vote used to cost (rows in voted_log + rows in users) of database I/O
 * for *every* connected EC/HOD client. Reading one counter doc costs one
 * document instead.
 *
 * Counters can be rebuilt from `voted_log` at any time — see
 * `tallies:startTallyBackfill`.
 */

/** Reads a candidate's (or a category's no-vote) tally row, if it exists. */
export async function getTallyRow(
  ctx: QueryCtx | MutationCtx,
  categoryId: Id<"categories">,
  candidateId: Id<"candidates"> | undefined,
): Promise<Doc<"vote_tallies"> | null> {
  return await ctx.db
    .query("vote_tallies")
    .withIndex("by_category_and_candidate", (q) =>
      q.eq("categoryId", categoryId).eq("candidateId", candidateId),
    )
    .unique();
}

/** Adds `delta` to a candidate's (or a category's no-vote) tally, creating the row if needed. */
export async function bumpVoteTally(
  ctx: MutationCtx,
  args: {
    electionId: Id<"elections">;
    categoryId: Id<"categories">;
    candidateId?: Id<"candidates">;
    delta: number;
  },
): Promise<void> {
  const existing = await getTallyRow(ctx, args.categoryId, args.candidateId);
  if (existing) {
    await ctx.db.patch(existing._id, { count: existing.count + args.delta });
    return;
  }
  await ctx.db.insert("vote_tallies", {
    electionId: args.electionId,
    categoryId: args.categoryId,
    candidateId: args.candidateId,
    count: args.delta,
  });
}

/** Adds `delta` to an election's unique-voter count, creating the row if needed. */
export async function bumpUniqueVoters(
  ctx: MutationCtx,
  electionId: Id<"elections">,
  delta: number,
): Promise<void> {
  const existing = await ctx.db
    .query("election_tallies")
    .withIndex("by_election", (q) => q.eq("electionId", electionId))
    .unique();
  if (existing) {
    await ctx.db.patch(existing._id, { uniqueVoters: existing.uniqueVoters + delta });
    return;
  }
  // No row means this election predates the counters, so ballots cast before
  // now are not represented here. `countersReady: false` keeps the read paths
  // on the exact scan until a backfill says otherwise.
  await ctx.db.insert("election_tallies", {
    electionId,
    uniqueVoters: delta,
    countersReady: false,
  });
}

/**
 * Whether the counters for this election can be trusted as a complete picture.
 *
 * The read paths must check this before using a counter. It is the guarantee
 * that the optimisation can only ever cost latency, never accuracy.
 */
export async function countersReady(
  ctx: QueryCtx,
  electionId: Id<"elections">,
): Promise<boolean> {
  const row = await ctx.db
    .query("election_tallies")
    .withIndex("by_election", (q) => q.eq("electionId", electionId))
    .unique();
  return row?.countersReady === true;
}

/**
 * Unique voters for an election: the counter when it is trustworthy, otherwise
 * a full scan of the ballot log.
 */
export async function readUniqueVoters(
  ctx: QueryCtx,
  electionId: Id<"elections">,
): Promise<number> {
  const row = await ctx.db
    .query("election_tallies")
    .withIndex("by_election", (q) => q.eq("electionId", electionId))
    .unique();
  if (row?.countersReady === true) return row.uniqueVoters;

  const ballots = await ctx.db
    .query("voted_log")
    .withIndex("by_election", (q) => q.eq("electionId", electionId))
    .take(10000);
  return new Set(ballots.map((b) => b.studentId)).size;
}

/**
 * Vote count for a candidate (or a category's no-vote bucket): the counter when
 * it is trustworthy, otherwise a scan of that candidate's ballots.
 */
export async function readVoteCount(
  ctx: QueryCtx,
  args: {
    electionId: Id<"elections">;
    categoryId: Id<"categories">;
    candidateId?: Id<"candidates">;
  },
): Promise<number> {
  if (await countersReady(ctx, args.electionId)) {
    const row = await getTallyRow(ctx, args.categoryId, args.candidateId);
    return row?.count ?? 0;
  }

  if (args.candidateId === undefined) {
    const noVotes = await ctx.db
      .query("voted_log")
      .withIndex("by_categoryId_and_noVote", (q) =>
        q.eq("categoryId", args.categoryId).eq("noVote", true),
      )
      .take(10000);
    return noVotes.length;
  }

  const votes = await ctx.db
    .query("voted_log")
    .withIndex("by_candidate", (q) => q.eq("candidateId", args.candidateId))
    .take(10000);
  return votes.length;
}
