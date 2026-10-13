import { CustomerMapView } from "@/components/customer/customer-map-view";

export default async function CustomerMapPage({
  searchParams,
}: {
  searchParams: Promise<{ lat?: string; lng?: string; radius?: string }>;
}) {
  const params = await searchParams;

  const lat = Number(params.lat);
  const lng = Number(params.lng);
  const radius = Number(params.radius);

  const hasCoords =
    Number.isFinite(lat) &&
    Number.isFinite(lng) &&
    lat >= -90 &&
    lat <= 90 &&
    lng >= -180 &&
    lng <= 180;

  return (
    <CustomerMapView
      initialCenter={
        hasCoords ? { latitude: lat, longitude: lng } : null
      }
      initialRadiusKm={
        Number.isFinite(radius) && radius > 0 ? radius : undefined
      }
    />
  );
}