import Link from "next/link";
import type { ReactNode } from "react";

export function AuthShell({
  title,
  description,
  children,
  footer,
}: {
  title: string;
  description: string;
  children: ReactNode;
  footer: ReactNode;
}) {
  return (
    <main className="grid min-h-screen lg:grid-cols-[1.05fr_0.95fr]">
      <section
        aria-label="Creative studio photography"
        className="relative flex min-h-56 flex-col justify-between overflow-hidden bg-cover bg-center px-7 py-7 text-white sm:px-12 sm:py-10 lg:min-h-screen"
        style={{
          backgroundImage:
            "linear-gradient(180deg,rgba(18,16,27,.16),rgba(18,16,27,.82)),url('https://images.unsplash.com/photo-1497366754035-f200968a6e72?auto=format&fit=crop&w=1800&q=85')",
        }}
      >
        <Link href="/" className="relative z-10 w-fit text-xl font-bold tracking-tight">
          StudioSpace<span className="text-violet-300">.</span>
        </Link>
        <div className="relative z-10 mt-16 max-w-xl lg:mb-8">
          <p className="mb-4 text-xs font-semibold uppercase tracking-[0.24em] text-violet-200">
            Make room for creativity
          </p>
          <h2 className="text-3xl font-semibold leading-tight tracking-tight sm:text-5xl">
            Find your space.
            <br />
            Make something unforgettable.
          </h2>
          <p className="mt-5 max-w-md text-sm leading-6 text-white/75 sm:text-base">
            A community for creators, and the studios that bring their ideas to life.
          </p>
        </div>
        <p className="relative z-10 hidden text-xs text-white/60 lg:block">
          Your next great idea starts somewhere.
        </p>
      </section>

      <section className="flex items-center justify-center px-6 py-12 sm:px-10 lg:px-14">
        <div className="w-full max-w-md">
          <Link href="/" className="mb-10 inline-flex text-sm text-muted-foreground hover:text-foreground">
            <span aria-hidden="true" className="mr-2">←</span> Back to home
          </Link>
          <div className="mb-8">
            <h1 className="text-3xl font-semibold tracking-tight">{title}</h1>
            <p className="mt-2 text-sm text-muted-foreground">{description}</p>
          </div>
          {children}
          <div className="mt-8 border-t pt-6 text-center text-sm text-muted-foreground">{footer}</div>
          <p className="mt-6 text-center text-xs leading-5 text-muted-foreground">
            By continuing, you agree to StudioSpace&apos;s Terms of Service and Privacy Policy.
          </p>
        </div>
      </section>
    </main>
  );
}
