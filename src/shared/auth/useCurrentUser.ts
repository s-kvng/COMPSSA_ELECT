"use client";

import { useAuthContext } from "./AuthProvider";
import type { CurrentUser } from "./types";

/**
 * Returns the currently authenticated user, or `null` when unauthenticated.
 *
 * Returns `null` during the loading state as well — callers that need to
 * distinguish loading from unauthenticated should use `useAuthState()` instead.
 *
 * Throws if called outside `<AuthProvider>`.
 *
 * Usage:
 *   const user = useCurrentUser();
 *   if (!user) return null; // not authenticated (or still loading)
 *   // user is typed as CurrentUser
 *
 * Common pattern in components that are always rendered inside a route guard
 * (and therefore always have a user by the time they render):
 *
 *   const user = useCurrentUser();
 *   if (!user) return null; // guard: RouteGuard prevents this in practice
 */
export function useCurrentUser(): CurrentUser | null {
  const { authState } = useAuthContext();

  if (authState.status === "authenticated") {
    return authState.user;
  }

  return null;
}
