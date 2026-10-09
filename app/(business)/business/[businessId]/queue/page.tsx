import type { Metadata } from "next";
import { Id } from "@/convex/_generated/dataModel";
import { api } from "@/convex/_generated/api";
import BusinessQueue from "@/components/queue/BusinessQueue";

export const metadata: Metadata = {
  title: "Queue | Quiskip",
  description: "Manage your live customer queues.",
};

export default async function BusinessQueuePage({
  params,
}: {
  params: Promise<{ businessId: string }>;
}) {
  const { businessId } = await params;

  return <BusinessQueue businessId={businessId} />;
}
