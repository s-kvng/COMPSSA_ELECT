"use client";

import React, {
  createContext,
  useContext,
  useMemo,
  type ReactNode,
} from "react";
import { ConvexAuthProvider } from "@convex-dev/auth/react";
import { ConvexReactClient } from "convex/react";
import { useQuery } from "convex/react";
import { api } from "../../../convex/_generated/api";
import type { AuthState, CurrentUser } from "./types";

// ---------------------------------------------------------------------------
// Convex client
// ---------------------------------------------------------------------------

/**
 * Single shared Convex client instance.
 *
 * Created once at module load. Must be passed to both `ConvexAuthProvider`
 * and any `ConvexReactClient` consumers so they share the same connection
 * and subscription multiplexing.
 *
 * NEXT_PUBLIC_CONVEX_URL is set by `npx convex dev` in `.env.local`.
 */
const convexClient = new ConvexReactClient(
  process.env.NEXT_PUBLIC_CONVEX_URL as string,
);

// ---------------------------------------------------------------------------
// Context
// ---------------------------------------------------------------------------

/**
 * Internal context value shape.
 * The `undefined` sentinel lets `useAuthContext` detect missing provider.
 */
type AuthContextValue = {
  authState: AuthState;
};

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

AuthContext.displayName = "AuthContext";

// ---------------------------------------------------------------------------
// Internal hook — raw context access
// ---------------------------------------------------------------------------

/**
 * Raw context accessor used by the public hooks below.
 * Throws a clear error if called outside `<AuthProvider>`.
 */
export function useAuthContext(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (ctx === undefined) {
    throw new Error(
      "[AuthProvider] useAuthContext must be called inside <AuthProvider>. " +
        "Ensure <AuthProvider> wraps your application root.",
    );
  }
  return ctx;
}

// ---------------------------------------------------------------------------
// Inner provider — runs inside ConvexAuthProvider where useQuery is valid
// ---------------------------------------------------------------------------

/**
 * Separated from `AuthProvider` so that `useQuery` (which requires
 * `ConvexProvider` in the tree) is never called before its provider mounts.
 *
 * Hydration strategy:
 *   - `useQuery` returns `undefined` while the Convex connection is
 *     establishing and the first response has not arrived → "loading"
 *   - Returns `null` when the query resolves but no session exists → "unauthenticated"
 *   - Returns a `CurrentUser` object when authenticated → "authenticated"
 *
 * This three-state model prevents flickers: `RouteGuard` will not redirect
 * until `status !== "loading"`, ensuring we never redirect based on stale state.
 */
function AuthStateProvider({ children }: { children: ReactNode }) {
  /**
   * This is the ONLY place in the entire codebase that calls `getCurrentUser`.
   * All auth state consumers read from context — never call this query directly.
   *
   * `useQuery` from `convex/react` returns:
   *   undefined  → query in flight (loading)
   *   null       → query resolved, no authenticated user
   *   CurrentUser → query resolved, user is authenticated
   */
  const queryResult = useQuery(api.users.getCurrentUser);

  const authState = useMemo<AuthState>(() => {
    if (queryResult === undefined) {
      return { status: "loading" };
    }
    if (queryResult === null) {
      return { status: "unauthenticated" };
    }
    return { status: "authenticated", user: queryResult as CurrentUser };
  }, [queryResult]);

  const value = useMemo<AuthContextValue>(
    () => ({ authState }),
    [authState],
  );

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

// ---------------------------------------------------------------------------
// Public AuthProvider
// ---------------------------------------------------------------------------

type AuthProviderProps = {
  children: ReactNode;
};

/**
 * `AuthProvider` — mount once at the application root (`app/layout.tsx`).
 *
 * Responsibilities:
 *  1. Mounts `ConvexAuthProvider` (provides session token management,
 *     sign-in/sign-out actions, and the Convex client connection).
 *  2. Reactively subscribes to `api.users.getCurrentUser` via Convex's
 *     live query system — any server-side change to the user document
 *     (e.g. `isFirstLogin` cleared) is automatically pushed to all
 *     connected clients without polling.
 *  3. Exposes the derived `AuthState` discriminated union through
 *     `AuthContext` so that `useCurrentUser` and `useAuthState` can
 *     be called anywhere in the tree.
 *
 * This component is intentionally split into two layers:
 *  - `AuthProvider` (outer): owns the Convex client and auth session
 *  - `AuthStateProvider` (inner): calls useQuery once ConvexAuthProvider is mounted
 *
 * Usage:
 *   // app/layout.tsx
 *   export default function RootLayout({ children }) {
 *     return (
 *       <html>
 *         <body>
 *           <AuthProvider>{children}</AuthProvider>
 *         </body>
 *       </html>
 *     );
 *   }
 */
export function AuthProvider({ children }: AuthProviderProps) {
  return (
    <ConvexAuthProvider client={convexClient}>
      <AuthStateProvider>{children}</AuthStateProvider>
    </ConvexAuthProvider>
  );
}
