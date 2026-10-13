export type BusinessType =
  | "business"
  | "government_office"
  | "restaurant"
  | "salon"
  | "other";

export const BUSINESS_TYPES: { value: BusinessType; label: string }[] = [
  { value: "business", label: "Business" },
  { value: "government_office", label: "Government office" },
  { value: "restaurant", label: "Restaurant" },
  { value: "salon", label: "Salon" },
  { value: "other", label: "Other" },
];

export function businessTypeLabel(type: string | null | undefined): string {
  const match = BUSINESS_TYPES.find((entry) => entry.value === type);
  return match?.label ?? "Business";
}