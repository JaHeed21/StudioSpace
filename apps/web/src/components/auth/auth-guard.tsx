"use client";

import type { ReactNode } from "react";
import { useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";
import { ErrorState } from "@/components/feedback/error-state";
import { LoadingState } from "@/components/feedback/loading-state";
import { useAuth } from "@/hooks/use-auth";

export function AuthGuard({ children }: { children: ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const { isAuthenticated, isPending, error } = useAuth();

  useEffect(() => {
    if (!isPending && !error && !isAuthenticated) {
      const returnTo = `${pathname}${window.location.search}${window.location.hash}`;
      router.replace(`/login?callbackUrl=${encodeURIComponent(returnTo)}`);
    }
  }, [error, isAuthenticated, isPending, pathname, router]);

  if (isPending) {
    return (
      <main className="flex min-h-screen items-center justify-center">
        <LoadingState label="Checking your session" />
      </main>
    );
  }

  if (error) {
    return (
      <main className="mx-auto flex min-h-screen max-w-xl items-center px-6">
        <ErrorState
          title="Could not verify your session"
          message="Check your connection and reload the page."
        />
      </main>
    );
  }

  if (!isAuthenticated) {
    return (
      <main className="flex min-h-screen items-center justify-center">
        <LoadingState label="Redirecting to sign in" />
      </main>
    );
  }

  return children;
}
