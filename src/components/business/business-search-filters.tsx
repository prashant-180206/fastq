"use client";

import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Spinner } from "@/components/ui/spinner";
import { BUSINESS_TYPES } from "@/lib/business-type";
import { getCurrentPosition } from "@/lib/browser-location";
import {
  DEFAULT_RADIUS_KM,
  RADIUS_OPTIONS,
  type BusinessSearchFilters,
} from "@/lib/business-search";
import { notifyError, notifySuccess } from "@/lib/toast";
import { useDebouncedCallback } from "use-debounce";
import {
  Cancel01Icon,
  Gps01Icon,
  Location01Icon,
  Search01Icon,
} from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";

type BusinessSearchFiltersProps = {
  filters: BusinessSearchFilters;
  onChange: (patch: Partial<BusinessSearchFilters>) => void;
};

const SEARCH_DEBOUNCE_MS = 450;

export function BusinessSearchFilters({
  filters,
  onChange,
}: BusinessSearchFiltersProps) {
  const [keyword, setKeyword] = useState(filters.keyword);
  const [locating, setLocating] = useState(false);

  // Track the last value pushed down; when the parent resets the keyword
  // (e.g. "Clear search"), mirror it into the local input state.
  const [prevKeyword, setPrevKeyword] = useState(filters.keyword);
  if (filters.keyword !== prevKeyword) {
    setPrevKeyword(filters.keyword);
    setKeyword(filters.keyword);
  }

  const debouncedSetKeyword = useDebouncedCallback(
    (value: string) => onChange({ keyword: value }),
    SEARCH_DEBOUNCE_MS,
  );

  async function handleUseMyLocation() {
    setLocating(true);

    try {
      const { latitude, longitude } = await getCurrentPosition();
      onChange({ center: { latitude, longitude } });
      notifySuccess(
        "Using your location",
        `Showing businesses within ${filters.radiusKm} km.`,
      );
    } catch (err) {
      notifyError(
        "Could not get your location",
        err instanceof Error ? err.message : "Try again.",
      );
    } finally {
      setLocating(false);
    }
  }

  return (
    <div className="flex flex-wrap items-center gap-3">
      <div className="relative max-w-md flex-1">
        <HugeiconsIcon
          icon={Search01Icon}
          strokeWidth={2}
          className="pointer-events-none absolute top-1/2 left-3.5 size-4 -translate-y-1/2 text-muted-foreground"
        />
        <Input
          value={keyword}
          onChange={(event) => {
            setKeyword(event.target.value);
            debouncedSetKeyword(event.target.value);
          }}
          placeholder="Search by name, service, keyword…"
          aria-label="Search businesses"
          className="pl-10"
        />
      </div>

      <Select
        value={filters.type}
        onValueChange={(value) =>
          onChange({ type: (value as BusinessSearchFilters["type"]) ?? "all" })
        }
      >
        <SelectTrigger aria-label="Filter by business type" className="w-48">
          <SelectValue placeholder="All types" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">All types</SelectItem>
          {BUSINESS_TYPES.map((entry) => (
            <SelectItem key={entry.value} value={entry.value}>
              {entry.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      {filters.center ? (
        <div className="flex flex-wrap items-center gap-2">
          <span className="inline-flex items-center gap-1.5 rounded-full border border-primary/20 bg-primary/10 px-3 py-1.5 text-xs font-medium text-primary">
            <HugeiconsIcon
              icon={Location01Icon}
              strokeWidth={2}
              className="size-3.5"
            />
            {filters.center.latitude.toFixed(3)},{" "}
            {filters.center.longitude.toFixed(3)}
          </span>

          <Select
            value={String(filters.radiusKm)}
            onValueChange={(value) =>
              onChange({ radiusKm: Number(value ?? DEFAULT_RADIUS_KM) })
            }
          >
            <SelectTrigger aria-label="Search radius" className="w-32">
              <SelectValue>{`${filters.radiusKm} km`}</SelectValue>
            </SelectTrigger>
            <SelectContent>
              {RADIUS_OPTIONS.map((radius) => (
                <SelectItem key={radius} value={String(radius)}>
                  {`${radius} km`}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => onChange({ center: null, radiusKm: DEFAULT_RADIUS_KM })}
          >
            <HugeiconsIcon
              icon={Cancel01Icon}
              strokeWidth={2}
              data-icon="inline-start"
            />
            Clear
          </Button>
        </div>
      ) : (
        <Button
          type="button"
          variant="outline"
          onClick={handleUseMyLocation}
          disabled={locating}
        >
          {locating ? (
            <Spinner data-icon="inline-start" />
          ) : (
            <HugeiconsIcon icon={Gps01Icon} strokeWidth={2} data-icon="inline-start" />
          )}
          {locating ? "Getting location…" : "Nearby businesses"}
        </Button>
      )}
    </div>
  );
}