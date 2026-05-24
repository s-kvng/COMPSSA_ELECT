"use client";

// Lightweight local substitute for Convex-generated Id type.
// The project sometimes lacks the generated dataModel during type-checking
// (e.g. before running codegen). Use a simple alias to avoid import errors.
export type Id<T extends string> = string;

// ---------------------------------------------------------------------------
// Role
// ---------------------------------------------------------------------------

export type UserRole = "student" | "candidate" | "ec" | "hod";

// ---------------------------------------------------------------------------
// CurrentUser
// ---------------------------------------------------------------------------

/**
 * The authenticated user as returned by `api.users.getCurrentUser`.
 *
 * Matches the projection in `convex/users.ts` exactly.
 * `tokenIdentifier` is intentionally excluded — it is an internal
 * join key and must never reach the UI layer.
 */
export type CurrentUser = {
  _id: Id<"users">;
  name: string;
  email: string;
  studentId: string;
  role: UserRole;
  isFirstLogin: boolean;
};

// ---------------------------------------------------------------------------
// AuthState — discriminated union
// ---------------------------------------------------------------------------

/**
 * Discriminated union representing every possible auth state.
 *
 * Consumers must handle all three variants. This prevents the common
 * mistake of rendering authenticated UI while `status === "loading"`.
 *
 *   switch (authState.status) {
 *     case "loading":        // Convex has not yet responded
 *     case "unauthenticated": // No valid session
 *     case "authenticated":  // user is present and typed
 *   }
 */
export type AuthState =
  | { status: "loading" }
  | { status: "unauthenticated" }
  | { status: "authenticated"; user: CurrentUser };
