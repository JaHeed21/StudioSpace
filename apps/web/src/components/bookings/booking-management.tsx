"use client";

import Image from "next/image";
import Link from "next/link";
import { CalendarDays, Clock3, LoaderCircle, Mail } from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";
import { EmptyState } from "@/components/feedback/empty-state";
import { ErrorState } from "@/components/feedback/error-state";
import { apiClient } from "@/lib/api-client";

type BookingStatus = "Pending" | "Confirmed" | "Completed" | "Cancelled";
type BookingFilter = "All" | BookingStatus;

interface Booking {
  id: string;
  studioId: string;
  studioTitle: string;
  studioImageUrl?: string;
  customerName: string;
  customerEmail: string;
  bookingDate: string;
  startTime: string;
  endTime: string;
  totalHours: number;
  hourlyRate: number;
  securityDeposit: number;
  rentalCost: number;
  totalAmount: number;
  status: BookingStatus;
}

const filters: BookingFilter[] = ["All", "Pending", "Confirmed", "Completed", "Cancelled"];
const statusClass: Record<BookingStatus, string> = {
  Pending: "bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-200",
  Confirmed: "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-200",
  Completed: "bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-200",
  Cancelled: "bg-rose-100 text-rose-800 dark:bg-rose-900/40 dark:text-rose-200",
};

function formatBookingDate(date: string): string {
  return new Intl.DateTimeFormat("en-US", {
    weekday: "short",
    month: "long",
    day: "numeric",
    year: "numeric",
  }).format(new Date(`${date}T12:00:00`));
}

function formatMoney(value: number): string {
  return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(value);
}

export function BookingManagement({ mode }: { mode: "customer" | "host" }) {
  const [filter, setFilter] = useState<BookingFilter>("All");
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [busyBookingId, setBusyBookingId] = useState<string | null>(null);

  const loadBookings = useCallback(async (signal?: AbortSignal) => {
    setLoading(true);
    setError(false);
    try {
      const base = mode === "customer" ? "/bookings/my-bookings" : "/bookings";
      const params = filter === "All" ? "" : `?status=${encodeURIComponent(filter)}`;
      const { data } = await apiClient.get<{ bookings: Booking[] }>(`${base}${params}`, { signal });
      setBookings(data.bookings);
    } catch {
      if (!signal?.aborted) setError(true);
    } finally {
      if (!signal?.aborted) setLoading(false);
    }
  }, [filter, mode]);

  useEffect(() => {
    const controller = new AbortController();
    const base = mode === "customer" ? "/bookings/my-bookings" : "/bookings";
    const params = filter === "All" ? "" : `?status=${encodeURIComponent(filter)}`;
    apiClient
      .get<{ bookings: Booking[] }>(`${base}${params}`, { signal: controller.signal })
      .then(({ data }) => {
        setBookings(data.bookings);
        setError(false);
      })
      .catch(() => {
        if (!controller.signal.aborted) setError(true);
      })
      .finally(() => {
        if (!controller.signal.aborted) setLoading(false);
      });
    return () => controller.abort();
  }, [filter, mode]);

  const updateBooking = async (
    booking: Booking,
    action: "cancel" | "confirm" | "reject" | "complete",
  ) => {
    setBusyBookingId(booking.id);
    try {
      if (action === "cancel") {
        await apiClient.patch(`/bookings/${encodeURIComponent(booking.id)}/cancel`);
      } else {
        const status = action === "confirm" ? "Confirmed" : action === "complete" ? "Completed" : "Cancelled";
        await apiClient.patch(`/bookings/${encodeURIComponent(booking.id)}/status`, { status });
      }
      toast.success(
        action === "cancel" ? "Booking cancelled."
          : action === "confirm" ? "Booking confirmed."
            : action === "complete" ? "Booking marked complete."
              : "Booking request declined.",
      );
      await loadBookings();
    } catch (requestError) {
      const message =
        typeof requestError === "object" && requestError !== null && "response" in requestError
          ? ((requestError.response as { data?: { error?: string } } | undefined)?.data?.error)
          : undefined;
      toast.error(message ?? "Could not update the booking. Refresh and try again.");
    } finally {
      setBusyBookingId(null);
    }
  };

  return (
    <section>
      <div className="mb-6 flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.17em] text-[hsl(var(--accent))]">
            {mode === "customer" ? "Your reservations" : "Host studio bookings"}
          </p>
          <h1 className="mt-2 font-heading text-3xl font-semibold tracking-[-0.045em]">
            {mode === "customer" ? "My bookings" : "Booking requests"}
          </h1>
          <p className="mt-2 text-sm text-[hsl(var(--muted-foreground))]">
            {mode === "customer"
              ? "Keep track of requests, upcoming sessions, and completed stays."
              : "Review requests and manage confirmed sessions for your spaces."}
          </p>
        </div>
        {mode === "customer" && (
          <Link href="/studios" className="text-sm font-semibold text-[hsl(var(--accent))] hover:underline">
            Explore studios
          </Link>
        )}
      </div>

      <div className="mb-6 flex gap-2 overflow-x-auto pb-2" role="tablist" aria-label="Filter bookings">
        {filters.map((item) => (
          <button
            key={item}
            type="button"
            role="tab"
            aria-selected={filter === item}
            onClick={() => {
              setLoading(true);
              setFilter(item);
            }}
            className={`shrink-0 rounded-full px-4 py-2 text-xs font-semibold transition ${
              filter === item
                ? "bg-[hsl(var(--foreground))] text-[hsl(var(--background))]"
                : "border border-[hsl(var(--border))] text-[hsl(var(--muted-foreground))] hover:text-foreground"
            }`}
          >
            {item}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="grid gap-4">
          {[0, 1, 2].map((item) => (
            <div key={item} className="h-40 animate-pulse rounded-3xl bg-[hsl(var(--muted))]" />
          ))}
        </div>
      ) : error ? (
        <ErrorState title="Bookings unavailable" message="We couldn’t load your bookings. Check your connection and try again." />
      ) : bookings.length === 0 ? (
        <EmptyState
          title={filter === "All" ? "No bookings yet." : `No ${filter.toLowerCase()} bookings.`}
          description={mode === "customer"
            ? "When you request a studio, its booking details and status will appear here."
            : "New requests for your listed studios will appear here."}
        />
      ) : (
        <div className="grid gap-4">
          {bookings.map((booking) => {
            const busy = busyBookingId === booking.id;
            return (
              <article
                key={booking.id}
                className="grid overflow-hidden rounded-3xl border border-[hsl(var(--border))] bg-[hsl(var(--card))] sm:grid-cols-[200px_minmax(0,1fr)]"
              >
                <Link
                  href={`/studios/${encodeURIComponent(booking.studioId)}`}
                  className="relative min-h-44 bg-[hsl(var(--muted))]"
                  aria-label={`View ${booking.studioTitle}`}
                >
                  {booking.studioImageUrl && (
                    <Image
                      src={booking.studioImageUrl}
                      alt={booking.studioTitle}
                      fill
                      unoptimized
                      sizes="200px"
                      className="object-cover"
                    />
                  )}
                </Link>
                <div className="flex flex-col justify-between gap-5 p-5 sm:p-6">
                  <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-[0.14em] text-[hsl(var(--accent))]">
                        {mode === "host" ? `Requested by ${booking.customerName}` : "Studio booking"}
                      </p>
                      <h2 className="mt-1 font-heading text-xl font-semibold">{booking.studioTitle}</h2>
                      <p className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-2 text-sm text-[hsl(var(--muted-foreground))]">
                        <span className="inline-flex items-center gap-1.5"><CalendarDays size={15} />{formatBookingDate(booking.bookingDate)}</span>
                        <span className="inline-flex items-center gap-1.5"><Clock3 size={15} />{booking.startTime}–{booking.endTime} · {booking.totalHours} hrs</span>
                      </p>
                      {mode === "host" && <p className="mt-2 inline-flex items-center gap-1.5 text-xs text-[hsl(var(--muted-foreground))]"><Mail size={13} />{booking.customerEmail}</p>}
                    </div>
                    <span className={`w-fit rounded-full px-3 py-1 text-xs font-semibold ${statusClass[booking.status]}`}>
                      {booking.status}
                    </span>
                  </div>
                  <div className="flex flex-col gap-3 border-t border-[hsl(var(--border))] pt-4 sm:flex-row sm:items-center sm:justify-between">
                    <p className="text-sm">
                      Total <span className="font-semibold">{formatMoney(booking.totalAmount)}</span>
                      <span className="ml-1 text-xs text-[hsl(var(--muted-foreground))]">incl. deposit</span>
                    </p>
                    <div className="flex flex-wrap gap-2">
                      <Link
                        href={`/studios/${encodeURIComponent(booking.studioId)}`}
                        className="inline-flex h-9 items-center rounded-full border border-[hsl(var(--border))] px-4 text-xs font-semibold hover:bg-[hsl(var(--muted))]"
                      >
                        View details
                      </Link>
                      {mode === "customer" && booking.status === "Pending" && (
                        <button
                          type="button"
                          disabled={busy}
                          onClick={() => void updateBooking(booking, "cancel")}
                          className="inline-flex h-9 items-center gap-2 rounded-full border border-rose-200 px-4 text-xs font-semibold text-rose-700 disabled:opacity-50 dark:border-rose-900 dark:text-rose-300"
                        >
                          {busy && <LoaderCircle size={13} className="animate-spin" />} Cancel
                        </button>
                      )}
                      {mode === "host" && booking.status === "Pending" && (
                        <>
                          <button
                            type="button"
                            disabled={busy}
                            onClick={() => void updateBooking(booking, "reject")}
                            className="inline-flex h-9 items-center gap-2 rounded-full border border-rose-200 px-4 text-xs font-semibold text-rose-700 disabled:opacity-50 dark:border-rose-900 dark:text-rose-300"
                          >
                            {busy && <LoaderCircle size={13} className="animate-spin" />} Reject
                          </button>
                          <button
                            type="button"
                            disabled={busy}
                            onClick={() => void updateBooking(booking, "confirm")}
                            className="inline-flex h-9 items-center gap-2 rounded-full bg-[hsl(var(--accent))] px-4 text-xs font-semibold text-white disabled:opacity-50"
                          >
                            {busy && <LoaderCircle size={13} className="animate-spin" />} Confirm
                          </button>
                        </>
                      )}
                      {mode === "host" && booking.status === "Confirmed" && (
                        <>
                          <button
                            type="button"
                            disabled={busy}
                            onClick={() => void updateBooking(booking, "cancel")}
                            className="inline-flex h-9 items-center rounded-full border border-rose-200 px-4 text-xs font-semibold text-rose-700 disabled:opacity-50 dark:border-rose-900 dark:text-rose-300"
                          >
                            Cancel booking
                          </button>
                          <button
                            type="button"
                            disabled={busy}
                            onClick={() => void updateBooking(booking, "complete")}
                            className="inline-flex h-9 items-center rounded-full bg-[hsl(var(--accent))] px-4 text-xs font-semibold text-white disabled:opacity-50"
                          >
                            Mark completed
                          </button>
                        </>
                      )}
                    </div>
                  </div>
                </div>
              </article>
            );
          })}
        </div>
      )}
    </section>
  );
}
