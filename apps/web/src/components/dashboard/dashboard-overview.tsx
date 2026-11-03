"use client";

import {
  ArrowDownRight,
  ArrowRight,
  CalendarDays,
  CheckCircle2,
  Clock3,
  Plus,
  Store,
} from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";
import { ErrorState } from "@/components/feedback/error-state";
import { apiClient } from "@/lib/api-client";

interface Activity {
  id: string;
  studioId: string;
  studioTitle: string;
  bookingDate: string;
  startTime: string;
  endTime: string;
  totalAmount: number;
  status: string;
  createdAt: string;
  role: "customer" | "host";
}

interface DashboardData {
  stats: {
    totalListings: number;
    activeListings: number;
    totalBookings: number;
    pendingBookings: number;
    confirmedBookings: number;
  };
  recentActivity: Activity[];
}

const metrics = [
  { key: "totalListings", label: "Studio listings", note: "Spaces you host", icon: Store },
  { key: "totalBookings", label: "Total bookings", note: "As host or creator", icon: CalendarDays },
  { key: "pendingBookings", label: "Pending requests", note: "Awaiting your response", icon: Clock3 },
  { key: "confirmedBookings", label: "Confirmed", note: "Ready to create", icon: CheckCircle2 },
] as const;

const statusClass: Record<string, string> = {
  Pending: "bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-200",
  Confirmed: "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-200",
  Completed: "bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-200",
  Cancelled: "bg-rose-100 text-rose-800 dark:bg-rose-900/40 dark:text-rose-200",
};

function formatActivityDate(value: string): string {
  return new Intl.DateTimeFormat("en-US", { month: "short", day: "numeric" }).format(new Date(value));
}

export function DashboardOverview({ name }: { name: string }) {
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    const controller = new AbortController();
    apiClient.get<DashboardData>("/dashboard/summary", { signal: controller.signal })
      .then(({ data: summary }) => {
        setData(summary);
        setError(false);
      })
      .catch(() => {
        if (!controller.signal.aborted) setError(true);
      })
      .finally(() => {
        if (!controller.signal.aborted) setLoading(false);
      });
    return () => controller.abort();
  }, []);

  if (error) {
    return <ErrorState title="Dashboard data unavailable" message="We couldn’t load your latest account activity. Check your connection and try again." />;
  }

  return (
    <div className="space-y-8">
      <section className="flex flex-col gap-5 rounded-[1.75rem] bg-[#242321] p-6 text-white sm:flex-row sm:items-end sm:justify-between sm:p-8">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#F07843]">Your creative space</p>
          <h1 className="mt-3 font-heading text-3xl font-semibold tracking-[-0.045em] sm:text-4xl">
            Good to see you, {name.split(" ")[0] || "creator"}.
          </h1>
          <p className="mt-2 max-w-xl text-sm leading-6 text-white/65">
            A clear view of your spaces, reservations, and what needs your attention.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Link href="/add-studio" className="inline-flex min-h-11 items-center gap-2 rounded-full bg-[#F07843] px-5 text-sm font-semibold text-white hover:bg-[#e56832]">
            <Plus size={16} /> Add a studio
          </Link>
          <Link href="/studios" className="inline-flex min-h-11 items-center gap-2 rounded-full border border-white/20 px-5 text-sm font-semibold text-white hover:bg-white/10">
            Explore studios <ArrowRight size={15} />
          </Link>
        </div>
      </section>

      <section aria-label="Account statistics" className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {metrics.map(({ key, label, note, icon: Icon }) => (
          <article key={key} className="rounded-2xl border border-[hsl(var(--border))] bg-[hsl(var(--card))] p-5">
            <div className="flex items-start justify-between">
              <span className="grid size-10 place-items-center rounded-xl bg-[hsl(var(--accent)/.1)] text-[hsl(var(--accent))]">
                <Icon size={18} />
              </span>
              <ArrowDownRight size={16} className="text-[hsl(var(--muted-foreground))]" />
            </div>
            <p className="mt-5 font-heading text-3xl font-semibold tracking-tight">
              {loading ? <span className="inline-block h-9 w-12 animate-pulse rounded-lg bg-[hsl(var(--muted))]" /> : data?.stats[key] ?? 0}
            </p>
            <p className="mt-1 text-sm font-semibold">{label}</p>
            <p className="mt-1 text-xs text-[hsl(var(--muted-foreground))]">{note}</p>
          </article>
        ))}
      </section>

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1.35fr)_minmax(280px,.65fr)]">
        <section className="rounded-3xl border border-[hsl(var(--border))] bg-[hsl(var(--card))] p-5 sm:p-7">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.15em] text-[hsl(var(--accent))]">Latest updates</p>
              <h2 className="mt-2 font-heading text-xl font-semibold">Recent activity</h2>
            </div>
            <Link href="/dashboard/bookings" className="text-xs font-semibold text-[hsl(var(--accent))] hover:underline">All bookings</Link>
          </div>
          {loading ? (
            <div className="mt-6 space-y-3">
              {[0, 1, 2].map((item) => <div key={item} className="h-[68px] animate-pulse rounded-2xl bg-[hsl(var(--muted))]" />)}
            </div>
          ) : !data?.recentActivity.length ? (
            <div className="mt-6 rounded-2xl bg-[hsl(var(--muted)/.55)] px-5 py-8 text-center">
              <CalendarDays size={23} className="mx-auto text-[hsl(var(--muted-foreground))]" />
              <p className="mt-3 text-sm font-semibold">Your activity will show up here</p>
              <p className="mt-1 text-xs text-[hsl(var(--muted-foreground))]">Create a listing or request a studio to get started.</p>
            </div>
          ) : (
            <ul className="mt-5 divide-y divide-[hsl(var(--border))]">
              {data.recentActivity.map((activity) => (
                <li key={activity.id} className="flex items-center gap-3 py-4 first:pt-1 last:pb-1">
                  <span className="grid size-10 shrink-0 place-items-center rounded-full bg-[hsl(var(--muted))] text-[hsl(var(--accent))]">
                    {activity.role === "host" ? <Store size={17} /> : <CalendarDays size={17} />}
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-semibold">
                      {activity.role === "host" ? "Booking request" : "Studio reservation"} · {activity.studioTitle}
                    </p>
                    <p className="mt-1 text-xs text-[hsl(var(--muted-foreground))]">
                      {formatActivityDate(activity.createdAt)} · {activity.bookingDate} · {activity.startTime}–{activity.endTime}
                    </p>
                  </div>
                  <span className={`hidden shrink-0 rounded-full px-2.5 py-1 text-[10px] font-semibold sm:inline-flex ${statusClass[activity.status] ?? ""}`}>
                    {activity.status}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </section>

        <section className="rounded-3xl border border-[hsl(var(--border))] bg-[hsl(var(--card))] p-5 sm:p-7">
          <p className="text-xs font-semibold uppercase tracking-[0.15em] text-[hsl(var(--accent))]">Make it happen</p>
          <h2 className="mt-2 font-heading text-xl font-semibold">Quick actions</h2>
          <div className="mt-5 space-y-3">
            <Link href="/dashboard/listings" className="flex items-center justify-between rounded-2xl border border-[hsl(var(--border))] p-4 transition hover:border-[hsl(var(--accent)/.5)] hover:bg-[hsl(var(--muted)/.45)]">
              <span className="flex items-center gap-3"><Store size={17} className="text-[hsl(var(--accent))]" /><span><span className="block text-sm font-semibold">Manage listings</span><span className="mt-1 block text-xs text-[hsl(var(--muted-foreground))]">{loading ? "Loading…" : `${data?.stats.activeListings ?? 0} active spaces`}</span></span></span>
              <ArrowRight size={16} className="text-[hsl(var(--muted-foreground))]" />
            </Link>
            <Link href="/dashboard/booking-requests" className="flex items-center justify-between rounded-2xl border border-[hsl(var(--border))] p-4 transition hover:border-[hsl(var(--accent)/.5)] hover:bg-[hsl(var(--muted)/.45)]">
              <span className="flex items-center gap-3"><Clock3 size={17} className="text-[hsl(var(--accent))]" /><span><span className="block text-sm font-semibold">Review requests</span><span className="mt-1 block text-xs text-[hsl(var(--muted-foreground))]">{loading ? "Loading…" : `${data?.stats.pendingBookings ?? 0} awaiting a response`}</span></span></span>
              <ArrowRight size={16} className="text-[hsl(var(--muted-foreground))]" />
            </Link>
          </div>
        </section>
      </div>
    </div>
  );
}
