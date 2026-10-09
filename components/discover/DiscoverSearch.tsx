"use client";

import { Search, SlidersHorizontal, X } from "lucide-react";
import { useState } from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

type Props = {
  value: string;
  onChange: (value: string) => void;
};

export function DiscoverSearch({ value, onChange }: Props) {
  const [filtersOpen, setFiltersOpen] = useState(false);

  return (
    <div className="space-y-3">
      <div className="flex gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />

          <Input
            value={value}
            onChange={(event) => onChange(event.target.value)}
            placeholder="Search businesses or services..."
            className="h-11 pl-9 pr-9"
          />

          {value && (
            <button
              type="button"
              onClick={() => onChange("")}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
              aria-label="Clear search"
            >
              <X className="size-4" />
            </button>
          )}
        </div>

        <Button
          variant="outline"
          size="icon"
          className="size-11 shrink-0"
          onClick={() => setFiltersOpen((open) => !open)}
          aria-label="Toggle filters"
        >
          <SlidersHorizontal className="size-4" />
        </Button>
      </div>

      {filtersOpen && (
        <div className="rounded-xl border bg-card p-4">
          <p className="text-sm font-medium">Filters</p>

          <div className="mt-3 flex flex-wrap gap-2">
            <Button variant="outline" size="sm">
              Open now
            </Button>

            <Button variant="outline" size="sm">
              Has queue
            </Button>

            <Button variant="outline" size="sm">
              Appointments
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
