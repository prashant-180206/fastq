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
import { useNow } from "@/hooks/use-now";
import {
  ArrowRight01Icon,
  Calendar02Icon,
  Clock01Icon,
} from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import { cn } from "cn";

const activeQueueStatuses = ["waiting", "called", "checked_in", "serving"];

function titleCase(value: string) {
  return value.replaceAll("_", " ").replace(/\b\w/g, (c) => c.toUpperCase());
}

function statusVariant(status: string): "default" | "secondary" | "outline" {
  if (["called", "serving", "checked_in"].includes(status)) {
    return "secondary";
  }
  if (["waiting", "booked", "completed"].includes(status)) {
    return "default";
  }
  return "outline";
}

export default function CustomerDashboardPage() {
  const now = useNow();
  const tokens = useQuery(api.business.queueCapacity.getMyTokens, {});
  const appointments = useQuery(
    api.business.appointments.getMyAppointments,
    {},
  );
  const businesses = useQuery(api.business.data.getAll, {});

  const businessName = (businessId: Id<"businesses">) =>
    businesses?.find((business) => business._id === businessId)?.name ??
    "Business";

  if (tokens === undefined || appointments === undefined) {
    return (
      <div className="flex flex-col gap-6">
        <div className="space-y-2">
          <Skeleton className="h-9 w-64" />
          <Skeleton className="h-4 w-full max-w-md" />
        </div>
        <div className="grid gap-3 sm:grid-cols-2">
          <Skeleton className="h-32 rounded-3xl" />
          <Skeleton className="h-32 rounded-3xl" />
        </div>
        <Skeleton className="h-9 w-56" />
        <Skeleton className="h-40 rounded-3xl" />
      </div>
    );
  }

  const activeTokens = tokens.filter((token) =>
    activeQueueStatuses.includes(token.status),
  );

  const upcomingAppointments = appointments
    .filter(
      (appointment) =>
        ["booked", "checked_in"].includes(appointment.status) &&
        appointment.scheduledStart >= now,
    )
    .sort((a, b) => a.scheduledStart - b.scheduledStart);

  const recentTokens = [...tokens]
    .sort((a, b) => b.joinedAt - a.joinedAt)
    .slice(0, 5);

  const recentAppointments = [...appointments]
    .sort((a, b) => b.createdAt - a.createdAt)
    .slice(0, 5);

  return (
    <div className="flex flex-col gap-8">
      <div>
        <p className="text-xs font-semibold tracking-wide text-muted-foreground uppercase">
          QuiLess customer account
        </p>
        <h1 className="mt-1 font-heading text-3xl font-bold tracking-tight">
          Your dashboard
        </h1>
        <p className="mt-1 text-muted-foreground">
          Manage your queues and appointments in one place.
        </p>
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        <Card>
          <CardContent className="grid gap-1.5">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <HugeiconsIcon icon={Clock01Icon} strokeWidth={2} data-icon="inline-start" />
              Active queue tokens
            </div>
            <p className="font-heading text-3xl font-bold tracking-tight">
              {activeTokens.length}
            </p>
            <Link
              href="/customer/queue"
              className={cn(
                buttonVariants({ variant: "outline", size: "sm" }),
                "mt-2 w-fit",
              )}
            >
              View queue activity
              <HugeiconsIcon
                icon={ArrowRight01Icon}
                strokeWidth={2}
                data-icon="inline-end"
              />
            </Link>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="grid gap-1.5">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <HugeiconsIcon icon={Calendar02Icon} strokeWidth={2} data-icon="inline-start" />
              Upcoming appointments
            </div>
            <p className="font-heading text-3xl font-bold tracking-tight">
              {upcomingAppointments.length}
            </p>
            <Link
              href="/customer/appointments"
              className={cn(
                buttonVariants({ variant: "outline", size: "sm" }),
                "mt-2 w-fit",
              )}
            >
              View appointments
              <HugeiconsIcon
                icon={ArrowRight01Icon}
                strokeWidth={2}
                data-icon="inline-end"
              />
            </Link>
          </CardContent>
        </Card>
      </div>

      <section className="flex flex-col gap-3">
        <div className="flex items-center justify-between gap-4">
          <h2 className="font-heading text-xl font-bold tracking-tight">
            Active queues
          </h2>
          <Link
            href="/customer/queue"
            className="text-sm font-medium text-primary underline-offset-4 hover:underline"
          >
            All queue tokens
          </Link>
        </div>

        {activeTokens.length === 0 ? (
          <Empty className="border-dashed">
            <EmptyContent>
              <EmptyMedia variant="icon">
                <HugeiconsIcon icon={Clock01Icon} strokeWidth={2} />
              </EmptyMedia>
              <EmptyTitle>No active queue tokens</EmptyTitle>
              <EmptyDescription>
                Join a queue at any business to track your token here.
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
            {activeTokens.map((token) => (
              <Link href={`/customer/queue/${token._id}`} key={token._id}>
                <Card size="sm" className="transition-colors hover:bg-muted/40">
                  <CardContent className="flex flex-wrap items-center justify-between gap-3">
                    <div className="min-w-0">
                      <p className="font-semibold">
                        {businessName(token.businessId)} — Token #
                        {token.tokenNumber}
                      </p>
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
        <div className="flex items-center justify-between gap-4">
          <h2 className="font-heading text-xl font-bold tracking-tight">
            Upcoming appointments
          </h2>
          <Link
            href="/customer/appointments"
            className="text-sm font-medium text-primary underline-offset-4 hover:underline"
          >
            All appointments
          </Link>
        </div>

        {upcomingAppointments.length === 0 ? (
          <Empty className="border-dashed">
            <EmptyContent>
              <EmptyMedia variant="icon">
                <HugeiconsIcon icon={Calendar02Icon} strokeWidth={2} />
              </EmptyMedia>
              <EmptyTitle>No upcoming appointments</EmptyTitle>
              <EmptyDescription>
                Book a visit with any business to see it here.
              </EmptyDescription>
            </EmptyContent>
            <Link
              href="/customer"
              className={cn(buttonVariants({ size: "sm" }))}
            >
              Find a business
            </Link>
          </Empty>
        ) : (
          <div className="flex flex-col gap-3">
            {upcomingAppointments.slice(0, 5).map((appointment) => (
              <Link
                href={`/customer/appointments/${appointment._id}`}
                key={appointment._id}
              >
                <Card size="sm" className="transition-colors hover:bg-muted/40">
                  <CardContent className="flex flex-wrap items-center justify-between gap-3">
                    <div className="min-w-0">
                      <p className="font-semibold">
                        {businessName(appointment.businessId)}
                      </p>
                      <p className="mt-1 text-sm text-muted-foreground">
                        {formatDateTimeIST(appointment.scheduledStart)}
                      </p>
                    </div>
                    <Badge
                      variant={statusVariant(appointment.status)}
                      className="h-5 rounded-full capitalize"
                    >
                      {titleCase(appointment.status)}
                    </Badge>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        )}
      </section>

      <section className="grid gap-6 md:grid-cols-2">
        <div className="flex flex-col gap-3">
          <h2 className="font-heading text-lg font-bold tracking-tight">
            Recent queue activity
          </h2>
          {recentTokens.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              No queue history yet. Find a business and join a queue.
            </p>
          ) : (
            <div className="flex flex-col gap-2">
              {recentTokens.map((token) => (
                <Link
                  key={token._id}
                  href={`/customer/queue/${token._id}`}
                  className="rounded-2xl border p-3 transition-colors hover:bg-muted/40"
                >
                  <div className="flex justify-between gap-3 text-sm">
                    <span className="font-medium">
                      {businessName(token.businessId)} — #{token.tokenNumber}
                    </span>
                    <span className="text-muted-foreground">
                      {titleCase(token.status)}
                    </span>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>

        <div className="flex flex-col gap-3">
          <h2 className="font-heading text-lg font-bold tracking-tight">
            Recent appointments
          </h2>
          {recentAppointments.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              No appointment history yet. Book a visit with a business.
            </p>
          ) : (
            <div className="flex flex-col gap-2">
              {recentAppointments.map((appointment) => (
                <Link
                  key={appointment._id}
                  href={`/customer/appointments/${appointment._id}`}
                  className="rounded-2xl border p-3 transition-colors hover:bg-muted/40"
                >
                  <div className="flex justify-between gap-3 text-sm">
                    <span className="font-medium">
                      {businessName(appointment.businessId)}
                    </span>
                    <span className="text-muted-foreground">
                      {titleCase(appointment.status)}
                    </span>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>
      </section>
    </div>
  );
}