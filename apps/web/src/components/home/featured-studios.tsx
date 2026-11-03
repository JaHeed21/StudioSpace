"use client";

import { useEffect, useState } from "react";
import { EmptyState } from "@/components/feedback/empty-state";
import { ErrorState } from "@/components/feedback/error-state";
import { StudioCardSkeleton } from "@/components/feedback/studio-card-skeleton";
import { SectionHeading } from "@/components/ui/section-heading";
import { StudioLinkButton } from "@/components/ui/studio-button";
import { apiClient } from "@/lib/api-client";
import { StudioCard, type StudioCardData } from "@/components/studios/studio-card";

export function FeaturedStudios() {
  const [studios, setStudios] = useState<StudioCardData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    let active = true;

    apiClient
      .get<{ studios: StudioCardData[] }>("/studios/featured")
      .then(({ data }) => {
        if (active) setStudios(data.studios);
      })
      .catch(() => {
        if (active) setError(true);
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
    };
  }, []);

  return (
    <section id="studios" className="scroll-mt-24 py-20 sm:py-24 lg:py-28">
      <div className="mx-auto max-w-[1440px] px-5 sm:px-8 lg:px-12">
        <SectionHeading
          eyebrow="The good spaces"
          title="Find a room for your next big thing."
          description="A few of the spaces creators are loving right now."
          action={
            <StudioLinkButton href="/studios" variant="secondary">
              Browse all spaces
            </StudioLinkButton>
          }
        />

        {loading ? (
          <div className="grid gap-x-6 gap-y-10 sm:grid-cols-2 lg:grid-cols-3">
            {Array.from({ length: 6 }, (_, index) => (
              <StudioCardSkeleton key={index} />
            ))}
          </div>
        ) : error ? (
          <ErrorState
            title="Studios didn’t load"
            message="We couldn’t connect to the studio directory. Please refresh and try again."
          />
        ) : studios.length === 0 ? (
          <EmptyState
            title="The first spaces are getting ready."
            description="There aren’t any published studios just yet. Check back soon to find your next creative home."
          />
        ) : (
          <div className="grid gap-x-6 gap-y-10 sm:grid-cols-2 lg:grid-cols-3">
            {studios.slice(0, 6).map((studio) => (
              <StudioCard key={studio.id} studio={studio} />
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
