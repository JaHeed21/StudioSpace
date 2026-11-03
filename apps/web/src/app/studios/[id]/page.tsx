import { SiteLayout } from "@/components/site-layout";
import { StudioDetails } from "@/components/studios/studio-details";

export default async function StudioPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return (
    <SiteLayout>
      <StudioDetails studioId={id} />
    </SiteLayout>
  );
}
