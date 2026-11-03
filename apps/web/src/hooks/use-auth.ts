"use client";

import { authClient } from "@/lib/auth-client";

export function useAuth() {
  const { data: session, isPending, error } = authClient.useSession();

  return {
    session,
    user: session?.user ?? null,
    isPending,
    error,
    isAuthenticated: Boolean(session),
  };
}
