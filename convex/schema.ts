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

  ec_action_log: defineTable({
    electionId: v.id("elections"),
    action: v.string(),
    actorId: v.id("users"),
    timestamp: v.number(),
    metadata: v.optional(v.string()),
  }).index("by_election", ["electionId"]),
});
