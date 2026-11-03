"use client";

import { ChevronDown, Menu, X } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";
import { useAuth } from "@/hooks/use-auth";
import { authClient } from "@/lib/auth-client";
import { cn } from "@/lib/utils";
import { StudioLinkButton } from "./ui/studio-button";
import { StudioLogo } from "./ui/studio-logo";
import { ThemeToggle } from "./theme-toggle";

const navLinks = [
  { label: "Explore", href: "/studios" },
  { label: "How it works", href: "/#how-it-works" },
  { label: "For hosts", href: "/#hosts" },
];

export function SiteNavbar() {
  const pathname = usePathname();
  const router = useRouter();
  const { user, isAuthenticated, isPending } = useAuth();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [signingOut, setSigningOut] = useState(false);

  const signOut = async () => {
    setSigningOut(true);
    try {
      const result = await authClient.signOut();
      if (result.error) {
        toast.error(result.error.message ?? "Could not sign out. Please try again.");
        return;
      }
      toast.success("You have been signed out.");
      router.refresh();
    } catch {
      toast.error("Unable to reach the authentication service.");
    } finally {
      setSigningOut(false);
    }
  };

  const closeMobile = () => setMobileOpen(false);

  return (
    <header className="sticky top-0 z-40 border-b border-[hsl(var(--border))] bg-[hsl(var(--background)/.94)] backdrop-blur-xl">
      <div className="mx-auto flex h-[72px] max-w-[1440px] items-center justify-between gap-6 px-5 sm:px-8 lg:px-12">
        <StudioLogo className="shrink-0 text-[1.4rem]" />

        <nav aria-label="Main navigation" className="hidden items-center gap-8 lg:flex">
          {navLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="text-[13px] font-medium text-[hsl(var(--muted-foreground))] transition hover:text-foreground"
            >
              {link.label}
            </Link>
          ))}
        </nav>

        <div className="hidden items-center gap-3 lg:flex">
          <ThemeToggle />
          <StudioLinkButton
            href="/add-studio"
            variant="secondary"
            className="min-h-10 px-4 text-[13px]"
          >
            List your space
          </StudioLinkButton>
          {!isPending && isAuthenticated ? (
            <details className="group relative">
              <summary
                aria-label="Open account menu"
                className="flex min-h-10 cursor-pointer list-none items-center gap-2 rounded-full border border-[hsl(var(--border))] py-1 pl-1 pr-3 marker:hidden transition hover:shadow-sm [&::-webkit-details-marker]:hidden"
              >
                {user?.image ? (
                  <Image
                    src={user.image}
                    alt=""
                    width={32}
                    height={32}
                    unoptimized
                    className="size-8 rounded-full object-cover"
                  />
                ) : (
                  <span className="grid size-8 place-items-center rounded-full bg-[hsl(var(--accent)/.12)] text-xs font-semibold text-[hsl(var(--accent))]">
                    {user?.name?.slice(0, 1).toUpperCase() ?? "S"}
                  </span>
                )}
                <span className="max-w-24 truncate text-xs font-medium">
                  {user?.name ?? "Account"}
                </span>
                <ChevronDown size={14} className="text-[hsl(var(--muted-foreground))] transition group-open:rotate-180" />
              </summary>
              <div className="absolute right-0 top-[calc(100%+10px)] w-52 rounded-2xl border border-[hsl(var(--border))] bg-[hsl(var(--background))] p-2 shadow-xl">
                <Link
                  href="/dashboard"
                  className="block rounded-xl px-3 py-2.5 text-sm hover:bg-[hsl(var(--muted))]"
                >
                  My account
                </Link>
                <Link
                  href="/dashboard/listings"
                  className="block rounded-xl px-3 py-2.5 text-sm hover:bg-[hsl(var(--muted))]"
                >
                  My listings
                </Link>
                <Link
                  href="/dashboard/bookings"
                  className="block rounded-xl px-3 py-2.5 text-sm hover:bg-[hsl(var(--muted))]"
                >
                  My bookings
                </Link>
                <Link
                  href="/add-studio"
                  className="block rounded-xl px-3 py-2.5 text-sm hover:bg-[hsl(var(--muted))]"
                >
                  Add a studio
                </Link>
                <button
                  type="button"
                  onClick={() => void signOut()}
                  disabled={signingOut}
                  className="w-full rounded-xl px-3 py-2.5 text-left text-sm text-[hsl(var(--muted-foreground))] hover:bg-[hsl(var(--muted))] hover:text-foreground disabled:opacity-50"
                >
                  {signingOut ? "Signing out…" : "Sign out"}
                </button>
              </div>
            </details>
          ) : !isPending ? (
            <StudioLinkButton href={`/login?callbackUrl=${encodeURIComponent(pathname || "/")}`} className="min-h-10 px-5 text-[13px]">
              Sign in
            </StudioLinkButton>
          ) : (
            <span aria-hidden="true" className="h-10 w-24 animate-pulse rounded-full bg-[hsl(var(--muted))]" />
          )}
        </div>

        <div className="flex items-center gap-2 lg:hidden">
          <ThemeToggle />
          <button
            type="button"
            aria-label={mobileOpen ? "Close navigation" : "Open navigation"}
            aria-expanded={mobileOpen}
            onClick={() => setMobileOpen((open) => !open)}
            className="grid size-10 place-items-center rounded-full border border-[hsl(var(--border))]"
          >
            {mobileOpen ? <X size={19} /> : <Menu size={19} />}
          </button>
        </div>
      </div>

      <div
        className={cn(
          "grid overflow-hidden transition-[grid-template-rows] duration-300 lg:hidden",
          mobileOpen ? "grid-rows-[1fr]" : "grid-rows-[0fr]",
        )}
      >
        <div className="min-h-0">
          <nav
            aria-label="Mobile navigation"
            className="mx-5 flex flex-col gap-1 border-t border-[hsl(var(--border))] py-4 sm:mx-8"
          >
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                onClick={closeMobile}
                className="rounded-xl px-3 py-3 text-sm font-medium hover:bg-[hsl(var(--muted))]"
              >
                {link.label}
              </Link>
            ))}
            <Link
              href="/add-studio"
              onClick={closeMobile}
              className="rounded-xl px-3 py-3 text-sm font-medium hover:bg-[hsl(var(--muted))]"
            >
              List your space
            </Link>
            {!isPending && isAuthenticated ? (
              <>
                <Link
                  href="/dashboard"
                  onClick={closeMobile}
                  className="rounded-xl px-3 py-3 text-sm font-medium hover:bg-[hsl(var(--muted))]"
                >
                  {user?.name ?? "My account"}
                </Link>
                <Link
                  href="/dashboard/listings"
                  onClick={closeMobile}
                  className="rounded-xl px-3 py-3 text-sm font-medium hover:bg-[hsl(var(--muted))]"
                >
                  My listings
                </Link>
                <Link
                  href="/dashboard/bookings"
                  onClick={closeMobile}
                  className="rounded-xl px-3 py-3 text-sm font-medium hover:bg-[hsl(var(--muted))]"
                >
                  My bookings
                </Link>
                <button
                  type="button"
                  onClick={() => {
                    closeMobile();
                    void signOut();
                  }}
                  className="rounded-xl px-3 py-3 text-left text-sm font-medium hover:bg-[hsl(var(--muted))]"
                >
                  Sign out
                </button>
              </>
            ) : !isPending ? (
              <Link
                href={`/login?callbackUrl=${encodeURIComponent(pathname || "/")}`}
                onClick={closeMobile}
                className="rounded-xl px-3 py-3 text-sm font-semibold text-[hsl(var(--accent))] hover:bg-[hsl(var(--muted))]"
              >
                Sign in
              </Link>
            ) : null}
          </nav>
        </div>
      </div>
    </header>
  );
}
