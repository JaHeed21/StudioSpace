"use client";

import Image from "next/image";
import Link from "next/link";
import { Heart, LoaderCircle, MapPin, Trash2 } from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { EmptyState } from "@/components/feedback/empty-state";
import { ErrorState } from "@/components/feedback/error-state";
import { apiClient } from "@/lib/api-client";

interface SavedStudio {
  id: string;
  title: string;
  category: string;
  hourlyRate: number;
  rating: number | null;
  location: string;
  imageUrl: string;
}

export function WishlistContent() {
  const [studios, setStudios] = useState<SavedStudio[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [removing, setRemoving] = useState<string | null>(null);

  useEffect(() => {
    const controller = new AbortController();
    apiClient.get<{ studios: SavedStudio[] }>("/wishlist", { signal: controller.signal })
      .then(({ data }) => {
        setStudios(data.studios);
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

  const remove = async (studio: SavedStudio) => {
    setRemoving(studio.id);
    try {
      await apiClient.delete(`/wishlist/${encodeURIComponent(studio.id)}`);
      setStudios((current) => current.filter((saved) => saved.id !== studio.id));
      toast.success("Removed from your wishlist.");
    } catch {
      toast.error("Could not remove this studio. Please try again.");
    } finally {
      setRemoving(null);
    }
  };

  return (
    <section>
      <div className="mb-7">
        <p className="text-xs font-semibold uppercase tracking-[0.17em] text-[hsl(var(--accent))]">Saved for later</p>
        <h1 className="mt-2 font-heading text-3xl font-semibold tracking-[-0.045em]">Your wishlist</h1>
        <p className="mt-2 text-sm text-[hsl(var(--muted-foreground))]">A short list of spaces you’d love to create in.</p>
      </div>
      {loading ? (
        <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
          {[0, 1, 2].map((item) => <div key={item} className="aspect-[4/5] animate-pulse rounded-3xl bg-[hsl(var(--muted))]" />)}
        </div>
      ) : error ? (
        <ErrorState title="Wishlist unavailable" message="We couldn’t load your saved studios. Check your connection and try again." />
      ) : studios.length === 0 ? (
        <EmptyState title="Your wishlist is ready for inspiration." description="Save studios you like and they’ll be waiting here when you’re ready." />
      ) : (
        <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
          {studios.map((studio) => (
            <article key={studio.id} className="overflow-hidden rounded-3xl border border-[hsl(var(--border))] bg-[hsl(var(--card))]">
              <Link href={`/studios/${encodeURIComponent(studio.id)}`} className="relative block aspect-[4/3] bg-[hsl(var(--muted))]">
                {studio.imageUrl && <Image src={studio.imageUrl} alt={studio.title} fill unoptimized sizes="(max-width: 640px) 90vw, 40vw" className="object-cover" />}
              </Link>
              <div className="p-5">
                <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-[hsl(var(--accent))]">{studio.category}</p>
                <Link href={`/studios/${encodeURIComponent(studio.id)}`} className="mt-1 block font-heading text-lg font-semibold hover:underline">{studio.title}</Link>
                <p className="mt-2 flex items-center gap-1.5 text-xs text-[hsl(var(--muted-foreground))]"><MapPin size={13} />{studio.location}</p>
                <div className="mt-4 flex items-center justify-between border-t border-[hsl(var(--border))] pt-4">
                  <p className="text-sm"><strong>${studio.hourlyRate}</strong><span className="text-[hsl(var(--muted-foreground))]"> / hr</span></p>
                  <button type="button" disabled={Boolean(removing)} onClick={() => void remove(studio)} className="inline-flex min-h-9 items-center gap-2 rounded-full border border-[hsl(var(--border))] px-3 text-xs font-semibold text-[hsl(var(--muted-foreground))] hover:text-destructive disabled:opacity-50">
                    {removing === studio.id ? <LoaderCircle size={14} className="animate-spin" /> : <Trash2 size={14} />} Remove
                  </button>
                </div>
              </div>
            </article>
          ))}
        </div>
      )}
      {!loading && !error && studios.length === 0 && <Link href="/studios" className="mt-5 inline-flex items-center gap-2 text-sm font-semibold text-[hsl(var(--accent))] hover:underline"><Heart size={15} />Explore studios</Link>}
    </section>
  );
}
