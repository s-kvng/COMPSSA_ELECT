/**
 * Shared auth module — public API
 *
 * Import from here, not from individual files:
 *   import { AuthProvider, useCurrentUser, useAuthState } from "@/shared/auth";
 */

export { AuthProvider } from "./AuthProvider";
export { useCurrentUser } from "./useCurrentUser";
export {
  useAuthState,
  useIsAuthenticated,
  useIsAuthLoading,
  useAuthUser,
} from "./useAuthState";
export type { AuthState, CurrentUser, UserRole } from "./types";
