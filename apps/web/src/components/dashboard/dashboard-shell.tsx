"use client";

import {
  ArrowUpRight,
  CalendarDays,
  ChevronDown,
  Heart,
  LayoutDashboard,
  LogOut,
  Menu,
  Settings,
  Store,
  X,
} from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import type { ReactNode } from "react";
import { useState } from "react";
import { toast } from "sonner";
import { useAuth } from "@/hooks/use-auth";
import { authClient } from "@/lib/auth-client";
import { StudioLogo } from "@/components/ui/studio-logo";

const navigation = [
  { label: "Overview", href: "/dashboard", icon: LayoutDashboard },
  { label: "My listings", href: "/dashboard/listings", icon: Store },
  { label: "My bookings", href: "/dashboard/bookings", icon: CalendarDays },
  { label: "Booking requests", href: "/dashboard/booking-requests", icon: CalendarDays },
  { label: "Wishlist", href: "/dashboard/wishlist", icon: Heart },
  { label: "Settings", href: "/dashboard/settings", icon: Settings },
];

function Sidebar({
  onNavigate,
  pathname,
}: {
  onNavigate?: () => void;
  pathname: string;
}) {
  return (
    <div className="flex h-full flex-col">
      <div className="border-b border-[hsl(var(--border))] px-6 py-6">
        <StudioLogo />
      </div>
      <nav aria-label="Dashboard" className="flex-1 space-y-1 px-3 py-6">
        <p className="mb-3 px-3 text-[10px] font-semibold uppercase tracking-[0.18em] text-[hsl(var(--muted-foreground))]">
          Workspace
        </p>
        {navigation.map(({ label, href, icon: Icon }) => {
          const active = pathname === href || (href !== "/dashboard" && pathname.startsWith(`${href}/`));
          return (
            <Link
              key={href}
              href={href}
              onClick={onNavigate}
              aria-current={active ? "page" : undefined}
              className={`flex min-h-11 items-center gap-3 rounded-xl px-3 text-sm font-medium transition ${
                active
                  ? "bg-[hsl(var(--accent)/.1)] text-[hsl(var(--accent))]"
                  : "text-[hsl(var(--muted-foreground))] hover:bg-[hsl(var(--muted))] hover:text-foreground"
              }`}
            >
              <Icon size={17} strokeWidth={1.8} />
              {label}
            </Link>
          );
        })}
      </nav>
      <div className="border-t border-[hsl(var(--border))] p-4">
        <Link
          href="/studios"
          className="flex items-center justify-between rounded-2xl bg-[hsl(var(--foreground))] p-4 text-[hsl(var(--background))] transition hover:opacity-90"
        >
          <span>
            <span className="block text-xs font-semibold">Find your next space</span>
            <span className="mt-1 block text-[10px] opacity-70">Explore the directory</span>
          </span>
          <ArrowUpRight size={16} />
        </Link>
      </div>
    </div>
  );
}

export function DashboardShell({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const { user } = useAuth();
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
      router.replace("/login");
      router.refresh();
    } catch {
      toast.error("Unable to reach the authentication service.");
    } finally {
      setSigningOut(false);
    }
  };

  return (
    <div className="min-h-screen bg-[hsl(var(--background))]">
      <aside className="fixed inset-y-0 left-0 z-30 hidden w-[258px] border-r border-[hsl(var(--border))] bg-[hsl(var(--card))] lg:block">
        <Sidebar pathname={pathname} />
      </aside>

      {mobileOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <button
            type="button"
            aria-label="Close dashboard navigation"
            onClick={() => setMobileOpen(false)}
            className="absolute inset-0 bg-black/45"
          />
          <aside className="absolute inset-y-0 left-0 w-[min(84vw,310px)] bg-[hsl(var(--card))] shadow-2xl">
            <div className="absolute right-3 top-4 z-10">
              <button
                type="button"
                aria-label="Close navigation"
                onClick={() => setMobileOpen(false)}
                className="grid size-10 place-items-center rounded-full border border-[hsl(var(--border))]"
              >
                <X size={18} />
              </button>
            </div>
            <Sidebar pathname={pathname} onNavigate={() => setMobileOpen(false)} />
          </aside>
        </div>
      )}

      <div className="lg:pl-[258px]">
        <header className="sticky top-0 z-20 flex h-[72px] items-center justify-between border-b border-[hsl(var(--border))] bg-[hsl(var(--background)/.94)] px-4 backdrop-blur-xl sm:px-7 lg:px-10">
          <div className="flex items-center gap-3">
            <button
              type="button"
              aria-label="Open dashboard navigation"
              onClick={() => setMobileOpen(true)}
              className="grid size-10 place-items-center rounded-xl border border-[hsl(var(--border))] lg:hidden"
            >
              <Menu size={19} />
            </button>
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-[hsl(var(--muted-foreground))]">
                StudioSpace
              </p>
              <p className="text-sm font-semibold">Your dashboard</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <Link
              href="/"
              className="hidden items-center gap-1.5 text-xs font-medium text-[hsl(var(--muted-foreground))] hover:text-foreground sm:inline-flex"
            >
              View marketplace <ArrowUpRight size={14} />
            </Link>
            <details className="group relative">
              <summary className="flex min-h-10 cursor-pointer list-none items-center gap-2 rounded-full border border-[hsl(var(--border))] py-1 pl-1 pr-3 marker:hidden [&::-webkit-details-marker]:hidden">
                {user?.image ? (
                  <Image src={user.image} alt="" width={32} height={32} unoptimized className="size-8 rounded-full object-cover" />
                ) : (
                  <span className="grid size-8 place-items-center rounded-full bg-[hsl(var(--accent)/.12)] text-xs font-semibold text-[hsl(var(--accent))]">
                    {user?.name?.slice(0, 1).toUpperCase() ?? "S"}
                  </span>
                )}
                <span className="hidden max-w-28 truncate text-xs font-medium sm:block">{user?.name ?? "Account"}</span>
                <ChevronDown size={14} className="text-[hsl(var(--muted-foreground))] transition group-open:rotate-180" />
              </summary>
              <div className="absolute right-0 top-[calc(100%+10px)] w-48 rounded-2xl border border-[hsl(var(--border))] bg-[hsl(var(--card))] p-2 shadow-xl">
                <Link href="/dashboard/settings" className="block rounded-xl px-3 py-2.5 text-sm hover:bg-[hsl(var(--muted))]">
                  Account settings
                </Link>
                <button
                  type="button"
                  disabled={signingOut}
                  onClick={() => void signOut()}
                  className="flex w-full items-center gap-2 rounded-xl px-3 py-2.5 text-left text-sm text-[hsl(var(--muted-foreground))] hover:bg-[hsl(var(--muted))] hover:text-foreground disabled:opacity-50"
                >
                  <LogOut size={15} /> {signingOut ? "Signing out…" : "Sign out"}
                </button>
              </div>
            </details>
          </div>
        </header>
        <main className="mx-auto min-h-[calc(100vh-72px)] max-w-[1440px] px-4 py-8 sm:px-7 sm:py-10 lg:px-10">
          {children}
        </main>
      </div>
    </div>
  );
}
