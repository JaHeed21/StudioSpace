import type { ReactNode } from "react";

export function SectionHeading({
  eyebrow,
  title,
  description,
  action,
  centered = false,
}: {
  eyebrow?: string;
  title: string;
  description?: string;
  action?: ReactNode;
  centered?: boolean;
}) {
  return (
    <div
      className={`mb-8 flex flex-col gap-5 sm:mb-10 sm:flex-row sm:items-end sm:justify-between ${
        centered ? "text-center sm:flex-col sm:items-center" : ""
      }`}
    >
      <div className={centered ? "max-w-2xl" : "max-w-2xl"}>
        {eyebrow && (
          <p className="mb-3 text-xs font-semibold uppercase tracking-[0.17em] text-[hsl(var(--accent))]">
            {eyebrow}
          </p>
        )}
        <h2 className="font-heading text-3xl font-semibold leading-tight tracking-[-0.045em] sm:text-4xl">
          {title}
        </h2>
        {description && (
          <p className="mt-3 max-w-xl text-sm leading-6 text-[hsl(var(--muted-foreground))] sm:text-base">
            {description}
          </p>
        )}
      </div>
      {!centered && action}
    </div>
  );
}
