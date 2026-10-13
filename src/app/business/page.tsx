"use client";

import Link from "next/link";
import { usePaginatedQuery } from "convex/react";
import { api } from "@/../convex/_generated/api";
import { AppHeader } from "@/components/layout/app-header";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button, buttonVariants } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
} from "@/components/ui/card";
import {
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty";
import { Skeleton } from "@/components/ui/skeleton";
import { Spinner } from "@/components/ui/spinner";
import {
  ArrowUpRight01Icon,
  Building01Icon,
  PlusIcon,
} from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import { cn } from "cn";

function statusVariant(status: string): "default" | "secondary" | "outline" {
  if (status === "active") {
    return "default";
  }
  if (status === "suspended") {
    return "secondary";
  }
  return "outline";
}

export default function BusinessesPage() {
  const { results, status, loadMore } = usePaginatedQuery(
    api.business.data.getMinePaginated,
    {},
    { initialNumItems: 6 },
  );

  const firstPageLoading = status === "LoadingFirstPage";
  const loadingMore = status === "LoadingMore";
  const showLoadMore = status === "CanLoadMore" || loadingMore;

  return (
    <>
      <AppHeader />

      <main className="mx-auto max-w-5xl px-4 py-8 sm:px-6">
        <div className="flex items-center justify-between gap-4">
          <div>
            <h1 className="font-heading text-3xl font-bold tracking-tight">
              Businesses
            </h1>
            <p className="mt-1 text-muted-foreground">
              Manage your businesses and working hours.
            </p>
          </div>

          <Link
            href="/business/new"
            className={cn(buttonVariants())}
          >
            <HugeiconsIcon icon={PlusIcon} strokeWidth={2} data-icon="inline-start" />
            Create business
          </Link>
        </div>

        {firstPageLoading && results.length === 0 ? (
          <div className="mt-8 grid gap-4 sm:grid-cols-2">
            {Array.from({ length: 4 }).map((_, index) => (
              <Card key={index}>
                <CardContent className="flex items-center gap-4 p-5">
                  <Skeleton className="size-10 rounded-xl" />
                  <div className="min-w-0 flex-1 space-y-2">
                    <Skeleton className="h-4 w-3/4" />
                    <Skeleton className="h-3 w-full" />
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : results.length === 0 ? (
          <div className="mt-8">
            <Empty>
              <EmptyContent>
                <EmptyMedia variant="icon">
                  <HugeiconsIcon icon={Building01Icon} strokeWidth={2} />
                </EmptyMedia>
                <EmptyTitle>No businesses yet</EmptyTitle>
                <EmptyDescription>
                  Create your first business to start managing queues and
                  appointment bookings.
                </EmptyDescription>
              </EmptyContent>

              <div className="flex justify-center">
                <Link
                  href="/business/new"
                  className={cn(buttonVariants())}
                >
                  <HugeiconsIcon icon={PlusIcon} strokeWidth={2} data-icon="inline-start" />
                  Create a business
                </Link>
              </div>
            </Empty>
          </div>
        ) : (
          <>
            <div className="mt-8 grid gap-4 sm:grid-cols-2">
              {results.map((business) => {
                const initials = (business.name ?? "?")
                  .split(" ")
                  .filter(Boolean)
                  .slice(0, 2)
                  .map((part) => part[0])
                  .join("")
                  .toUpperCase();

                return (
                  <Link
                    key={business._id}
                    href={`/business/${business._id}`}
                    className="group"
                  >
                    <Card className="h-full transition-colors group-hover:border-ring group-hover:bg-accent/40">
                      <CardContent className="flex items-start gap-4 p-5">
                        <Avatar className="size-10 shrink-0 rounded-xl">
                          <AvatarFallback className="rounded-xl text-sm">
                            {initials}
                          </AvatarFallback>
                        </Avatar>

                        <div className="min-w-0 flex-1">
                          <div className="flex items-center justify-between gap-2">
                            <h2 className="truncate font-medium">{business.name}</h2>
                            <Badge
                              variant={statusVariant(business.status)}
                              className="h-5 rounded-full capitalize"
                            >
                              {business.status}
                            </Badge>
                          </div>
                          <CardDescription className="mt-1 line-clamp-2">
                            {business.description || "No description added."}
                          </CardDescription>
                        </div>

                        <HugeiconsIcon
                          icon={ArrowUpRight01Icon}
                          strokeWidth={2}
                          className="mt-0.5 size-4 shrink-0 text-muted-foreground transition-colors group-hover:text-foreground"
                        />
                      </CardContent>
                    </Card>
                  </Link>
                );
              })}
            </div>

            {showLoadMore ? (
              <div className="mt-8 flex justify-center">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => loadMore(6)}
                  disabled={loadingMore}
                >
                  {loadingMore ? (
                    <Spinner data-icon="inline-start" />
                  ) : null}
                  {loadingMore ? "Loading…" : "Load more"}
                </Button>
              </div>
            ) : null}
          </>
        )}
      </main>
    </>
  );
}