"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { LoaderCircle } from "lucide-react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";
import { useAuth } from "@/hooks/use-auth";
import { authClient } from "@/lib/auth-client";
import { getSafeReturnTo } from "@/lib/auth-redirect";
import { AuthShell } from "./auth-shell";
import { PasswordInput } from "./password-input";

const registerSchema = z
  .object({
    name: z.string().trim().min(2, "Enter your full name.").max(100, "Name is too long."),
    email: z.string().email("Enter a valid email address."),
    image: z.union([z.literal(""), z.string().url("Enter a valid image URL.")]),
    password: z
      .string()
      .min(6, "Password must be at least 6 characters.")
      .max(128, "Password must be 128 characters or fewer.")
      .regex(/[a-z]/, "Include at least one lowercase letter.")
      .regex(/[A-Z]/, "Include at least one uppercase letter."),
  });

type RegisterValues = z.infer<typeof registerSchema>;

export function RegisterForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const returnTo = getSafeReturnTo(searchParams.get("callbackUrl"));
  const { isAuthenticated, isPending } = useAuth();
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<RegisterValues>({
    resolver: zodResolver(registerSchema),
    defaultValues: { name: "", email: "", image: "", password: "" },
  });

  useEffect(() => {
    if (!isPending && isAuthenticated) router.replace(returnTo);
  }, [isAuthenticated, isPending, returnTo, router]);

  const onSubmit = handleSubmit(async ({ image, ...values }) => {
    try {
      const result = await authClient.signUp.email({
        ...values,
        image: image || undefined,
        callbackURL: new URL(returnTo, window.location.origin).toString(),
      });

      if (result.error) {
        toast.error(result.error.message ?? "Unable to create your account. Please try again.");
        return;
      }

      toast.success("Your StudioSpace account is ready!");
      router.replace(returnTo);
      router.refresh();
    } catch {
      toast.error("Unable to reach the authentication service. Please try again.");
    }
  });

  return (
    <AuthShell
      title="Create your account"
      description="Join a community made for creative work."
      footer={
        <>
          Already have an account?{" "}
          <Link
            href={`/login${returnTo === "/" ? "" : `?callbackUrl=${encodeURIComponent(returnTo)}`}`}
            className="font-semibold text-primary hover:underline"
          >
            Sign in
          </Link>
        </>
      }
    >
      <form className="space-y-4" onSubmit={onSubmit} noValidate>
        <div className="space-y-2">
          <label htmlFor="name" className="text-sm font-medium">Full name</label>
          <input
            id="name"
            autoComplete="name"
            placeholder="Alex Morgan"
            aria-invalid={Boolean(errors.name)}
            className="h-11 w-full rounded-md border bg-background px-3 text-sm outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/15"
            {...register("name")}
          />
          {errors.name && <p className="text-xs text-destructive">{errors.name.message}</p>}
        </div>

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
          <label htmlFor="image" className="text-sm font-medium">
            Profile image URL <span className="font-normal text-muted-foreground">(optional)</span>
          </label>
          <input
            id="image"
            type="url"
            autoComplete="url"
            placeholder="https://example.com/photo.jpg"
            aria-invalid={Boolean(errors.image)}
            className="h-11 w-full rounded-md border bg-background px-3 text-sm outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/15"
            {...register("image")}
          />
          {errors.image && <p className="text-xs text-destructive">{errors.image.message}</p>}
        </div>

        <div className="space-y-2">
          <label htmlFor="password" className="text-sm font-medium">Password</label>
          <PasswordInput
            id="password"
            autoComplete="new-password"
            placeholder="Create a strong password"
            aria-invalid={Boolean(errors.password)}
            {...register("password")}
          />
          {errors.password ? (
            <p className="text-xs text-destructive">{errors.password.message}</p>
          ) : (
            <p className="text-xs text-muted-foreground">
              At least 6 characters, with an uppercase and a lowercase letter.
            </p>
          )}
        </div>

        <button
          type="submit"
          disabled={isPending || isSubmitting}
          className="flex h-11 w-full items-center justify-center gap-2 rounded-md bg-primary px-4 text-sm font-semibold text-primary-foreground transition hover:bg-primary/90 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {isSubmitting && <LoaderCircle className="animate-spin" size={18} />}
          Create account
        </button>
      </form>
    </AuthShell>
  );
}
