import { v } from "convex/values";
import {
  internalQuery,
  mutation,
  query,
} from "./_generated/server";
import { userRoleValidator } from "./schema";
import type { Id } from "./_generated/dataModel";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

/**
 * The shape returned to the frontend for the currently authenticated user.
 * Matches `CurrentUser` in `src/shared/roles/types.ts`.
 *
 * Security note: passwordHash and other internal fields are never included.
 */
export type CurrentUserResult = {
  _id: Id<"users">;
  name: string;
  email: string;
  studentId: string;
  role: "student" | "candidate" | "ec" | "hod";
  isFirstLogin: boolean;
};

// ---------------------------------------------------------------------------
// Internal helpers
// ---------------------------------------------------------------------------

/**
 * Resolves the application `users` document from the current Convex Auth
 * session identity. Returns `null` if unauthenticated or if no user document
 * exists for the token (e.g. auth account created but import not yet run).
 *
 * Used internally by queries and mutations that need the current user.
 * Not exposed to the frontend directly — use `getCurrentUser` instead.
 */
async function resolveCurrentUser(ctx: {
  auth: { getUserIdentity: () => Promise<{ tokenIdentifier: string } | null> };
  db: { query: (table: string) => { withIndex: (...args: unknown[]) => { unique: () => Promise<unknown> } } };
}) {
  const identity = await ctx.auth.getUserIdentity();
  if (identity === null) return null;

  const user = await ctx.db
    .query("users")
    .withIndex("by_token", (q: { eq: (field: string, value: string) => unknown }) =>
      q.eq("tokenIdentifier", identity.tokenIdentifier),
    )
    .unique();

  return user ?? null;
}

// ---------------------------------------------------------------------------
// Queries
// ---------------------------------------------------------------------------

/**
 * Returns the currently authenticated user's application record.
 *
 * Returns `null` when:
 *  - The request is unauthenticated (no valid session token)
 *  - A Convex Auth account exists but the corresponding `users` document
 *    has not yet been created by the EC import flow
 *
 * This query is reactive — the frontend's `AuthProvider` subscribes to it.
 * Any server-side change to the user document (e.g. `isFirstLogin` cleared)
 * is automatically pushed to all connected clients.
 *
 * Security: only returns the caller's own user record. No cross-user access.
 */
export const getCurrentUser = query({
  args: {},
  returns: v.union(
    v.object({
      _id: v.id("users"),
      name: v.string(),
      email: v.string(),
      studentId: v.string(),
      role: userRoleValidator,
      isFirstLogin: v.boolean(),
    }),
    v.null(),
  ),
  handler: async (ctx): Promise<CurrentUserResult | null> => {
    const identity = await ctx.auth.getUserIdentity();
    if (identity === null) return null;

    const user = await ctx.db
      .query("users")
      .withIndex("by_token", (q) =>
        q.eq("tokenIdentifier", identity.tokenIdentifier),
      )
      .unique();

    if (user === null) return null;

    // Return only the fields the frontend needs.
    // Never include internal fields.
    return {
      _id: user._id,
      name: user.name,
      email: user.email,
      studentId: user.studentId,
      role: user.role,
      isFirstLogin: user.isFirstLogin,
    };
  },
});

/**
 * Internal query: resolve a user document by their Convex Auth token identifier.
 *
 * Used by other Convex functions (mutations, scheduled jobs) that need to
 * look up a user given a token string. Not callable from the frontend.
 *
 * Returns `null` if no matching user document exists.
 */
export const getUserByToken = internalQuery({
  args: {
    tokenIdentifier: v.string(),
  },
  returns: v.union(
    v.object({
      _id: v.id("users"),
      name: v.string(),
      email: v.string(),
      studentId: v.string(),
      role: userRoleValidator,
      isFirstLogin: v.boolean(),
      tokenIdentifier: v.string(),
    }),
    v.null(),
  ),
  handler: async (ctx, args) => {
    const user = await ctx.db
      .query("users")
      .withIndex("by_token", (q) =>
        q.eq("tokenIdentifier", args.tokenIdentifier),
      )
      .unique();

    if (user === null) return null;

    return {
      _id: user._id,
      name: user.name,
      email: user.email,
      studentId: user.studentId,
      role: user.role,
      isFirstLogin: user.isFirstLogin,
      tokenIdentifier: user.tokenIdentifier,
    };
  },
});

// ---------------------------------------------------------------------------
// Mutations
// ---------------------------------------------------------------------------

/**
 * Marks the current user's first-login requirement as complete.
 *
 * Called after the user successfully sets a new password on the
 * `/first-login` page. The actual password update is handled by
 * Convex Auth's `signIn("password", { flow: "reset-verification" })`
 * or equivalent update flow — this mutation only clears the flag.
 *
 * Security requirements enforced here:
 *  1. Caller must be authenticated — unauthenticated calls are rejected.
 *  2. `isFirstLogin` must currently be `true` — prevents replay / double-call.
 *  3. Users can only clear their own flag — no userId parameter accepted.
 *
 * After this mutation succeeds, `getCurrentUser` will reactively push the
 * updated record to the frontend, which triggers the redirect to `/vote`.
 */
export const setIsFirstLoginComplete = mutation({
  args: {},
  returns: v.null(),
  handler: async (ctx): Promise<null> => {
    // 1. Require authentication.
    const identity = await ctx.auth.getUserIdentity();
    if (identity === null) {
      throw new Error("Unauthenticated: must be signed in to complete first login.");
    }

    // 2. Resolve the application user record.
    const user = await ctx.db
      .query("users")
      .withIndex("by_token", (q) =>
        q.eq("tokenIdentifier", identity.tokenIdentifier),
      )
      .unique();

    if (user === null) {
      throw new Error("User record not found. Contact the Electoral Commission.");
    }

    // 3. Guard: only allow if first login is still pending.
    //    Prevents the mutation from being called repeatedly or out of sequence.
    if (!user.isFirstLogin) {
      // Idempotent: already completed — not an error, just a no-op.
      // This can happen if the client sends the request twice due to a
      // network retry. Returning cleanly avoids a confusing error state.
      return null;
    }

    // 4. Clear the flag. This is the only place isFirstLogin is set to false.
    await ctx.db.patch(user._id, { isFirstLogin: false });

    return null;
  },
});

/**
 * Creates a new application user record.
 *
 * Called by the EC bulk import flow (Phase 2) after Convex Auth has
 * created the auth account for the student. Links the auth identity
 * (via tokenIdentifier) to the application user document.
 *
 * Security requirements:
 *  1. Caller must be authenticated as an EC member.
 *  2. Email must not already exist in the users table.
 *  3. studentId must not already exist in the users table.
 *
 * `isFirstLogin` is always set to `true` on creation — the student
 * must change their password before accessing the application.
 *
 * Note: This mutation is intentionally exposed as a public mutation
 * so the EC frontend can call it. In Phase 2, an internal version
 * will also exist for the bulk import scheduled job path.
 */
export const createUser = mutation({
  args: {
    name: v.string(),
    email: v.string(),
    studentId: v.string(),
    role: userRoleValidator,
    tokenIdentifier: v.string(),
  },
  returns: v.id("users"),
  handler: async (ctx, args): Promise<Id<"users">> => {
    // 1. Require authentication.
    const identity = await ctx.auth.getUserIdentity();
    if (identity === null) {
      throw new Error("Unauthenticated: must be signed in to create a user.");
    }

    // 2. Require EC role on the caller.
    const caller = await ctx.db
      .query("users")
      .withIndex("by_token", (q) =>
        q.eq("tokenIdentifier", identity.tokenIdentifier),
      )
      .unique();

    if (caller === null) {
      throw new Error("Caller user record not found.");
    }

    if (caller.role !== "ec") {
      throw new Error("Forbidden: only EC members can create user accounts.");
    }

    // 3. Prevent duplicate email.
    const existingByEmail = await ctx.db
      .query("users")
      .withIndex("by_email", (q) => q.eq("email", args.email))
      .unique();

    if (existingByEmail !== null) {
      throw new Error(`A user with email "${args.email}" already exists.`);
    }

    // 4. Prevent duplicate studentId.
    const existingByStudentId = await ctx.db
      .query("users")
      .withIndex("by_student_id", (q) => q.eq("studentId", args.studentId))
      .unique();

    if (existingByStudentId !== null) {
      throw new Error(
        `A user with student ID "${args.studentId}" already exists.`,
      );
    }

    // 5. Insert the user. isFirstLogin is always true on creation.
    const userId = await ctx.db.insert("users", {
      name: args.name,
      email: args.email,
      studentId: args.studentId,
      role: args.role,
      isFirstLogin: true,
      tokenIdentifier: args.tokenIdentifier,
    });

    return userId;
  },
});
