export function StudioCardSkeleton() {
  return (
    <div aria-hidden="true" className="animate-pulse">
      <div className="aspect-[4/3] rounded-2xl bg-[hsl(var(--muted))]" />
      <div className="mt-4 h-4 w-3/4 rounded bg-[hsl(var(--muted))]" />
      <div className="mt-3 h-3 w-1/2 rounded bg-[hsl(var(--muted))]" />
      <div className="mt-4 h-3 w-2/3 rounded bg-[hsl(var(--muted))]" />
    </div>
  );
}
