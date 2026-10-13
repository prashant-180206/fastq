import { BookAppointmentForm } from "@/components/business/book-appointment-form";

export default async function BookAppointmentPage({
  params,
  searchParams,
}: {
  params: Promise<{ businessId: string }>;
  searchParams: Promise<{ serviceId?: string }>;
}) {
  const { businessId } = await params;
  const query = await searchParams;

  return (
    <BookAppointmentForm
      businessId={businessId}
      initialServiceId={query.serviceId}
    />
  );
}