// import BusinessStaff from "@/components/business/business-staff";

import BusinessStaff from "@/components/business/BusinessStaff";

interface StaffPageProps {
  params: Promise<{
    businessId: string;
  }>;
}

export default async function StaffPage({ params }: StaffPageProps) {
  const { businessId } = await params;

  return <BusinessStaff businessId={businessId} />;
}
