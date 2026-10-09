import BusinessSettings from "@/components/business/BusinessSettings";

interface SettingsPageProps {
  params: Promise<{
    businessId: string;
  }>;
}

export default async function SettingsPage({ params }: SettingsPageProps) {
  const { businessId } = await params;

  return <BusinessSettings businessId={businessId} />;
}
