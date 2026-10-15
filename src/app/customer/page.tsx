"use client";

import { useState } from "react";
import Link from "next/link";
import { Button, buttonVariants } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty";
import { Skeleton } from "@/components/ui/skeleton";
import { Spinner } from "@/components/ui/spinner";
import { ScanBusinessButton } from "@/components/business/scan-business-button";
import { BusinessSearchFilters } from "@/components/business/business-search-filters";
import { useBusinessSearch } from "@/hooks/use-business-search";
import { businessTypeLabel } from "@/lib/business-type";
import {
  EMPTY_FILTERS,
  type BusinessSearchFilters as BusinessFilters,
} from "@/lib/business-search";
import type { PublicBusinessRow } from "@/../convex/business/data";
import {
  ArrowRight01Icon,
  Location01Icon,
  Mail01Icon,
  Search01Icon,
} from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import { cn } from "cn";

function BusinessCard({ business }: { business: PublicBusinessRow }) {
  const initials = business.name.slice(0, 1).toUpperCase();

  return (
    <Card className="group overflow-hidden transition-all duration-200 hover:-translate-y-1 hover:shadow-xl hover:shadow-primary/5">
      <CardContent className="flex h-full flex-col gap-4 p-5">
        <div className="flex items-center gap-3">
          <Avatar size="lg" className="rounded-xl">
            {business.logoUrl ? (
              <AvatarImage
                src={business.logoUrl}
                alt={`${business.name} logo`}
                className="rounded-xl"
              />
            ) : null}
            <AvatarFallback className="rounded-xl">{initials}</AvatarFallback>
          </Avatar>

          <div className="min-w-0">
            <h2 className="truncate font-heading text-base font-semibold tracking-tight">
              <Link
                href={`/b/${business._id}`}
                className="transition-colors hover:text-primary"
              >
                {business.name}
              </Link>
            </h2>
            <Badge variant="secondary" className="mt-0.5 font-normal">
              {businessTypeLabel(business.type)}
            </Badge>
          </div>
        </div>

        <p className="line-clamp-3 flex-1 text-sm leading-6 text-muted-foreground">
          {business.description ??
            "No description yet — open the business profile to learn more."}
        </p>

        <div className="flex items-center justify-between gap-3 border-t border-border/60 pt-4">
          <div className="flex min-w-0 items-center gap-1.5 text-xs text-muted-foreground">
            <HugeiconsIcon
              icon={Mail01Icon}
              strokeWidth={2}
              className="size-3.5 shrink-0"
            />
            <span className="truncate">
              {business.contactEmail ?? "No contact email"}
            </span>
          </div>

          <Link
            href={`/b/${business._id}`}
            className={cn(
              buttonVariants({ variant: "outline", size: "sm" }),
              "group/visit shrink-0",
            )}
          >
            View business
            <HugeiconsIcon
              icon={ArrowRight01Icon}
              strokeWidth={2}
              className="size-4 transition-transform group-hover/visit:translate-x-0.5"
            />
          </Link>
        </div>
      </CardContent>
    </Card>
  );
}

function BusinessCardSkeleton() {
  return (
    <Card>
      <CardContent className="flex flex-col gap-4 p-5">
        <div className="flex items-center gap-3">
          <Skeleton className="size-10 rounded-xl" />
          <div className="flex flex-col gap-2">
            <Skeleton className="h-4 w-32" />
            <Skeleton className="h-3 w-16" />
          </div>
        </div>
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-3/4" />
        <div className="flex items-center justify-between border-t border-border/60 pt-4">
          <Skeleton className="h-3 w-24" />
          <Skeleton className="h-8 w-28" />
        </div>
      </CardContent>
    </Card>
  );
}

export default function CustomerHomePage() {
  const [filters, setFilters] = useState<BusinessFilters>(EMPTY_FILTERS);
  const { results, status, total, loadMore } = useBusinessSearch(filters);

  const firstPageLoading = status === "LoadingFirstPage";
  const loadingMore = status === "LoadingMore";
  const exhausted = status === "Exhausted";
  const showLoadMore = status === "CanLoadMore" || loadingMore;

  const hasResults = results.length > 0;

  function updateFilters(patch: Partial<BusinessFilters>) {
    setFilters((prev) => ({ ...prev, ...patch }));
  }

  const mapHref = filters.center
    ? `/customer/map?lat=${filters.center.latitude}&lng=${filters.center.longitude}&radius=${filters.radiusKm}`
    : "/customer/map";

  return (
    <div className="flex flex-col gap-8">
      <section className="pt-4 sm:pt-8">
        <div className="flex flex-col gap-3">
          <div className="flex flex-wrap items-center gap-3">
            <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">
              Discover businesses
            </h1>
            {total !== undefined && (
              <Badge variant="secondary" className="rounded-full">
                {total >= 1000 ? "1000+" : total}{" "}
                {total === 1 ? "match" : "matches"}
              </Badge>
            )}
          </div>
          <p className="max-w-2xl text-base leading-7 text-muted-foreground">
            Search by keyword or type, or locate yourself to surface businesses
            nearby. Open a business to join its queue or book an appointment.
          </p>

          <BusinessSearchFilters filters={filters} onChange={updateFilters} />

          <div className="flex flex-wrap items-center gap-3">
            <Link
              href={mapHref}
              className={cn(buttonVariants({ variant: "outline" }))}
            >
              <HugeiconsIcon
                icon={Location01Icon}
                strokeWidth={2}
                data-icon="inline-start"
              />
              View on map
            </Link>
            <ScanBusinessButton />
          </div>
        </div>
      </section>

      {firstPageLoading || (loadingMore && !hasResults) ? (
        <section aria-label="Loading businesses">
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {Array.from({ length: 6 }).map((_, index) => (
              <BusinessCardSkeleton key={index} />
            ))}
          </div>
        </section>
      ) : !hasResults ? (
        <section>
          <Empty className="border-dashed">
            <EmptyContent>
              <EmptyMedia variant="icon">
                <HugeiconsIcon icon={Search01Icon} strokeWidth={2} />
              </EmptyMedia>
              <EmptyTitle>No businesses match</EmptyTitle>
              <EmptyDescription>
                Try a different keyword or type, or widen your search radius to
                find what you are looking for.
              </EmptyDescription>
              {filters.center ? (
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => updateFilters({ center: null })}
                >
                  Clear location filter
                </Button>
              ) : null}
              {filters.keyword !== "" || filters.type !== "all" ? (
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => updateFilters({ keyword: "", type: "all" })}
                >
                  Clear search
                </Button>
              ) : null}
            </EmptyContent>
          </Empty>
        </section>
      ) : (
        <section aria-label="Businesses">
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {results.map((business) => (
              <BusinessCard key={business._id} business={business} />
            ))}
          </div>

          <div className="mt-8 flex flex-col items-center gap-2">
            {showLoadMore ? (
              <Button
                type="button"
                variant="outline"
                onClick={() => loadMore(8)}
                disabled={loadingMore}
              >
                {loadingMore ? <Spinner data-icon="inline-start" /> : null}
                {loadingMore ? "Loading…" : "Load more businesses"}
              </Button>
            ) : exhausted && total !== undefined ? (
              <p className="text-sm text-muted-foreground">
                Showing all {total >= 1000 ? "1000+ of " : total} matching{" "}
                {total === 1 ? "business" : "businesses"}.
              </p>
            ) : null}
          </div>
        </section>
      )}
    </div>
  );
}
