import { StudioCardSkeleton } from "@/components/feedback/studio-card-skeleton";

export function StudiosGridSkeleton() {
  return (
    <div className="grid gap-x-6 gap-y-10 sm:grid-cols-2 lg:grid-cols-3">
      {Array.from({ length: 6 }, (_, index) => (
        <StudioCardSkeleton key={index} />
      ))}
    </div>
  );
}
