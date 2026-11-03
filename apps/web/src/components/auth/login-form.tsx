"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { LoaderCircle } from "lucide-react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";
import { useAuth } from "@/hooks/use-auth";
import { authClient } from "@/lib/auth-client";
import { getSafeReturnTo } from "@/lib/auth-redirect";
import { AuthShell } from "./auth-shell";
import { PasswordInput } from "./password-input";

const loginSchema = z.object({
  email: z.string().email("Enter a valid email address."),
  password: z.string().min(1, "Enter your password."),
});

type LoginValues = z.infer<typeof loginSchema>;

export function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const returnTo = getSafeReturnTo(searchParams.get("callbackUrl"));
  const { isAuthenticated, isPending } = useAuth();
  const [googleLoading, setGoogleLoading] = useState(false);
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LoginValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: "", password: "" },
  });

  useEffect(() => {
    if (!isPending && isAuthenticated) router.replace(returnTo);
  }, [isAuthenticated, isPending, returnTo, router]);

  const onSubmit = handleSubmit(async (values) => {
    try {
      const result = await authClient.signIn.email({
        ...values,
        callbackURL: new URL(returnTo, window.location.origin).toString(),
      });

      if (result.error) {
        toast.error(result.error.message ?? "Unable to sign in. Check your details and try again.");
        return;
      }

      toast.success("Welcome back!");
      router.replace(returnTo);
      router.refresh();
    } catch {
      toast.error("Unable to reach the authentication service. Please try again.");
    }
  });

  const signInWithGoogle = async () => {
    setGoogleLoading(true);
    try {
      const result = await authClient.signIn.social({
        provider: "google",
        callbackURL: new URL(returnTo, window.location.origin).toString(),
      });
      if (result.error) {
        toast.error(result.error.message ?? "Google sign-in is unavailable.");
        setGoogleLoading(false);
      }
    } catch {
      toast.error("Google sign-in is unavailable. Check the API OAuth configuration.");
      setGoogleLoading(false);
    }
  };

  return (
    <AuthShell
      title="Welcome back"
      description="Sign in to pick up where your creativity left off."
      footer={
        <>
          New to StudioSpace?{" "}
          <Link
            href={`/register${returnTo === "/" ? "" : `?callbackUrl=${encodeURIComponent(returnTo)}`}`}
            className="font-semibold text-primary hover:underline"
          >
            Create an account
          </Link>
        </>
      }
    >
      <button
        type="button"
        onClick={() => void signInWithGoogle()}
        disabled={isPending || googleLoading || isSubmitting}
        className="flex h-11 w-full items-center justify-center gap-3 rounded-md border bg-background text-sm font-medium transition hover:bg-muted disabled:cursor-not-allowed disabled:opacity-60"
      >
        {googleLoading ? (
          <LoaderCircle className="animate-spin" size={18} />
        ) : (
          <span aria-hidden="true" className="text-base font-bold text-[#4285F4]">G</span>
        )}
        Continue with Google
      </button>

      <div className="my-6 flex items-center gap-4 text-xs text-muted-foreground">
        <span className="h-px flex-1 bg-border" />
        OR CONTINUE WITH EMAIL
        <span className="h-px flex-1 bg-border" />
      </div>

      <form className="space-y-5" onSubmit={onSubmit} noValidate>
        <div className="space-y-2">
          <label htmlFor="email" className="text-sm font-medium">Email</label>
          <input
            id="email"
            type="email"
            autoComplete="email"
            placeholder="you@example.com"
            aria-invalid={Boolean(errors.email)}
            className="h-11 w-full rounded-md border bg-background px-3 text-sm outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/15"
            {...register("email")}
          />
          {errors.email && <p className="text-xs text-destructive">{errors.email.message}</p>}
        </div>

        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <label htmlFor="password" className="text-sm font-medium">Password</label>
          </div>
          <PasswordInput
            id="password"
            autoComplete="current-password"
            placeholder="Enter your password"
            aria-invalid={Boolean(errors.password)}
            {...register("password")}
          />
          {errors.password && <p className="text-xs text-destructive">{errors.password.message}</p>}
        </div>

        <button
          type="submit"
          disabled={isPending || isSubmitting || googleLoading}
          className="flex h-11 w-full items-center justify-center gap-2 rounded-md bg-primary px-4 text-sm font-semibold text-primary-foreground transition hover:bg-primary/90 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {isSubmitting && <LoaderCircle className="animate-spin" size={18} />}
          Sign in
        </button>
      </form>
    </AuthShell>
  );
}
