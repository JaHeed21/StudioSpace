"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { CalendarDays, Clock3, LoaderCircle, ShieldCheck } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useForm, useWatch } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";
import { StudioButton } from "@/components/ui/studio-button";
import { useAuth } from "@/hooks/use-auth";
import { apiClient } from "@/lib/api-client";
import type { Studio } from "@/lib/studios";

const requestSchema = z.object({
  bookingDate: z.string().min(1, "Choose a booking date."),
  startTime: z.string().min(1, "Choose a start time."),
  endTime: z.string().min(1, "Choose an end time."),
}).refine((value) => value.endTime > value.startTime, {
  path: ["endTime"],
  message: "End time must be after start time.",
});

type RequestValues = z.infer<typeof requestSchema>;

function localDateString(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function calculateHours(start: string, end: string): number {
  if (!start || !end || end <= start) return 0;
  const [startHour, startMinute] = start.split(":").map(Number);
  const [endHour, endMinute] = end.split(":").map(Number);
  return ((endHour! * 60 + endMinute!) - (startHour! * 60 + startMinute!)) / 60;
}

function money(value: number): string {
  return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(value);
}

export function BookingPanel({ studio }: { studio: Studio }) {
  const router = useRouter();
  const { user, isPending } = useAuth();
  const [confirming, setConfirming] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const {
    control,
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<RequestValues>({
    resolver: zodResolver(requestSchema),
    defaultValues: { bookingDate: "", startTime: "", endTime: "" },
  });
  const bookingDate = useWatch({ control, name: "bookingDate" });
  const startTime = useWatch({ control, name: "startTime" });
  const endTime = useWatch({ control, name: "endTime" });
  const hours = calculateHours(startTime, endTime);
  const rentalCost = Math.round(hours * studio.hourlyRate * 100) / 100;
  const isOwner = user?.id === studio.ownerId;

  const submitRequest = handleSubmit(() => {
    if (!user) {
      router.push(`/login?callbackUrl=${encodeURIComponent(`/studios/${studio.id}`)}`);
      return;
    }
    if (isOwner) {
      toast.error("You can’t book your own studio.");
      return;
    }
    setConfirming(true);
  });

  const createRequest = handleSubmit(async (values) => {
    setSubmitting(true);
    try {
      await apiClient.post("/bookings", { studioId: studio.id, ...values });
      setConfirming(false);
      toast.success("Booking request sent to the host.");
      router.push("/my-bookings");
      router.refresh();
    } catch (error) {
      const response =
        typeof error === "object" && error !== null && "response" in error
          ? error.response as { status?: number; data?: { error?: string } } | undefined
          : undefined;
      if (response?.status === 409) {
        toast.error(response.data?.error ?? "That time is no longer available. Choose another slot.");
      } else {
        toast.error(response?.data?.error ?? "Could not request this booking. Please try again.");
      }
    } finally {
      setSubmitting(false);
    }
  });

  const fieldClass =
    "mt-2 h-11 w-full rounded-xl border border-[hsl(var(--border))] bg-[hsl(var(--background))] px-3 text-sm outline-none focus:border-[hsl(var(--accent))] focus:ring-2 focus:ring-[hsl(var(--accent)/.12)]";

  return (
    <>
      <form onSubmit={submitRequest}>
        <div className="my-5 space-y-4 rounded-2xl border border-[hsl(var(--border))] p-4">
          <label className="block text-xs font-semibold">
            Booking date
            <input
              type="date"
              min={localDateString(new Date())}
              className={fieldClass}
              {...register("bookingDate")}
            />
            {errors.bookingDate && <span className="mt-1 block text-xs text-destructive">{errors.bookingDate.message}</span>}
          </label>
          <div className="grid grid-cols-2 gap-3">
            <label className="block text-xs font-semibold">
              Start time
              <input type="time" className={fieldClass} {...register("startTime")} />
              {errors.startTime && <span className="mt-1 block text-xs text-destructive">{errors.startTime.message}</span>}
            </label>
            <label className="block text-xs font-semibold">
              End time
              <input type="time" className={fieldClass} {...register("endTime")} />
              {errors.endTime && <span className="mt-1 block text-xs text-destructive">{errors.endTime.message}</span>}
            </label>
          </div>
          {hours > 0 && (
            <div className="space-y-2 border-t border-[hsl(var(--border))] pt-3 text-sm">
              <p className="flex items-center justify-between text-[hsl(var(--muted-foreground))]">
                <span>{money(studio.hourlyRate)} × {hours} hours</span><span>{money(rentalCost)}</span>
              </p>
              <p className="flex items-center justify-between text-[hsl(var(--muted-foreground))]">
                <span>Refundable security deposit</span><span>{money(studio.securityDeposit)}</span>
              </p>
              <p className="flex items-center justify-between border-t border-[hsl(var(--border))] pt-3 font-semibold text-foreground">
                <span>Estimated total</span><span>{money(rentalCost + studio.securityDeposit)}</span>
              </p>
            </div>
          )}
        </div>
        <StudioButton
          type="submit"
          className="w-full"
          disabled={isPending || isOwner}
        >
          <CalendarDays size={16} />
          {isOwner ? "Your listing" : user ? "Request to book" : "Sign in to book"}
        </StudioButton>
        <p className="mt-3 flex items-center justify-center gap-1.5 text-center text-xs text-[hsl(var(--muted-foreground))]">
          <ShieldCheck size={14} /> No charge until the host confirms your request.
        </p>
      </form>

      {confirming && (
        <div
          className="fixed inset-0 z-[100] grid place-items-center bg-black/50 p-4"
          role="presentation"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget && !submitting) setConfirming(false);
          }}
        >
          <section
            role="dialog"
            aria-modal="true"
            aria-labelledby="booking-confirm-title"
            className="w-full max-w-md rounded-3xl bg-[hsl(var(--card))] p-6 shadow-2xl sm:p-8"
          >
            <h2 id="booking-confirm-title" className="font-heading text-2xl font-semibold">
              Confirm your request
            </h2>
            <p className="mt-2 text-sm text-[hsl(var(--muted-foreground))]">
              Review the schedule and estimate before sending this request to {studio.ownerName}.
            </p>
            <div className="my-6 space-y-3 rounded-2xl border border-[hsl(var(--border))] p-4 text-sm">
              <p className="flex items-center gap-2"><CalendarDays size={16} /> {bookingDate}</p>
              <p className="flex items-center gap-2"><Clock3 size={16} /> {startTime}–{endTime} · {hours} hours</p>
              <p className="flex justify-between"><span>Rental</span><span>{money(rentalCost)}</span></p>
              <p className="flex justify-between"><span>Security deposit</span><span>{money(studio.securityDeposit)}</span></p>
              <p className="flex justify-between border-t border-[hsl(var(--border))] pt-3 font-semibold">
                <span>Estimated total</span><span>{money(rentalCost + studio.securityDeposit)}</span>
              </p>
            </div>
            <div className="flex gap-3">
              <button
                type="button"
                disabled={submitting}
                onClick={() => setConfirming(false)}
                className="h-11 flex-1 rounded-full border border-[hsl(var(--border))] text-sm font-semibold disabled:opacity-50"
              >
                Go back
              </button>
              <StudioButton type="button" disabled={submitting} onClick={() => void createRequest()}>
                {submitting ? <><LoaderCircle size={16} className="animate-spin" /> Checking availability…</> : "Send request"}
              </StudioButton>
            </div>
          </section>
        </div>
      )}
    </>
  );
}
