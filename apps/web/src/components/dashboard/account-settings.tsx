"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { LoaderCircle, Save } from "lucide-react";
import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";
import { ErrorState } from "@/components/feedback/error-state";
import { LoadingState } from "@/components/feedback/loading-state";
import { StudioButton } from "@/components/ui/studio-button";
import { useAuth } from "@/hooks/use-auth";
import { authClient } from "@/lib/auth-client";

const profileSchema = z.object({
  name: z.string().trim().min(2, "Enter at least 2 characters.").max(100),
  image: z.union([z.literal(""), z.string().url("Enter a valid image URL.")]),
});

type ProfileValues = z.infer<typeof profileSchema>;
const inputClass =
  "mt-2 h-12 w-full rounded-xl border border-[hsl(var(--border))] bg-[hsl(var(--background))] px-4 text-sm outline-none transition focus:border-[hsl(var(--accent))] focus:ring-2 focus:ring-[hsl(var(--accent)/.12)]";

export function AccountSettings() {
  const { user, isPending, error } = useAuth();
  const [saving, setSaving] = useState(false);
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isDirty },
  } = useForm<ProfileValues>({
    resolver: zodResolver(profileSchema),
    defaultValues: { name: "", image: "" },
  });

  useEffect(() => {
    if (user) reset({ name: user.name, image: user.image ?? "" });
  }, [reset, user]);

  const onSubmit = handleSubmit(async (values) => {
    setSaving(true);
    try {
      const result = await authClient.updateUser({
        name: values.name,
        image: values.image || null,
      });
      if (result.error) {
        toast.error(result.error.message ?? "Could not update your profile.");
        return;
      }
      toast.success("Profile updated.");
      reset(values);
    } catch {
      toast.error("Unable to reach the account service. Please try again.");
    } finally {
      setSaving(false);
    }
  });

  if (isPending) return <LoadingState label="Loading account settings" />;
  if (error || !user) {
    return <ErrorState title="Account settings unavailable" message="We couldn’t verify your account. Refresh the page and try again." />;
  }

  return (
    <section className="mx-auto max-w-3xl">
      <div className="mb-7">
        <p className="text-xs font-semibold uppercase tracking-[0.17em] text-[hsl(var(--accent))]">Your account</p>
        <h1 className="mt-2 font-heading text-3xl font-semibold tracking-[-0.045em]">Account settings</h1>
        <p className="mt-2 text-sm text-[hsl(var(--muted-foreground))]">
          Update your public profile details. Your sign-in email and account permissions stay protected.
        </p>
      </div>
      <form onSubmit={onSubmit} className="space-y-7 rounded-3xl border border-[hsl(var(--border))] bg-[hsl(var(--card))] p-5 sm:p-8">
        <div>
          <label className="block text-sm font-semibold">
            Full name
            <input {...register("name")} autoComplete="name" className={inputClass} />
          </label>
          {errors.name && <p className="mt-1 text-xs text-destructive">{errors.name.message}</p>}
        </div>
        <div>
          <label className="block text-sm font-semibold">
            Profile image URL
            <input {...register("image")} type="url" inputMode="url" placeholder="https://example.com/portrait.jpg" className={inputClass} />
          </label>
          {errors.image && <p className="mt-1 text-xs text-destructive">{errors.image.message}</p>}
          <p className="mt-2 text-xs text-[hsl(var(--muted-foreground))]">Use a publicly accessible image URL, or leave this blank.</p>
        </div>
        <div>
          <label className="block text-sm font-semibold">
            Sign-in email
            <input value={user.email} readOnly aria-readonly="true" className={`${inputClass} cursor-not-allowed bg-[hsl(var(--muted))] text-[hsl(var(--muted-foreground))]`} />
          </label>
          <p className="mt-2 text-xs text-[hsl(var(--muted-foreground))]">Email changes are not available in profile settings.</p>
        </div>
        <div className="flex flex-col-reverse gap-3 border-t border-[hsl(var(--border))] pt-5 sm:flex-row sm:justify-end">
          <button type="button" disabled={!isDirty || saving} onClick={() => reset({ name: user.name, image: user.image ?? "" })} className="min-h-11 rounded-full border border-[hsl(var(--border))] px-5 text-sm font-semibold disabled:opacity-45">
            Discard changes
          </button>
          <StudioButton type="submit" disabled={!isDirty || saving}>
            {saving ? <LoaderCircle size={16} className="animate-spin" /> : <Save size={16} />}
            Save profile
          </StudioButton>
        </div>
      </form>
    </section>
  );
}
