"use client";

import Link from "next/link";
import dynamic from "next/dynamic";
import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { BusinessSearchFilters } from "@/components/business/business-search-filters";
import { useBusinessSearch } from "@/hooks/use-business-search";
import {
  DEFAULT_RADIUS_KM,
  type BusinessSearchFilters as BusinessFilters,
} from "@/lib/business-search";
import { ArrowLeft01Icon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";

const BusinessMap = dynamic(
  () =>
    import("@/components/business/business-map").then(
      (mod) => mod.BusinessMap,
    ),
  {
    ssr: false,
    loading: () => (
      <div className="flex h-full w-full items-center justify-center bg-muted/40" aria-label="Loading map">
        <Skeleton className="size-64 rounded-3xl" />
      </div>
    ),
  },
);

type CustomerMapViewProps = {
  initialCenter?: { latitude: number; longitude: number } | null;
  initialRadiusKm?: number;
};

export function CustomerMapView({
  initialCenter = null,
  initialRadiusKm = DEFAULT_RADIUS_KM,
}: CustomerMapViewProps) {
  const [filters, setFilters] = useState<BusinessFilters>({
    keyword: "",
    type: "all",
    center: initialCenter,
    radiusKm: initialRadiusKm,
  });

  const { results, total } = useBusinessSearch(filters, 24);

  const locatedCount = results.filter(
    (business) => business.location !== undefined,
  ).length;

  function updateFilters(patch: Partial<BusinessFilters>) {
    setFilters((prev) => ({ ...prev, ...patch }));
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <Link
            href="/customer"
            className="inline-flex items-center gap-1.5 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
          >
            <HugeiconsIcon icon={ArrowLeft01Icon} strokeWidth={2} className="size-4" />
            Discover
          </Link>
          <h1 className="mt-1 text-3xl font-bold tracking-tight sm:text-4xl">
            Nearby businesses
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Businesses matching your filters, plotted by their coordinates.
          </p>
        </div>

        {total !== undefined ? (
          <Badge variant="secondary" className="rounded-full">
            {total >= 1000 ? "1000+" : total}{" "}
            {total === 1 ? "match" : "matches"}
          </Badge>
        ) : null}
      </div>

      <BusinessSearchFilters filters={filters} onChange={updateFilters} />

      <div className="h-[65vh] overflow-hidden rounded-3xl border border-border bg-muted/30">
        <BusinessMap businesses={results} center={filters.center} />
      </div>

      <p className="text-sm text-muted-foreground">
        {locatedCount} of {results.length} loaded results have coordinates and
        appear on the map. Select a business to open its public page.
      </p>
    </div>
  );
}