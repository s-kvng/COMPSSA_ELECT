"use client";

import { useAuthContext } from "./AuthProvider";
import type { AuthState, CurrentUser } from "./types";

/**
 * Returns the full `AuthState` discriminated union.
 *
 * Use this hook when you need to distinguish between all three states:
 * loading, unauthenticated, and authenticated. The primary consumer
 * is `RouteGuard`, which must not redirect until loading is complete.
 *
 * Throws if called outside `<AuthProvider>`.
 *
 * Usage:
 *   const authState = useAuthState();
 *
 *   if (authState.status === "loading") {
 *     return <LoadingSkeleton />;
 *   }
 *   if (authState.status === "unauthenticated") {
 *     redirect("/login");
 *   }
 *   // authState.status === "authenticated"
 *   const { user } = authState; // user: CurrentUser
 *
 * For simple cases where you only need the user or null, prefer
 * `useCurrentUser()`.
 */
export function useAuthState(): AuthState {
  const { authState } = useAuthContext();
  return authState;
}

// ---------------------------------------------------------------------------
// Derived convenience selectors
// ---------------------------------------------------------------------------

/**
 * Returns true only when auth state is fully resolved and a user is present.
 * Returns false during loading and when unauthenticated.
 *
 * Type-narrows to `{ status: "authenticated"; user: CurrentUser }` when true.
 */
export function useIsAuthenticated(): boolean {
  const authState = useAuthState();
  return authState.status === "authenticated";
}

/**
 * Returns true while Convex has not yet responded to the `getCurrentUser` query.
 *
 * Use this to render skeleton UI and prevent premature redirects.
 */
export function useIsAuthLoading(): boolean {
  const authState = useAuthState();
  return authState.status === "loading";
}

/**
 * Returns the user if authenticated, otherwise null.
 * Does not distinguish loading from unauthenticated.
 *
 * Identical to `useCurrentUser()` — provided here as a named export
 * alongside the other selectors for callsite consistency.
 */
export function useAuthUser(): CurrentUser | null {
  const authState = useAuthState();
  return authState.status === "authenticated" ? authState.user : null;
}
