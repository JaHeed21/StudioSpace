import Image from "next/image";
import Link from "next/link";
import { ArrowUpRight, MapPin, Star } from "lucide-react";
import { StudioLinkButton } from "@/components/ui/studio-button";

export interface StudioCardData {
  id: string;
  title: string;
  category: string;
  hourlyRate: number;
  rating: number | null;
  location: string;
  imageUrl: string;
  isDemo?: boolean;
}

export function StudioCard({ studio }: { studio: StudioCardData }) {
  const detailsHref = `/studios/${encodeURIComponent(studio.id)}`;

  return (
    <article className="group min-w-0">
      <Link
        href={detailsHref}
        aria-label={`View ${studio.title} details`}
        className="relative block aspect-[4/3] overflow-hidden rounded-[1.35rem] bg-[hsl(var(--muted))]"
      >
        {studio.isDemo && (
          <span className="absolute right-3 top-3 z-10 rounded-full bg-[#242321]/85 px-3 py-1.5 text-[10px] font-semibold tracking-wide text-white backdrop-blur">
            Demo listing
          </span>
        )}
        {studio.imageUrl ? (
          <Image
            src={studio.imageUrl}
            alt={studio.title}
            fill
            unoptimized
            sizes="(max-width: 640px) 90vw, (max-width: 1024px) 45vw, 30vw"
            className="object-cover transition duration-700 group-hover:scale-[1.045]"
          />
        ) : (
          <div className="absolute inset-0 grid place-items-center bg-[hsl(var(--muted))] text-sm text-[hsl(var(--muted-foreground))]">
            Studio photo coming soon
          </div>
        )}
        <span className="absolute left-3 top-3 rounded-full bg-[hsl(var(--background)/.94)] px-3 py-1.5 text-[11px] font-semibold tracking-wide shadow-sm backdrop-blur">
          {studio.category}
        </span>
        <span
          aria-hidden="true"
          className="absolute bottom-3 right-3 grid size-10 translate-y-2 place-items-center rounded-full bg-white text-[#242321] opacity-0 shadow-md transition duration-200 group-hover:translate-y-0 group-hover:opacity-100"
        >
          <ArrowUpRight size={18} />
        </span>
      </Link>
      <div className="flex items-start justify-between gap-3 pt-4">
        <div className="min-w-0">
          <h3 className="truncate font-heading text-lg font-semibold tracking-tight">
            <Link href={detailsHref} className="hover:underline">
              {studio.title}
            </Link>
          </h3>
          <p className="mt-1 flex items-center gap-1.5 text-sm text-[hsl(var(--muted-foreground))]">
            <MapPin size={14} aria-hidden="true" />
            <span className="truncate">{studio.location}</span>
          </p>
        </div>
        <span className="mt-1 flex shrink-0 items-center gap-1 text-sm font-medium">
          <Star
            size={14}
            fill="currentColor"
            className="text-[hsl(var(--accent))]"
            aria-hidden="true"
          />
          {studio.rating === null ? "New" : studio.rating.toFixed(1)}
        </span>
      </div>
      <div className="mt-3 flex items-center justify-between gap-3">
        <p className="text-sm">
          <span className="font-semibold">${studio.hourlyRate}</span>
          <span className="text-[hsl(var(--muted-foreground))]"> / hour</span>
        </p>
        <StudioLinkButton
          href={detailsHref}
          variant="secondary"
          className="min-h-9 rounded-full px-3.5 text-xs"
        >
          View details
        </StudioLinkButton>
      </div>
    </article>
  );
}
