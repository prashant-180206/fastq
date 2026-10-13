import { BusinessDashboardLayout } from "@/components/business/dashboard/business-dashboard-layout";

export default async function BusinessDetailLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ businessId: string }>;
}) {
  const { businessId } = await params;

  return (
    <BusinessDashboardLayout businessId={businessId}>
      {children}
    </BusinessDashboardLayout>
  );
}