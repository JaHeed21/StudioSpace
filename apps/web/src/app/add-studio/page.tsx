import { AuthGuard } from "@/components/auth/auth-guard";
import { SiteLayout } from "@/components/site-layout";
import { StudioForm } from "@/components/studios/studio-form";

export default function AddStudioPage() {
  return (
    <SiteLayout>
      <AuthGuard>
        <div className="mx-auto max-w-4xl px-5 py-12 sm:px-8 sm:py-16">
          <p className="text-xs font-semibold uppercase tracking-[0.17em] text-[hsl(var(--accent))]">
            Share your space
          </p>
          <h1 className="mt-3 font-heading text-3xl font-semibold tracking-[-0.045em] sm:text-4xl">
            Let’s make room for good work.
          </h1>
          <p className="mt-3 mb-9 max-w-2xl text-sm leading-6 text-[hsl(var(--muted-foreground))]">
            Tell creators what makes your studio special. Your profile details are attached securely to your listing.
          </p>
          <StudioForm />
        </div>
      </AuthGuard>
    </SiteLayout>
  );
}
