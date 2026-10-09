import { BusinessDashboard } from "@/components/business/BusinessHub";

export default async function BusinessDashboardPage({
  params,
}: {
  params: Promise<{ businessId: string }>;
}) {
  const { businessId } = await params;

  return <BusinessDashboard businessId={businessId} />;
}
