"use client";

import Image from "next/image";
import Link from "next/link";
import { ArrowLeft, BadgeCheck, MapPin, ShieldCheck, Star, Users } from "lucide-react";
import { useEffect, useState } from "react";
import { EmptyState } from "@/components/feedback/empty-state";
import { ErrorState } from "@/components/feedback/error-state";
import { LoadingState } from "@/components/feedback/loading-state";
import { BookingPanel } from "@/components/studios/booking-panel";
import { WishlistButton } from "@/components/dashboard/wishlist-button";
import { apiClient } from "@/lib/api-client";
import type { Studio } from "@/lib/studios";

export function StudioDetails({ studioId }: { studioId: string }) {
  const [studio, setStudio] = useState<Studio | null>(null);
  const [loading, setLoading] = useState(true);
  const [missing, setMissing] = useState(false);
  const [error, setError] = useState(false);

  useEffect(() => {
    let active = true;
    apiClient
      .get<{ studio: Studio }>(`/studios/${encodeURIComponent(studioId)}`)
      .then(({ data }) => {
        if (active) setStudio(data.studio);
      })
      .catch((requestError: unknown) => {
        if (!active) return;
        const status =
          typeof requestError === "object" && requestError !== null && "response" in requestError
            ? (requestError.response as { status?: number } | undefined)?.status
            : undefined;
        if (status === 404) setMissing(true);
        else setError(true);
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, [studioId]);

  if (loading) {
    return (
      <div className="flex min-h-[65vh] items-center justify-center">
        <LoadingState label="Finding studio details" />
      </div>
    );
  }
  if (missing) {
    return (
      <div className="mx-auto max-w-[1440px] px-5 py-20 sm:px-8 lg:px-12">
        <EmptyState title="This studio is no longer listed." description="It may have been removed by its host. Explore the directory to find another space." />
        <Link href="/studios" className="mt-6 inline-flex text-sm font-semibold text-[hsl(var(--accent))] hover:underline">
          Browse studios
        </Link>
      </div>
    );
  }
  if (error || !studio) {
    return (
      <div className="mx-auto max-w-3xl px-5 py-20">
        <ErrorState title="Studio details unavailable" message="We couldn’t load this listing. Please try again." />
      </div>
    );
  }

  return (
    <article className="mx-auto max-w-[1180px] px-5 py-8 sm:px-8 sm:py-12">
      <Link href="/studios" className="mb-6 inline-flex items-center gap-2 text-sm font-medium text-[hsl(var(--muted-foreground))] hover:text-foreground">
        <ArrowLeft size={16} /> Back to studios
      </Link>
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[hsl(var(--accent))]">{studio.category}</p>
          <h1 className="mt-2 font-heading text-3xl font-semibold tracking-[-0.045em] sm:text-4xl">{studio.title}</h1>
          <p className="mt-2 flex items-center gap-1.5 text-sm text-[hsl(var(--muted-foreground))]">
            <MapPin size={15} /> {studio.location}
          </p>
        </div>
        {studio.isDemo && (
          <p className="mt-5 rounded-2xl border border-[hsl(var(--accent)/.3)] bg-[hsl(var(--accent)/.08)] px-4 py-3 text-sm text-[hsl(var(--muted-foreground))]">
            Sample listing for demonstration. Booking requests are disabled for this space.
          </p>
        )}
        <span className="inline-flex items-center gap-1.5 text-sm font-medium">
          <Star size={15} fill="currentColor" className="text-[hsl(var(--accent))]" />
          {studio.rating === null ? "New listing" : `${studio.rating.toFixed(1)} · guest rating`}
        </span>
      </div>

      <div className="relative mt-7 aspect-[16/9] overflow-hidden rounded-3xl bg-[hsl(var(--muted))] sm:aspect-[2.1/1]">
        {studio.imageUrl && (
          <Image
            src={studio.imageUrl}
            alt={studio.title}
            fill
            unoptimized
            priority
            sizes="(max-width: 1180px) 100vw, 1180px"
            className="object-cover"
          />
        )}
      </div>

      <div className="mt-9 grid gap-10 lg:grid-cols-[minmax(0,1fr)_340px] lg:gap-16">
        <div>
          <section className="border-b border-[hsl(var(--border))] pb-7">
            <div className="flex items-center justify-between gap-5">
              <div>
                <h2 className="font-heading text-xl font-semibold">Hosted by {studio.ownerName}</h2>
                <p className="mt-1 text-sm text-[hsl(var(--muted-foreground))]">{studio.location}</p>
              </div>
              <span className="grid size-12 shrink-0 place-items-center rounded-full bg-[hsl(var(--accent)/.12)] text-lg font-semibold text-[hsl(var(--accent))]">
                {studio.ownerName.slice(0, 1).toUpperCase()}
              </span>
            </div>
          </section>

          <section className="border-b border-[hsl(var(--border))] py-7">
            <h2 className="font-heading text-xl font-semibold">About this space</h2>
            <p className="mt-3 whitespace-pre-line text-sm leading-7 text-[hsl(var(--muted-foreground))]">{studio.description}</p>
          </section>

          <section className="border-b border-[hsl(var(--border))] py-7">
            <h2 className="font-heading text-xl font-semibold">A few useful details</h2>
            <ul className="mt-5 grid gap-4 sm:grid-cols-2">
              {[
                { icon: Users, text: `Up to ${studio.maxCapacity} people` },
                { icon: ShieldCheck, text: `$${studio.securityDeposit} security deposit` },
                { icon: BadgeCheck, text: "Listed by a verified account" },
              ].map(({ icon: Icon, text }) => (
                <li key={text} className="flex items-center gap-3 text-sm text-[hsl(var(--muted-foreground))]">
                  <Icon size={17} className="text-[hsl(var(--accent))]" /> {text}
                </li>
              ))}
            </ul>
          </section>

          <section className="border-b border-[hsl(var(--border))] py-7">
            <h2 className="font-heading text-xl font-semibold">What this space offers</h2>
            {studio.amenities.length ? (
              <ul className="mt-5 grid gap-3 sm:grid-cols-2">
                {studio.amenities.map((amenity) => (
                  <li key={amenity} className="text-sm text-[hsl(var(--muted-foreground))]">✓&nbsp;&nbsp;{amenity}</li>
                ))}
              </ul>
            ) : (
              <p className="mt-3 text-sm text-[hsl(var(--muted-foreground))]">The host hasn’t listed amenities yet.</p>
            )}
          </section>

          <section className="py-7">
            <h2 className="font-heading text-xl font-semibold">Reviews</h2>
            <p className="mt-3 text-sm leading-6 text-[hsl(var(--muted-foreground))]">
              Reviews will appear here after creators complete bookings at this space.
            </p>
          </section>
        </div>

        <aside className="h-fit rounded-3xl border border-[hsl(var(--border))] bg-[hsl(var(--card))] p-6 shadow-[0_12px_40px_-24px_rgba(36,35,33,.24)] lg:sticky lg:top-28">
          <p><span className="font-heading text-2xl font-semibold">${studio.hourlyRate}</span><span className="text-sm text-[hsl(var(--muted-foreground))]"> / hour</span></p>
          <p className="mt-1 text-xs text-[hsl(var(--muted-foreground))]">Security deposit: ${studio.securityDeposit}</p>
          <div className="my-5 rounded-2xl border border-[hsl(var(--border))] p-4 text-sm">
            <div className="flex items-center justify-between gap-4">
              <span className="text-[hsl(var(--muted-foreground))]">Capacity</span>
              <span className="font-medium">Up to {studio.maxCapacity} people</span>
            </div>
          </div>
          <div className="space-y-4">
            <WishlistButton studioId={studio.id} />
            {studio.isDemo ? (
              <p className="rounded-2xl bg-[hsl(var(--muted))] p-4 text-sm text-[hsl(var(--muted-foreground))]">
                This demo space is not available for booking.
              </p>
            ) : (
              <BookingPanel studio={studio} />
            )}
          </div>
        </aside>
      </div>
    </article>
  );
}
