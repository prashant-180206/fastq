"use client";

import Link from "next/link";
import { use } from "react";
import { useQuery } from "convex/react";
import { api } from "@/../convex/_generated/api";
import type { Id } from "@/../convex/_generated/dataModel";
import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty";
import { Skeleton } from "@/components/ui/skeleton";
import {
  ArrowUpRight01Icon,
  Building01Icon,
  Clock01Icon,
  Mail01Icon,
  PhoneIcon,
  PlusIcon,
  Ticket01Icon,
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

function StatCard({
  icon,
  label,
  children,
  action,
}: {
  icon: typeof Clock01Icon;
  label: string;
  children: React.ReactNode;
  action?: React.ReactNode;
}) {
  return (
    <Card>
      <CardContent className="p-5">
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <HugeiconsIcon icon={icon} strokeWidth={2} className="size-4" />
          {label}
        </div>
        <div className="mt-2 text-foreground">{children}</div>
        {action ? <div className="mt-3">{action}</div> : null}
      </CardContent>
    </Card>
  );
}

export default function BusinessDetailPage({
  params,
}: {
  params: Promise<{ businessId: string }>;
}) {
  const { businessId } = use(params);
  const id = businessId as Id<"businesses">;

  const business = useQuery(api.business.data.getById, {
    businessId: id,
  });
  const queues = useQuery(api.business.queue.getByBusiness, {
    businessId: id,
  });
  const services = useQuery(api.business.services.getByBusiness, {
    businessId: id,
  });

  if (business === undefined) {
    return (
      <div className="flex flex-col gap-8">
        <div className="space-y-2">
          <Skeleton className="h-9 w-64" />
          <Skeleton className="h-4 w-full max-w-md" />
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          {Array.from({ length: 4 }).map((_, index) => (
            <Skeleton key={index} className="h-32 rounded-3xl" />
          ))}
        </div>
        <Skeleton className="h-44 rounded-3xl" />
        <Skeleton className="h-44 rounded-3xl" />
      </div>
    );
  }

  if (business === null) {
    return (
      <Empty>
        <EmptyContent>
          <EmptyMedia variant="icon">
            <HugeiconsIcon icon={Building01Icon} strokeWidth={2} />
          </EmptyMedia>
          <EmptyTitle>Business not found</EmptyTitle>
          <EmptyDescription>
            This business does not exist or you do not have access to it.
          </EmptyDescription>
        </EmptyContent>
      </Empty>
    );
  }

  const configuredDays = business.businessHours?.filter(
    (day) => day.isOpen,
  ).length;

  return (
    <div className="flex flex-col gap-8">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="min-w-0">
          <h1 className="font-heading text-3xl font-bold tracking-tight">
            {business.name}
          </h1>
          <p className="mt-1 max-w-2xl text-muted-foreground">
            {business.description || "No description added."}
          </p>
        </div>

        <Link
          href={`/b/${business._id}`}
          className={cn(buttonVariants({ variant: "outline", size: "sm" }))}
        >
          View public page
          <HugeiconsIcon
            icon={ArrowUpRight01Icon}
            strokeWidth={2}
            data-icon="inline-end"
          />
        </Link>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <StatCard icon={Building01Icon} label="Status">
          <Badge
            variant={statusVariant(business.status)}
            className="rounded-full capitalize"
          >
            {business.status}
          </Badge>
        </StatCard>

        <StatCard icon={Clock01Icon} label="Working hours">
          <span className="font-medium">
            {business.businessHours
              ? `${configuredDays} open days configured`
              : "Not configured"}
          </span>
          <div className="mt-3">
            <Link
              href={`/business/${business._id}/working-hours`}
              className="text-sm font-medium text-primary hover:underline"
            >
              Configure working hours
            </Link>
          </div>
        </StatCard>

        <StatCard icon={Mail01Icon} label="Contact email">
          <span className="break-all text-sm font-medium">
            {business.contactEmail || "Not provided"}
          </span>
        </StatCard>

        <StatCard icon={PhoneIcon} label="Phone">
          <span className="text-sm font-medium">
            {business.phone || "Not provided"}
          </span>
        </StatCard>
      </div>

      <Card>
        <CardHeader className="flex-row items-start justify-between gap-4">
          <div>
            <CardTitle>Services</CardTitle>
            <CardDescription>
              Configure service duration and booking methods.
            </CardDescription>
          </div>
          <Link
            href={`/business/${business._id}/services`}
            className={cn(buttonVariants({ variant: "outline", size: "sm" }))}
          >
            <HugeiconsIcon icon={PlusIcon} strokeWidth={2} data-icon="inline-start" />
            Manage services
          </Link>
        </CardHeader>
        <CardContent>
          {services === undefined ? (
            <div className="grid gap-3">
              {Array.from({ length: 2 }).map((_, index) => (
                <Skeleton key={index} className="h-16 rounded-2xl" />
              ))}
            </div>
          ) : services.length === 0 ? (
            <Empty className="border-dashed">
              <EmptyContent>
                <EmptyDescription>
                  No services yet. Add a service before assigning it to queues
                  or enabling appointments.
                </EmptyDescription>
              </EmptyContent>
            </Empty>
          ) : (
            <div className="divide-y">
              {services.map((service) => (
                <div
                  key={service._id}
                  className="flex flex-wrap items-center justify-between gap-3 py-3 first:pt-0 last:pb-0"
                >
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <h3 className="truncate font-medium">{service.name}</h3>
                      <Badge variant="outline" className="h-5 rounded-full">
                        {service.isActive ? "Active" : "Inactive"}
                      </Badge>
                    </div>
                    {service.description ? (
                      <p className="mt-0.5 text-sm text-muted-foreground">
                        {service.description}
                      </p>
                    ) : null}
                    <p className="mt-0.5 text-sm text-muted-foreground">
                      {service.durationMinutes} minutes per customer
                    </p>
                    <div className="mt-2 flex flex-wrap gap-1.5">
                      {service.queueEnabled ? (
                        <Badge
                          variant="secondary"
                          className="h-5 gap-1 rounded-full"
                        >
                          <HugeiconsIcon
                            icon={Ticket01Icon}
                            strokeWidth={2}
                            className="size-3"
                          />
                          Queue
                        </Badge>
                      ) : null}
                      {service.appointmentsEnabled ? (
                        <Badge
                          variant="secondary"
                          className="h-5 rounded-full"
                        >
                          Appointments
                        </Badge>
                      ) : null}
                      {!service.queueEnabled &&
                      !service.appointmentsEnabled ? (
                        <Badge variant="secondary" className="h-5 rounded-full">
                          No booking method
                        </Badge>
                      ) : null}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex-row items-start justify-between gap-4">
          <div>
            <CardTitle>Queues</CardTitle>
            <CardDescription>
              Manage waiting lines and customer prerequisites.
            </CardDescription>
          </div>
          <Link
            href={`/business/${business._id}/queues`}
            className={cn(buttonVariants({ variant: "outline", size: "sm" }))}
          >
            <HugeiconsIcon icon={PlusIcon} strokeWidth={2} data-icon="inline-start" />
            Manage queues
          </Link>
        </CardHeader>
        <CardContent>
          {queues === undefined ? (
            <div className="grid gap-3">
              {Array.from({ length: 2 }).map((_, index) => (
                <Skeleton key={index} className="h-16 rounded-2xl" />
              ))}
            </div>
          ) : queues.length === 0 ? (
            <Empty className="border-dashed">
              <EmptyContent>
                <EmptyDescription>
                  No queues yet. Create a queue and link it to a service.
                </EmptyDescription>
              </EmptyContent>
            </Empty>
          ) : (
            <div className="divide-y">
              {queues.map((queue) => (
                <div
                  key={queue._id}
                  className="flex flex-wrap items-center justify-between gap-3 py-3 first:pt-0 last:pb-0"
                >
                  <div className="min-w-0">
                    <h3 className="truncate font-medium">{queue.name}</h3>
                    {queue.description ? (
                      <p className="mt-0.5 text-sm text-muted-foreground">
                        {queue.description}
                      </p>
                    ) : null}
                    <p className="mt-0.5 text-xs text-muted-foreground">
                      {queue.prerequisites.length} prerequisites
                    </p>
                  </div>
                  <Badge
                    variant={statusVariant(queue.status)}
                    className="rounded-full capitalize"
                  >
                    {queue.status}
                  </Badge>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <div className="grid gap-4 sm:grid-cols-2">
        <Link
          href={`/business/${business._id}/appointments`}
          className="group"
        >
          <Card className="h-full transition-colors group-hover:border-ring group-hover:bg-accent/40">
            <CardContent className="flex items-start justify-between gap-4 p-5">
              <div>
                <h2 className="font-medium">Appointments</h2>
                <CardDescription className="mt-1">
                  View bookings, check customers in, and manage visit statuses.
                </CardDescription>
              </div>
              <HugeiconsIcon
                icon={ArrowUpRight01Icon}
                strokeWidth={2}
                className="mt-1 size-4 shrink-0 text-muted-foreground transition-colors group-hover:text-foreground"
              />
            </CardContent>
          </Card>
        </Link>

        <Link
          href={`/business/${business._id}/schedule`}
          className="group"
        >
          <Card className="h-full transition-colors group-hover:border-ring group-hover:bg-accent/40">
            <CardContent className="flex items-start justify-between gap-4 p-5">
              <div>
                <h2 className="font-medium">Daily schedule</h2>
                <CardDescription className="mt-1">
                  Review operating hours and the day&apos;s appointment
                  timeline.
                </CardDescription>
              </div>
              <HugeiconsIcon
                icon={ArrowUpRight01Icon}
                strokeWidth={2}
                className="mt-1 size-4 shrink-0 text-muted-foreground transition-colors group-hover:text-foreground"
              />
            </CardContent>
          </Card>
        </Link>
      </div>
    </div>
  );
}