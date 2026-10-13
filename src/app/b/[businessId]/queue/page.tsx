import { JoinQueueForm } from "@/components/business/join-queue-form";

export default async function JoinQueuePage({
  params,
  searchParams,
}: {
  params: Promise<{ businessId: string }>;
  searchParams: Promise<{ queueId?: string; serviceId?: string }>;
}) {
  const { businessId } = await params;
  const query = await searchParams;

  return (
    <JoinQueueForm
      businessId={businessId}
      initialQueueId={query.queueId}
      initialServiceId={query.serviceId}
    />
  );
}