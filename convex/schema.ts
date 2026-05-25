import { authTables } from "@convex-dev/auth/server";
import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export const userRoleValidator = v.union(
  v.literal("student"),
  v.literal("candidate"),
  v.literal("ec"),
  v.literal("hod"),
);

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
  })
    .index("by_email", ["email"])
    .index("by_student_id", ["studentId"]),

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
    count: v.number(),
  })
    .index("by_election", ["electionId"])
    .index("by_category", ["categoryId"])
    .index("by_user_election", ["userId", "electionId"]),

  voted_log: defineTable({
    electionId: v.id("elections"),
    studentId: v.id("users"),
    categoryId: v.id("categories"),
    timestamp: v.number(),
  })
    .index("by_voter_category", ["studentId", "categoryId"])
    .index("by_election", ["electionId"]),

  ec_action_log: defineTable({
    electionId: v.id("elections"),
    action: v.string(),
    actorId: v.id("users"),
    timestamp: v.number(),
    metadata: v.optional(v.string()),
  }).index("by_election", ["electionId"]),
});
