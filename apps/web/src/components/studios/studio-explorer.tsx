"use client";

import { Search, SlidersHorizontal, X } from "lucide-react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import { EmptyState } from "@/components/feedback/empty-state";
import { ErrorState } from "@/components/feedback/error-state";
import { SectionHeading } from "@/components/ui/section-heading";
import { StudioCard } from "@/components/studios/studio-card";
import { StudiosGridSkeleton } from "@/components/studios/studios-grid-skeleton";
import { apiClient } from "@/lib/api-client";
import { STUDIO_CATEGORIES, type Studio } from "@/lib/studios";

interface StudioResponse {
  studios: Studio[];
  pagination: { page: number; limit: number; total: number; pages: number };
}

const fieldClass =
  "h-11 w-full rounded-xl border border-[hsl(var(--border))] bg-[hsl(var(--background))] px-3 text-sm outline-none transition focus:border-[hsl(var(--accent))] focus:ring-2 focus:ring-[hsl(var(--accent)/.12)]";

export function StudioExplorer() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const queryString = searchParams.toString();
  const [data, setData] = useState<StudioResponse | null>(null);
  const [dataQuery, setDataQuery] = useState<string | null>(null);
  const [errorQuery, setErrorQuery] = useState<string | null>(null);

  useEffect(() => {
    const controller = new AbortController();
    apiClient
      .get<StudioResponse>(`/studios${queryString ? `?${queryString}` : ""}`, {
        signal: controller.signal,
      })
      .then(({ data: response }) => {
        setData(response);
        setDataQuery(queryString);
        setErrorQuery(null);
      })
      .catch(() => {
        if (!controller.signal.aborted) {
          setDataQuery(queryString);
          setErrorQuery(queryString);
        }
      });

    return () => controller.abort();
  }, [queryString]);

  const updateQuery = (values: Record<string, string>, resetPage = true) => {
    const next = new URLSearchParams(queryString);
    for (const [key, value] of Object.entries(values)) {
      if (value) next.set(key, value);
      else next.delete(key);
    }
    if (resetPage) next.delete("page");
    const nextQuery = next.toString();
    router.push(nextQuery ? `${pathname}?${nextQuery}` : pathname, { scroll: false });
  };

  const clearFilters = () => {
    router.push(pathname);
  };

  const params = new URLSearchParams(queryString);
  const loading = dataQuery !== queryString;
  const error = errorQuery === queryString;
  const activeFilters = Boolean(
    params.get("search") ||
      params.get("category") ||
      params.get("minPrice") ||
      params.get("maxPrice") ||
      params.get("minRating"),
  );

  return (
    <div className="mx-auto max-w-[1440px] px-5 py-12 sm:px-8 sm:py-16 lg:px-12 lg:py-20">
      <SectionHeading
        eyebrow="The studio directory"
        title="Find the room that gets it."
        description="Spaces with the right light, the right gear, and room for your best work."
      />

      <StudioFilterForm
      key={queryString}
      params={params}
      onApply={(values) => updateQuery(values)}
      onSort={(value) => updateQuery({ sort: value })}
      />

      <div className="mb-6 mt-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-sm text-[hsl(var(--muted-foreground))]" aria-live="polite">
          {loading ? "Finding your space…" : `${data?.pagination.total ?? 0} spaces to explore`}
        </p>
        <div className="flex items-center gap-3">
          {activeFilters && (
            <button type="button" onClick={clearFilters} className="inline-flex items-center gap-1 text-xs font-medium text-[hsl(var(--muted-foreground))] hover:text-foreground">
              <X size={14} /> Clear filters
            </button>
          )}
        </div>
      </div>

      {loading ? (
        <StudiosGridSkeleton />
      ) : error ? (
        <ErrorState title="We couldn’t find the studios" message="Check your connection and try the search again." />
      ) : !data?.studios.length ? (
        <EmptyState title="No spaces match just yet." description="Try widening your price range or clearing a filter to see more studios." />
      ) : (
        <>
          <div className="grid gap-x-6 gap-y-10 sm:grid-cols-2 lg:grid-cols-3">
            {data.studios.map((studio) => <StudioCard key={studio.id} studio={studio} />)}
          </div>
          {data.pagination.pages > 1 && (
            <nav aria-label="Studio results pages" className="mt-12 flex items-center justify-center gap-4">
              <button
                type="button"
                disabled={data.pagination.page <= 1}
                onClick={() => updateQuery({ page: String(data.pagination.page - 1) }, false)}
                className="rounded-full border border-[hsl(var(--border))] px-4 py-2 text-sm disabled:opacity-40"
              >
                Previous
              </button>
              <span className="text-sm text-[hsl(var(--muted-foreground))]">
                Page {data.pagination.page} of {data.pagination.pages}
              </span>
              <button
                type="button"
                disabled={data.pagination.page >= data.pagination.pages}
                onClick={() => updateQuery({ page: String(data.pagination.page + 1) }, false)}
                className="rounded-full border border-[hsl(var(--border))] px-4 py-2 text-sm disabled:opacity-40"
              >
                Next
              </button>
            </nav>
          )}
        </>
      )}
    </div>
  );
}

function StudioFilterForm({
  params,
  onApply,
  onSort,
}: {
  params: URLSearchParams;
  onApply: (values: Record<string, string>) => void;
  onSort: (value: string) => void;
}) {
  const [search, setSearch] = useState(params.get("search") ?? "");
  const [category, setCategory] = useState(params.get("category") ?? "");
  const [minPrice, setMinPrice] = useState(params.get("minPrice") ?? "");
  const [maxPrice, setMaxPrice] = useState(params.get("maxPrice") ?? "");
  const [minRating, setMinRating] = useState(params.get("minRating") ?? "");
  const [sort, setSort] = useState(params.get("sort") ?? "newest");

  return (
    <form
      onSubmit={(event) => {
        event.preventDefault();
        onApply({
          search: search.trim(),
          category,
          minPrice,
          maxPrice,
          minRating,
          sort,
        });
      }}
      className="mb-9 rounded-3xl border border-[hsl(var(--border))] bg-[hsl(var(--surface))] p-4 sm:p-5"
    >
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-[minmax(190px,1.4fr)_repeat(4,minmax(115px,.8fr))_auto]">
        <label className="relative sm:col-span-2 lg:col-span-1">
          <span className="sr-only">Search title or location</span>
          <Search size={17} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[hsl(var(--muted-foreground))]" />
          <input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Title or location" className={`${fieldClass} pl-10`} />
        </label>
        <label>
          <span className="sr-only">Category</span>
          <select className={fieldClass} value={category} onChange={(event) => setCategory(event.target.value)}>
            <option value="">All categories</option>
            {STUDIO_CATEGORIES.map((item) => <option key={item}>{item}</option>)}
          </select>
        </label>
        <label>
          <span className="sr-only">Minimum hourly rate</span>
          <input type="number" min="0" value={minPrice} onChange={(event) => setMinPrice(event.target.value)} placeholder="Min $ / hr" className={fieldClass} />
        </label>
        <label>
          <span className="sr-only">Maximum hourly rate</span>
          <input type="number" min="0" value={maxPrice} onChange={(event) => setMaxPrice(event.target.value)} placeholder="Max $ / hr" className={fieldClass} />
        </label>
        <label>
          <span className="sr-only">Minimum rating</span>
          <select className={fieldClass} value={minRating} onChange={(event) => setMinRating(event.target.value)}>
            <option value="">Any rating</option>
            <option value="3">3+ stars</option>
            <option value="4">4+ stars</option>
            <option value="4.5">4.5+ stars</option>
          </select>
        </label>
        <button type="submit" className="inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-[hsl(var(--charcoal))] px-5 text-sm font-semibold text-[hsl(var(--background))] transition hover:opacity-85">
          <SlidersHorizontal size={16} /> Search
        </button>
      </div>
      <label className="mt-4 flex w-fit items-center gap-2 text-xs text-[hsl(var(--muted-foreground))]">
        Sort
        <select
          value={sort}
          onChange={(event) => {
            setSort(event.target.value);
            onSort(event.target.value);
          }}
          className="h-9 rounded-lg border border-[hsl(var(--border))] bg-[hsl(var(--background))] px-2.5 text-xs font-medium text-foreground"
        >
          <option value="newest">Newest</option>
          <option value="price_asc">Price: low to high</option>
          <option value="price_desc">Price: high to low</option>
          <option value="rating">Top rated</option>
        </select>
      </label>
    </form>
  );
}
