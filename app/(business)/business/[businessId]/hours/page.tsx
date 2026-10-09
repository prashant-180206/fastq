import BusinessHours from "@/components/business/BusinnessHours";

interface BusinessHoursPageProps {
  params: Promise<{
    businessId: string;
  }>;
}

export default async function BusinessHoursPage({
  params,
}: BusinessHoursPageProps) {
  const { businessId } = await params;

  return <BusinessHours businessId={businessId} />;
}
