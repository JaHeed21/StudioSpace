import { Suspense } from "react";
import { LoadingState } from "@/components/feedback/loading-state";
import { LoginForm } from "@/components/auth/login-form";

export default function LoginPage() {
  return (
    <Suspense
      fallback={
        <main className="flex min-h-screen items-center justify-center">
          <LoadingState label="Loading sign in" />
        </main>
      }
    >
      <LoginForm />
    </Suspense>
  );
}
