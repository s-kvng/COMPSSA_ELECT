import { authTables } from "@convex-dev/auth/server";
import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export const userRoleValidator = v.union(
  v.literal("student"),
  v.literal("candidate"),
  v.literal("ec"),
  v.literal("hod"),
);

export const sexValidator = v.union(v.literal("M"), v.literal("F"));
export const studentTypeValidator = v.union(v.literal("regular"), v.literal("weekend"));

export const electionStatusValidator = v.union(
  v.literal("draft"),
  v.literal("ready"),
  v.literal("active"),
  v.literal("closed"),
  v.literal("published"),
);

export const studentLevelValidator = v.union(
  v.literal(100),
  v.literal(200),
  v.literal(300),
  v.literal(400),
);

export const seedJobStatusValidator = v.union(v.literal("running"), v.literal("done"));

export default defineSchema({
  ...authTables,

  users: defineTable({
    name: v.string(),
    email: v.string(),
    studentId: v.string(),
    role: userRoleValidator,
    isFirstLogin: v.boolean(),
    phone: v.optional(v.string()),
    level: v.optional(v.number()),
    sex: v.optional(sexValidator),
    regular: v.optional(studentTypeValidator),
    programme: v.optional(v.string()),
  })
    .index("by_email", ["email"])
    .index("by_student_id", ["studentId"])
    .index("by_role", ["role"])
    .searchIndex("search_name", { searchField: "name" }),

  elections: defineTable({
    title: v.string(),
    description: v.optional(v.string()),
    status: electionStatusValidator,
    startTime: v.number(),
    endTime: v.number(),
    earlyClosedAt: v.optional(v.number()),
    publishedAt: v.optional(v.number()),
  }).index("by_status", ["status"]),

  categories: defineTable({
    electionId: v.id("elections"),
    name: v.string(),
    description: v.optional(v.string()),
  }).index("by_election", ["electionId"]),

  candidates: defineTable({
    electionId: v.id("elections"),
    categoryId: v.id("categories"),
    userId: v.id("users"),
    bio: v.optional(v.string()),
    photoStorageId: v.optional(v.id("_storage")),
  })
    .index("by_election", ["electionId"])
    .index("by_category", ["categoryId"])
    .index("by_user", ["userId"])
    .index("by_user_election", ["userId", "electionId"]),

  voted_log: defineTable({
    electionId: v.id("elections"),
    studentId: v.id("users"),
    categoryId: v.id("categories"),
    candidateId: v.optional(v.id("candidates")),
    noVote: v.optional(v.boolean()),
    timestamp: v.number(),
  })
    .index("by_voter_category", ["studentId", "categoryId"])
    .index("by_voter_election", ["studentId", "electionId"])
    .index("by_election", ["electionId"])
    .index("by_candidate", ["candidateId"])
    .index("by_categoryId_and_noVote", ["categoryId", "noVote"]),

  // Denormalised turnout counter — one doc per election. Maintained by
  // `castVote` so the live dashboards never have to scan `voted_log` to answer
  // "how many students have voted". Rebuild with `tallies:startTallyBackfill`.
  election_tallies: defineTable({
    electionId: v.id("elections"),
    uniqueVoters: v.number(),
    // False until every pre-existing ballot has been folded in by
    // `tallies:startTallyBackfill`. While false the read paths ignore the
    // counters entirely and scan `voted_log` instead, so a missing or
    // half-built counter can never surface as a wrong vote count — only as a
    // slower query. Set true at election creation (nothing to backfill) or on
    // backfill completion. Optional so no existing row needs migrating: absent
    // reads as not-ready, which is the safe direction to fail.
    countersReady: v.optional(v.boolean()),
  }).index("by_election", ["electionId"]),

  // Denormalised vote counter — one doc per (category, candidate), plus one
  // per category with `candidateId` unset holding that category's no-vote
  // count. Same rationale as `election_tallies`: keeps `results:electionResults`
  // off a full `voted_log` scan per candidate per subscriber per vote.
  vote_tallies: defineTable({
    electionId: v.id("elections"),
    categoryId: v.id("categories"),
    candidateId: v.optional(v.id("candidates")),
    count: v.number(),
  })
    .index("by_election", ["electionId"])
    .index("by_candidate", ["candidateId"])
    .index("by_category_and_candidate", ["categoryId", "candidateId"]),

  // Tracks a `tallies:startTallyBackfill` run — the chunked rebuild of the two
  // counter tables above from the `voted_log` source of truth. Chunked for the
  // same reason as `seed_jobs`: a full election's ballots exceed the per-mutation
  // document-read limit. Poll with `tallies:getTallyJobStatus`.
  tally_jobs: defineTable({
    electionId: v.id("elections"),
    status: seedJobStatusValidator,
    // Only ballots created strictly before this are counted by the backfill;
    // anything newer was already counted live by `castVote`.
    cutoff: v.number(),
    cursor: v.union(v.string(), v.null()),
    // Last `studentId` seen. The backfill walks `by_voter_election`, where a
    // student's ballots are contiguous, so a change here means a new voter —
    // that is how `uniqueVoters` is derived without holding a set in memory.
    lastStudentId: v.union(v.id("users"), v.null()),
    scanned: v.number(),
    uniqueVoters: v.number(),
    startedAt: v.number(),
    completedAt: v.optional(v.number()),
  }).index("by_election", ["electionId"]),

  ec_action_log: defineTable({
    electionId: v.id("elections"),
    action: v.string(),
    actorId: v.id("users"),
    timestamp: v.number(),
    metadata: v.optional(v.string()),
  }).index("by_election", ["electionId"]),

  // Tracks a `seedStudents` run that spans multiple scheduled action
  // invocations (chunked to stay under Convex's per-function resource
  // limits on large batches). Poll with `seed:getSeedJobStatus`.
  seed_jobs: defineTable({
    level: v.optional(studentLevelValidator),
    status: seedJobStatusValidator,
    totalStudents: v.number(),
    processedIndex: v.number(),
    seeded: v.number(),
    skipped: v.number(),
    smsSent: v.number(),
    smsFailed: v.number(),
    errorCount: v.number(),
    // Bounded sample of error messages — full count is in `errorCount`.
    errors: v.array(v.string()),
    startedAt: v.number(),
    completedAt: v.optional(v.number()),
  }).index("by_status", ["status"]),

  // Tracks a `resetAllStudentPasswords` run that spans multiple scheduled
  // action invocations (same chunking rationale as `seed_jobs`). The target
  // user set is snapshotted at job creation so chunking stays a simple
  // index offset. Poll with `users:getResetJobStatus`.
  reset_jobs: defineTable({
    status: seedJobStatusValidator,
    userIds: v.array(v.id("users")),
    totalStudents: v.number(),
    processedIndex: v.number(),
    reset: v.number(),
    smsSent: v.number(),
    smsFailed: v.number(),
    errorCount: v.number(),
    errors: v.array(v.string()),
    startedAt: v.number(),
    completedAt: v.optional(v.number()),
  }).index("by_status", ["status"]),

  // Tracks a `smsRecovery:recoverFailedSms` run — the targeted re-issue of
  // credentials to students whose SMS was lost when one malformed number
  // 422'd their whole Arkesel batch. Separate from `reset_jobs` so a recovery
  // run is never confused with the bulk reset it is repairing, and carries
  // `skippedInvalid` for the students held back pending a phone correction.
  sms_recovery_jobs: defineTable({
    status: seedJobStatusValidator,
    userIds: v.array(v.id("users")),
    totalStudents: v.number(),
    processedIndex: v.number(),
    reset: v.number(),
    smsSent: v.number(),
    smsFailed: v.number(),
    skippedInvalid: v.number(),
    errorCount: v.number(),
    errors: v.array(v.string()),
    startedAt: v.number(),
    completedAt: v.optional(v.number()),
  }).index("by_status", ["status"]),
});
