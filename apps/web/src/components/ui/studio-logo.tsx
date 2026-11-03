import Link from "next/link";
import { Aperture } from "lucide-react";
import { cn } from "@/lib/utils";

export function StudioLogo({ className }: { className?: string }) {
  return (
    <Link
      href="/"
      aria-label="StudioSpace home"
      className={cn("inline-flex items-center gap-2.5", className)}
    >
      <Aperture
        aria-hidden="true"
        size={25}
        strokeWidth={2.2}
        className="text-[hsl(var(--accent))]"
      />
      <span className="font-semibold tracking-[-0.045em]">
        studio<span className="font-normal">space</span>
      </span>
    </Link>
  );
}
