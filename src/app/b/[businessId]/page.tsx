"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useQuery } from "convex/react";
import { api } from "@/../convex/_generated/api";
import type { Id } from "@/../convex/_generated/dataModel";
import { BusinessActions } from "@/components/business/business-actions";
import { BusinessProfileHeader } from "@/components/business/business-profile-header";
import { QueueCard } from "@/components/business/queue-card";
import { SectionHeading } from "@/components/business/section-heading";
import { ServiceCard } from "@/components/business/service-card";
import { TodaySchedule } from "@/components/business/today-schedule";
import { WeeklyHours } from "@/components/business/weekly-hours";
import {
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty";
import { buttonVariants } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { businessTypeLabel } from "@/lib/business-type";
import {
  ArrowLeft01Icon,
  Building01Icon,
  Location01Icon,
  Queue02Icon,
} from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import { cn } from "cn";

function BusinessSkeleton() {
  return (
    <div className="mx-auto max-w-6xl space-y-10 px-4 py-8 sm:px-6">
      <div className="h-96 animate-pulse rounded-3xl bg-muted" />
      <div className="h-72 animate-pulse rounded-3xl bg-muted" />
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="h-56 animate-pulse rounded-3xl bg-muted" />
        <div className="h-56 animate-pulse rounded-3xl bg-muted" />
        <div className="h-56 animate-pulse rounded-3xl bg-muted" />
        <div className="h-56 animate-pulse rounded-3xl bg-muted" />
      </div>
    </div>
  );
}

export default function PublicBusinessPage() {
  const params = useParams<{ businessId: string }>();
  const businessId = params.businessId as Id<"businesses">;

  const business = useQuery(api.business.data.getPublicById, {
    businessId,
  });

  const services = useQuery(api.business.services.getPublicByBusiness, {
    businessId,
  });

  const queues = useQuery(api.business.queue.getPublicByBusiness, {
    businessId,
  });

  if (business === undefined || services === undefined || queues === undefined) {
    return <BusinessSkeleton />;
  }

  if (!business) {
    return (
      <main className="mx-auto max-w-6xl px-4 pt-16 sm:px-6">
        <Empty>
          <EmptyContent>
            <EmptyMedia variant="icon">
              <HugeiconsIcon icon={Building01Icon} strokeWidth={2} />
            </EmptyMedia>
            <EmptyTitle>Business unavailable</EmptyTitle>
            <EmptyDescription>
              This business may not exist or may no longer be available on
              QuiLess.
            </EmptyDescription>
            <Link
              href="/customer"
              className={cn(buttonVariants())}
            >
              <HugeiconsIcon icon={ArrowLeft01Icon} strokeWidth={2} />
              Browse businesses
            </Link>
          </EmptyContent>
        </Empty>
      </main>
    );
  }

  return (
    <main className="mx-auto max-w-6xl space-y-10 px-4 py-8 sm:px-6">
      <BusinessProfileHeader business={business} />

      <div className="flex flex-wrap items-center gap-3">
        <Badge variant="secondary" className="h-6 rounded-full font-normal">
          {businessTypeLabel(business.type)}
        </Badge>

        {business.location ? (
          <a
            href={`https://www.google.com/maps?q=${business.location.latitude},${business.location.longitude}`}
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center gap-1.5 text-sm font-medium text-primary underline-offset-4 hover:underline"
          >
            <HugeiconsIcon icon={Location01Icon} strokeWidth={2} className="size-4" />
            Get directions
          </a>
        ) : null}
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <WeeklyHours businessHours={business.businessHours} />
        <TodaySchedule businessHours={business.businessHours} />
      </div>

      <section className="space-y-5">
        <SectionHeading
          title="Available services"
          description="Choose a service to see the ways you can book."
        />

        {services.length === 0 ? (
          <CardEmpty message="No services are currently available." />
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {services.map((service) => {
              const hasActiveQueue = queues.some(
                (queue) => queue.serviceId === service._id,
              );

              return (
                <ServiceCard
                  key={service._id}
                  businessId={businessId}
                  service={service}
                  hasActiveQueue={hasActiveQueue}
                />
              );
            })}
          </div>
        )}
      </section>

      <section className="space-y-5">
        <SectionHeading
          title="Active queues"
          description="Select a queue to continue."
        />

        {queues.length === 0 ? (
          <EmptyCard
            icon={Queue02Icon}
            title="There are no active queues right now"
            description="Check back soon or book an appointment in the meantime."
          />
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {queues.map((queue) => {
              const service = services.find(
                (item) => item._id === queue.serviceId,
              );

              return (
                <QueueCard
                  key={queue._id}
                  businessId={businessId}
                  queue={queue}
                  serviceName={service?.name}
                />
              );
            })}
          </div>
        )}
      </section>

      <BusinessActions businessId={businessId} />
    </main>
  );
}

function CardEmpty({ message }: { message: string }) {
  return (
    <CardEmptyShell>
      <p className="text-sm text-muted-foreground">{message}</p>
    </CardEmptyShell>
  );
}

function EmptyCard({
  icon,
  title,
  description,
}: {
  icon: typeof Queue02Icon;
  title: string;
  description: string;
}) {
  return (
    <CardEmptyShell>
      <HugeiconsIcon icon={icon} strokeWidth={2} className="size-6 text-muted-foreground" />
      <p className="text-sm font-medium">{title}</p>
      <p className="text-sm text-muted-foreground">{description}</p>
    </CardEmptyShell>
  );
}

function CardEmptyShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex flex-col items-center justify-center gap-2 rounded-3xl border border-dashed p-10 text-center">
      {children}
    </div>
  );
}