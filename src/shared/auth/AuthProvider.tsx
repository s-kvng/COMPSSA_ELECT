"use client";

import React, {
  createContext,
  useContext,
  useMemo,
  type ReactNode,
} from "react";
import { useQuery } from "convex/react";
import { z } from "zod";
import { api } from "../../../convex/_generated/api";
import type { AuthState } from "./types";

const currentUserSchema = z.object({
  _id: z.string(),
  name: z.string(),
  email: z.string(),
  studentId: z.string(),
  role: z.union([
    z.literal("student"),
    z.literal("candidate"),
    z.literal("ec"),
    z.literal("hod"),
  ]),
  isFirstLogin: z.boolean(),
});

type AuthContextValue = { authState: AuthState };

const AuthContext = createContext<AuthContextValue | undefined>(undefined);
AuthContext.displayName = "AuthContext";

export function useAuthContext(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (ctx === undefined) {
    throw new Error("[AuthProvider] useAuthContext must be called inside <AuthProvider>.");
  }
  return ctx;
}

function AuthStateProvider({ children }: { children: ReactNode }) {
  const queryResult = useQuery(api.users.getCurrentUser);

  const authState = useMemo<AuthState>(() => {
    if (queryResult === undefined) return { status: "loading" };
    if (queryResult === null) return { status: "unauthenticated" };

    const parsed = currentUserSchema.safeParse(queryResult);
    if (!parsed.success) {
      console.error("[AuthProvider] getCurrentUser returned an invalid shape.", parsed.error);
      return { status: "unauthenticated" };
    }
    return { status: "authenticated", user: parsed.data };
  }, [queryResult]);

  const value = useMemo<AuthContextValue>(() => ({ authState }), [authState]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function AuthProvider({ children }: { children: ReactNode }) {
  return <AuthStateProvider>{children}</AuthStateProvider>;
}
