import { BusinessServices } from "@/components/services/ServicePage";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Services | Quiskip",
  description: "Manage services offered by your business.",
};

export default async function BusinessServicesPage({
  params,
}: {
  params: Promise<{ businessId: string }>;
}) {
  const { businessId } = await params;

  return <BusinessServices businessId={businessId} />;
}
