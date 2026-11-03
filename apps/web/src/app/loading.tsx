import { LoadingState } from "@/components/feedback/loading-state";

export default function LoadingPage() {
  return (
    <main className="flex min-h-screen items-center justify-center">
      <LoadingState label="Loading StudioSpace" />
    </main>
  );
}

