"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useQuery } from "convex/react";
import { api } from "@/../convex/_generated/api";
import { AppHeader } from "@/components/layout/app-header";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import type { FunctionReturnType } from "convex/server";
import {
  ArrowRight01Icon,
  Mail01Icon,
  Search01Icon,
  Store01Icon,
} from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import { cn } from "cn";

type Business = FunctionReturnType<typeof api.business.data.getAll>[number];

function BusinessCard({ business }: { business: Business }) {
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
              Business
            </Badge>
          </div>
        </div>

        <p className="line-clamp-3 flex-1 text-sm leading-6 text-muted-foreground">
          {business.description ??
            "No description yet — open the business profile to learn more."}
        </p>

        <div className="flex items-center justify-between gap-3 border-t border-border/60 pt-4">
          <div className="flex min-w-0 items-center gap-1.5 text-xs text-muted-foreground">
            <HugeiconsIcon icon={Mail01Icon} strokeWidth={2} className="size-3.5 shrink-0" />
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

export default function DiscoverPage() {
  const businesses = useQuery(api.business.data.getAll, {});
  const [query, setQuery] = useState("");

  const filtered = useMemo(() => {
    if (businesses === undefined) {
      return undefined;
    }

    const q = query.trim().toLowerCase();

    if (!q) {
      return businesses;
    }

    return businesses.filter((business) =>
      [business.name, business.description, business.contactEmail]
        .filter(Boolean)
        .some((field) => field!.toLowerCase().includes(q)),
    );
  }, [businesses, query]);

  const hasBusinesses = businesses !== undefined && businesses.length > 0;

  return (
    <div className="min-h-dvh bg-background text-foreground">
      <AppHeader />

      <main className="mx-auto max-w-6xl px-4 pb-20 sm:px-6">
        <section className="pt-12 sm:pt-16">
          <div className="flex flex-col gap-3">
            <div className="flex flex-wrap items-center gap-3">
              <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">
                Discover businesses
              </h1>
              {businesses !== undefined && (
                <Badge variant="secondary" className="rounded-full">
                  {businesses.length}{" "}
                  {businesses.length === 1 ? "business" : "businesses"}
                </Badge>
              )}
            </div>
            <p className="max-w-2xl text-base leading-7 text-muted-foreground">
              Find businesses around you, check what they offer, and join
              their queue or book an appointment in a few taps.
            </p>

            <div className="relative mt-2 max-w-md">
              <HugeiconsIcon
                icon={Search01Icon}
                strokeWidth={2}
                className="pointer-events-none absolute top-1/2 left-3.5 size-4 -translate-y-1/2 text-muted-foreground"
              />
              <Input
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="Search businesses, services…"
                aria-label="Search businesses"
                className="pl-10"
              />
            </div>
          </div>
        </section>

        {filtered === undefined ? (
          <section aria-label="Loading businesses" className="pt-10">
            <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {Array.from({ length: 6 }).map((_, index) => (
                <BusinessCardSkeleton key={index} />
              ))}
            </div>
          </section>
        ) : filtered.length === 0 ? (
          <section className="pt-10">
            <Empty>
              <EmptyContent>
                <EmptyMedia variant="icon">
                  <HugeiconsIcon
                    icon={hasBusinesses ? Search01Icon : Store01Icon}
                    strokeWidth={2}
                  />
                </EmptyMedia>
                <EmptyTitle>
                  {hasBusinesses
                    ? "No businesses match your search"
                    : "No businesses yet"}
                </EmptyTitle>
                <EmptyDescription>
                  {hasBusinesses
                    ? "Try a different name or keyword to find what you are looking for."
                    : "Be the first to list your business and let customers discover you on QuiLess."}
                </EmptyDescription>
                <div className="flex flex-wrap items-center justify-center gap-3">
                  {hasBusinesses ? (
                    <button
                      type="button"
                      onClick={() => setQuery("")}
                      className={cn(buttonVariants({ variant: "outline" }))}
                    >
                      Clear search
                    </button>
                  ) : (
                    <Link
                      href="/business/new"
                      className={cn(buttonVariants())}
                    >
                      Add your business
                    </Link>
                  )}
                </div>
              </EmptyContent>
            </Empty>
          </section>
        ) : (
          <section aria-label="Businesses" className="pt-10">
            <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {filtered.map((business) => (
                <BusinessCard key={business._id} business={business} />
              ))}
            </div>
          </section>
        )}
      </main>
    </div>
  );
}