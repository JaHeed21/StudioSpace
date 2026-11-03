import { Suspense } from "react";
import { LoadingState } from "@/components/feedback/loading-state";
import { RegisterForm } from "@/components/auth/register-form";

export default function RegisterPage() {
  return (
    <Suspense
      fallback={
        <main className="flex min-h-screen items-center justify-center">
          <LoadingState label="Loading registration" />
        </main>
      }
    >
      <RegisterForm />
    </Suspense>
  );
}
