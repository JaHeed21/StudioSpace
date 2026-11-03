import { Aperture } from "lucide-react";

export function EmptyState({
  title,
  description,
}: {
  title: string;
  description: string;
}) {
  return (
    <div className="flex min-h-64 flex-col items-center justify-center rounded-3xl border border-dashed border-[hsl(var(--border))] bg-[hsl(var(--surface))] px-6 py-12 text-center">
      <span className="mb-5 grid size-14 place-items-center rounded-full bg-[hsl(var(--muted))] text-[hsl(var(--accent))]">
        <Aperture size={25} aria-hidden="true" />
      </span>
      <h3 className="font-heading text-xl font-semibold tracking-tight">{title}</h3>
      <p className="mt-2 max-w-md text-sm leading-6 text-[hsl(var(--muted-foreground))]">
        {description}
      </p>
    </div>
  );
}
