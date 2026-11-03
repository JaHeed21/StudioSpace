import { Suspense } from "react";
import { LoadingState } from "@/components/feedback/loading-state";
import { SiteLayout } from "@/components/site-layout";
import { StudioExplorer } from "@/components/studios/studio-explorer";

export default function StudiosPage() {
  return (
    <SiteLayout>
      <Suspense
        fallback={
          <div className="flex min-h-[65vh] items-center justify-center">
            <LoadingState label="Loading studios" />
          </div>
        }
      >
        <StudioExplorer />
      </Suspense>
    </SiteLayout>
  );
}
