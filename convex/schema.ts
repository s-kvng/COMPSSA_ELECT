import { authTables } from "@convex-dev/auth/server";
import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

/**
 * User roles:
 *  - student   : base role, can vote
 *  - candidate : inherits student permissions + can view own tally
 *  - ec        : Electoral Commission, full election management
 *  - hod       : Head of Department, read-only live observer
 */
export const userRoleValidator = v.union(
  v.literal("student"),
  v.literal("candidate"),
  v.literal("ec"),
  v.literal("hod"),
);

export default defineSchema(
  {
    /**
     * Application users.
     *
     * `tokenIdentifier` links this record to the Convex Auth identity
     * via `ctx.auth.getUserIdentity()`. It is the primary join key between
     * the auth layer and the application layer.
     *
     * `isFirstLogin` is a security control: when true, the user must change
     * their password before accessing any other part of the application.
     * It is set to true on account creation and cleared server-side only —
     * never by client input alone.
     */
    users: defineTable({
      name: v.string(),
      email: v.string(),
      studentId: v.string(),
      role: userRoleValidator,
      isFirstLogin: v.boolean(),
      /**
       * Convex Auth identity subject string.
       * Format: "<provider>|<userId>"  e.g. "password|abc123"
       * Stored here so we can look up the application user from any
       * authenticated request without a secondary index on email.
       */
      tokenIdentifier: v.string(),
    })
      .index("by_token", ["tokenIdentifier"])
      .index("by_email", ["email"])
      .index("by_student_id", ["studentId"]),
  },
  {
    /**
     * Merge Convex Auth's required internal tables (sessions, accounts, etc.)
     * into the schema. These are managed entirely by the auth library.
     */
    ...authTables,
  },
);
