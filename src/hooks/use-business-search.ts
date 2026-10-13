"use client";

import { usePaginatedQuery, useQuery } from "convex/react";
import { api } from "@/../convex/_generated/api";
import type { BusinessSearchFilters } from "@/lib/business-search";

export function useBusinessSearch(
  filters: BusinessSearchFilters,
  initialNumItems = 8,
) {
  const args = {
    keyword: filters.keyword.trim() || undefined,
    type: filters.type === "all" ? undefined : filters.type,
    center: filters.center ?? undefined,
    radiusKm: filters.center ? filters.radiusKm : undefined,
  };

  const { results, status, isLoading, loadMore } = usePaginatedQuery(
    api.business.data.search,
    args,
    { initialNumItems },
  );

  const total = useQuery(api.business.data.searchCount, args);

  return { results, status, isLoading, loadMore, total };
}