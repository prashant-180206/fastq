"use client";

import { useQuery } from "convex/react";
import { Search, SlidersHorizontal, X } from "lucide-react";
import { useState } from "react";

// import { api } from "@/../convex/_generated/api";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { api } from "@/convex/_generated/api";
import { BusinessCard } from "@/components/discover/BusinessCard";

// import { BusinessCard } from "./business-card";

export function DiscoverPage() {
  const [search, setSearch] = useState("");
  const [type, setType] = useState("");
  const [city, setCity] = useState("");

  const businesses = useQuery(api.businesses.listPublic, {
    search: search.trim() || undefined,
    type: type || undefined,
    city: city.trim() || undefined,
  });

  const isLoading = businesses === undefined;

  return (
    <main className="min-h-screen">
      {/* Header */}
      <section className="border-b">
        <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
          <div className="max-w-3xl">
            <p className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">
              Discover
            </p>

            <h1 className="mt-3 text-4xl font-bold tracking-tight sm:text-5xl">
              Find a place without the wait.
            </h1>

            <p className="mt-4 max-w-2xl text-lg leading-8 text-muted-foreground">
              Discover businesses, check their availability, join a queue, or
              book an appointment before you arrive.
            </p>
          </div>

          {/* Search */}
          <div className="mt-8 max-w-4xl">
            <div className="flex flex-col gap-3 sm:flex-row">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />

                <Input
                  value={search}
                  onChange={(event) => setSearch(event.target.value)}
                  placeholder="Search businesses, services, or locations..."
                  className="h-11 pl-9 pr-9"
                />

                {search && (
                  <button
                    type="button"
                    onClick={() => setSearch("")}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground transition-colors hover:text-foreground"
                    aria-label="Clear search"
                  >
                    <X className="size-4" />
                  </button>
                )}
              </div>

              <Button
                type="button"
                variant="outline"
                className="h-11"
                onClick={() => {
                  setType("");
                  setCity("");
                }}
              >
                <SlidersHorizontal className="mr-2 size-4" />
                Clear filters
              </Button>
            </div>

            {/* Filters */}
            <div className="mt-3 flex flex-col gap-3 sm:flex-row">
              <Input
                value={city}
                onChange={(event) => setCity(event.target.value)}
                placeholder="City"
                className="sm:max-w-xs"
              />

              <Input
                value={type}
                onChange={(event) => setType(event.target.value)}
                placeholder="Business type"
                className="sm:max-w-xs"
              />
            </div>
          </div>
        </div>
      </section>

      {/* Results */}
      <section className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
        <div className="mb-6">
          <h2 className="text-lg font-semibold">
            {search || type || city ? "Search results" : "Businesses"}
          </h2>

          <p className="mt-1 text-sm text-muted-foreground">
            {isLoading
              ? "Finding businesses..."
              : `${businesses.length} ${
                  businesses.length === 1 ? "business" : "businesses"
                }`}
          </p>
        </div>

        {isLoading ? (
          <BusinessGridSkeleton />
        ) : businesses.length === 0 ? (
          <EmptyState
            hasFilters={Boolean(search || type || city)}
            onClear={() => {
              setSearch("");
              setType("");
              setCity("");
            }}
          />
        ) : (
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {businesses.map((business) => (
              <BusinessCard key={business._id} business={business} />
            ))}
          </div>
        )}
      </section>
    </main>
  );
}

export default DiscoverPage;

function BusinessGridSkeleton() {
  return (
    <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
      {Array.from({ length: 6 }).map((_, index) => (
        <div key={index} className="overflow-hidden rounded-xl border">
          <div className="aspect-2/1 animate-pulse bg-muted" />

          <div className="space-y-4 p-5">
            <div className="h-5 w-2/3 animate-pulse rounded bg-muted" />

            <div className="h-4 w-1/3 animate-pulse rounded bg-muted" />

            <div className="h-10 animate-pulse rounded bg-muted" />

            <div className="h-10 animate-pulse rounded bg-muted" />
          </div>
        </div>
      ))}
    </div>
  );
}

function EmptyState({
  hasFilters,
  onClear,
}: {
  hasFilters: boolean;
  onClear: () => void;
}) {
  return (
    <div className="rounded-2xl border border-dashed px-6 py-20 text-center">
      <div className="mx-auto flex size-12 items-center justify-center rounded-full bg-muted">
        <Search className="size-5 text-muted-foreground" />
      </div>

      <h3 className="mt-4 font-semibold">
        {hasFilters ? "No businesses found" : "No businesses available yet"}
      </h3>

      <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-muted-foreground">
        {hasFilters
          ? "Try changing your search or filters and we'll look again."
          : "Businesses will appear here once they become available on Quiskip."}
      </p>

      {hasFilters && (
        <Button variant="outline" className="mt-5" onClick={onClear}>
          Clear filters
        </Button>
      )}
    </div>
  );
}
