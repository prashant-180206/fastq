"use client";

import Link from "next/link";
import { useQuery } from "convex/react";
import { api } from "@/../convex/_generated/api";
import type { Id } from "@/../convex/_generated/dataModel";
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
import { Skeleton } from "@/components/ui/skeleton";
import { formatDateTimeIST } from "@/lib/format";
import { Clock01Icon, Queue02Icon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import { cn } from "cn";

const activeStatuses = ["waiting", "called", "checked_in", "serving"];

function titleCase(value: string) {
  return value.replaceAll("_", " ").replace(/\b\w/g, (c) => c.toUpperCase());
}

function statusVariant(status: string): "default" | "secondary" | "outline" {
  if (["called", "serving", "checked_in"].includes(status)) {
    return "secondary";
  }
  if (["waiting"].includes(status)) {
    return "default";
  }
  return "outline";
}

export default function CustomerQueuePage() {
  const tokens = useQuery(api.business.queueCapacity.getMyTokens, {});
  const businesses = useQuery(api.business.data.getAll, {});

  const businessName = (businessId: Id<"businesses">) =>
    businesses?.find((business) => business._id === businessId)?.name ??
    "Business";

  if (tokens === undefined) {
    return (
      <div className="flex flex-col gap-6">
        <div className="space-y-2">
          <Skeleton className="h-9 w-64" />
          <Skeleton className="h-4 w-full max-w-md" />
        </div>
        <Skeleton className="h-9 w-48" />
        <Skeleton className="h-24 rounded-3xl" />
        <Skeleton className="h-9 w-40" />
        <Skeleton className="h-24 rounded-3xl" />
      </div>
    );
  }

  const active = tokens.filter((token) =>
    activeStatuses.includes(token.status),
  );
  const history = tokens.filter(
    (token) => !activeStatuses.includes(token.status),
  );

  return (
    <div className="flex flex-col gap-8">
      <div>
        <h1 className="font-heading text-3xl font-bold tracking-tight">
          My queue tokens
        </h1>
        <p className="mt-1 text-muted-foreground">
          Track active tokens and review your previous queue visits.
        </p>
      </div>

      <section className="flex flex-col gap-3">
        <h2 className="font-heading text-xl font-bold tracking-tight">
          Active
          <Badge variant="secondary" className="ml-2 rounded-full">
            {active.length}
          </Badge>
        </h2>

        {active.length === 0 ? (
          <Empty className="border-dashed">
            <EmptyContent>
              <EmptyMedia variant="icon">
                <HugeiconsIcon icon={Queue02Icon} strokeWidth={2} />
              </EmptyMedia>
              <EmptyTitle>No active queue tokens</EmptyTitle>
              <EmptyDescription>
                Join a queue at any business to track your place here.
              </EmptyDescription>
            </EmptyContent>
            <Link
              href="/customer"
              className={cn(buttonVariants({ size: "sm" }))}
            >
              Discover businesses
            </Link>
          </Empty>
        ) : (
          <div className="flex flex-col gap-3">
            {active.map((token) => (
              <Link href={`/customer/queue/${token._id}`} key={token._id}>
                <Card size="sm" className="transition-colors hover:bg-muted/40">
                  <CardContent className="flex flex-wrap items-center justify-between gap-3">
                    <div className="min-w-0">
                      <h3 className="font-semibold">
                        {businessName(token.businessId)} — Token #
                        {token.tokenNumber}
                      </h3>
                      <p className="mt-1 text-sm text-muted-foreground">
                        Joined {formatDateTimeIST(token.joinedAt)}
                      </p>
                    </div>
                    <Badge
                      variant={statusVariant(token.status)}
                      className="h-5 rounded-full capitalize"
                    >
                      {titleCase(token.status)}
                    </Badge>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        )}
      </section>

      <section className="flex flex-col gap-3">
        <h2 className="font-heading text-xl font-bold tracking-tight">
          History
          <Badge variant="secondary" className="ml-2 rounded-full">
            {history.length}
          </Badge>
        </h2>

        {history.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            Your queue history will appear here.
          </p>
        ) : (
          <div className="flex flex-col gap-2">
            {history.map((token) => (
              <Link
                key={token._id}
                href={`/customer/queue/${token._id}`}
                className="rounded-2xl border p-4 transition-colors hover:bg-muted/40"
              >
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div className="min-w-0">
                    <p className="font-semibold">
                      {businessName(token.businessId)} — Token #{token.tokenNumber}
                    </p>
                    <p className="mt-1 text-sm text-muted-foreground">
                      <HugeiconsIcon
                        icon={Clock01Icon}
                        strokeWidth={2}
                        data-icon="inline-start"
                      />
                      Joined {formatDateTimeIST(token.joinedAt)}
                    </p>
                  </div>
                  <span className="text-sm text-muted-foreground">
                    {titleCase(token.status)}
                  </span>
                </div>
              </Link>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}