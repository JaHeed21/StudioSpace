"use client";

import Image from "next/image";
import Link from "next/link";
import { CalendarDays, Edit3, LoaderCircle, MapPin, Plus, Trash2 } from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";
import { EmptyState } from "@/components/feedback/empty-state";
import { ErrorState } from "@/components/feedback/error-state";
import { LoadingState } from "@/components/feedback/loading-state";
import { StudioLinkButton } from "@/components/ui/studio-button";
import { apiClient } from "@/lib/api-client";
import { formatStudioDate, type Studio } from "@/lib/studios";

export function MyListings() {
  const [studios, setStudios] = useState<Studio[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState(false);
  const [deleting, setDeleting] = useState<string | null>(null);
  const [confirming, setConfirming] = useState<Studio | null>(null);

  const loadListings = useCallback(() => {
    return apiClient
      .get<{ studios: Studio[] }>("/studios/my-listings")
      .then(({ data }) => {
        setStudios(data.studios);
        setLoadError(false);
      })
      .catch(() => setLoadError(true))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    void loadListings();
  }, [loadListings]);

  const deleteListing = async () => {
    if (!confirming) return;
    const target = confirming;
    setDeleting(target.id);
    try {
      await apiClient.delete(`/studios/${encodeURIComponent(target.id)}`);
      setStudios((current) => current.filter((studio) => studio.id !== target.id));
      toast.success("Studio listing deleted.");
      setConfirming(null);
    } catch (error) {
      const status =
        typeof error === "object" && error !== null && "response" in error
          ? (error.response as { status?: number } | undefined)?.status
          : undefined;
      if (status === 403) toast.error("You can only delete your own studio listings.");
      else if (status === 404) {
        toast.error("This listing was already removed.");
        setConfirming(null);
        loadListings();
      } else toast.error("Could not delete the listing. Please try again.");
    } finally {
      setDeleting(null);
    }
  };

  return (
    <>
      <div className="flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.17em] text-[hsl(var(--accent))]">Your creative corner</p>
          <h1 className="mt-2 font-heading text-3xl font-semibold tracking-[-0.045em] sm:text-4xl">My listings</h1>
          <p className="mt-2 text-sm text-[hsl(var(--muted-foreground))]">Manage the spaces you’ve shared with the community.</p>
        </div>
        <StudioLinkButton href="/add-studio"><Plus size={16} /> Add a studio</StudioLinkButton>
      </div>

      <div className="mt-7 grid gap-3 sm:grid-cols-2">
        {[
          { label: "Total listings", value: studios.length },
          { label: "Active listings", value: studios.length },
        ].map((stat) => (
          <div key={stat.label} className="rounded-2xl border border-[hsl(var(--border))] bg-[hsl(var(--card))] px-5 py-4">
            <p className="text-xs font-medium text-[hsl(var(--muted-foreground))]">{stat.label}</p>
            <p className="mt-2 font-heading text-2xl font-semibold">
              {loading ? <span className="inline-block h-7 w-10 animate-pulse rounded bg-[hsl(var(--muted))]" /> : stat.value}
            </p>
          </div>
        ))}
      </div>

      <div className="mt-9">
        {loading ? (
          <div className="flex min-h-64 items-center justify-center"><LoadingState label="Loading your studios" /></div>
        ) : loadError ? (
          <ErrorState title="Your listings didn’t load" message="Check your connection and try again." />
        ) : studios.length === 0 ? (
          <EmptyState title="Your first listing starts here." description="Share a studio with creators looking for their next good space." />
        ) : (
          <div className="space-y-4">
            {studios.map((studio) => (
              <article key={studio.id} className="grid gap-4 rounded-3xl border border-[hsl(var(--border))] bg-[hsl(var(--card))] p-4 sm:grid-cols-[200px_minmax(0,1fr)_auto] sm:items-center sm:gap-6 sm:p-5">
                <Link href={`/studios/${encodeURIComponent(studio.id)}`} className="relative aspect-[4/3] overflow-hidden rounded-2xl bg-[hsl(var(--muted))] sm:aspect-[4/3]">
                  {studio.imageUrl && <Image src={studio.imageUrl} alt={studio.title} fill unoptimized sizes="200px" className="object-cover transition duration-500 hover:scale-105" />}
                </Link>
                <div className="min-w-0">
                  <p className="text-xs font-semibold uppercase tracking-[0.14em] text-[hsl(var(--accent))]">{studio.category}</p>
                  <h2 className="mt-1 truncate font-heading text-xl font-semibold tracking-tight">{studio.title}</h2>
                  <p className="mt-2 flex items-center gap-1.5 text-sm text-[hsl(var(--muted-foreground))]">
                    <MapPin size={14} /> <span className="truncate">{studio.location}</span>
                  </p>
                  <div className="mt-3 flex flex-wrap items-center gap-x-5 gap-y-2 text-xs text-[hsl(var(--muted-foreground))]">
                    <span><strong className="text-foreground">${studio.hourlyRate}</strong> / hour</span>
                    <span className="inline-flex items-center gap-1"><CalendarDays size={13} /> Added {formatStudioDate(studio.createdAt)}</span>
                  </div>
                </div>
                <div className="flex gap-2 sm:flex-col">
                  <Link href={`/studios/edit/${encodeURIComponent(studio.id)}`} className="inline-flex min-h-10 flex-1 items-center justify-center gap-2 rounded-full border border-[hsl(var(--border))] px-4 text-xs font-semibold transition hover:bg-[hsl(var(--surface))] sm:flex-none">
                    <Edit3 size={14} /> Edit
                  </Link>
                  <button type="button" onClick={() => setConfirming(studio)} className="inline-flex min-h-10 flex-1 items-center justify-center gap-2 rounded-full border border-destructive/25 px-4 text-xs font-semibold text-destructive transition hover:bg-destructive/5 sm:flex-none">
                    <Trash2 size={14} /> Delete
                  </button>
                </div>
              </article>
            ))}
          </div>
        )}
      </div>

      {confirming && (
        <div className="fixed inset-0 z-50 grid place-items-center bg-black/55 p-5 backdrop-blur-sm" onClick={(event) => {
          if (event.target === event.currentTarget && !deleting) setConfirming(null);
        }}>
          <section role="alertdialog" aria-modal="true" aria-labelledby="delete-studio-title" className="w-full max-w-md rounded-3xl bg-[hsl(var(--background))] p-6 shadow-2xl sm:p-8">
            <h2 id="delete-studio-title" className="font-heading text-xl font-semibold">Delete this listing?</h2>
            <p className="mt-3 text-sm leading-6 text-[hsl(var(--muted-foreground))]">
              <span className="font-medium text-foreground">{confirming.title}</span> will be removed from StudioSpace. This can’t be undone.
            </p>
            <div className="mt-7 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
              <button type="button" disabled={Boolean(deleting)} onClick={() => setConfirming(null)} className="min-h-10 rounded-full border border-[hsl(var(--border))] px-5 text-sm font-semibold disabled:opacity-50">Keep listing</button>
              <button type="button" disabled={Boolean(deleting)} onClick={() => void deleteListing()} className="inline-flex min-h-10 items-center justify-center gap-2 rounded-full bg-destructive px-5 text-sm font-semibold text-destructive-foreground disabled:opacity-60">
                {deleting ? <LoaderCircle size={16} className="animate-spin" /> : <Trash2 size={15} />}
                Delete listing
              </button>
            </div>
          </section>
        </div>
      )}
    </>
  );
}
