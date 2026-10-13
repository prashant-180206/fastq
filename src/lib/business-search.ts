import type { BusinessType } from "./business-type";

export type BusinessSearchFilters = {
  keyword: string;
  type: BusinessType | "all";
  center: { latitude: number; longitude: number } | null;
  radiusKm: number;
};

export const DEFAULT_RADIUS_KM = 10;

export const RADIUS_OPTIONS = [5, 10, 25, 50, 100] as const;

export const EMPTY_FILTERS: BusinessSearchFilters = {
  keyword: "",
  type: "all",
  center: null,
  radiusKm: DEFAULT_RADIUS_KM,
};