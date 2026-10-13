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
import type { FunctionReturnType } from "convex/server";
import { Calendar02Icon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import { cn } from "cn";

type Appointment = FunctionReturnType<
  typeof api.business.appointments.getMyAppointments
>[number];

function titleCase(value: string) {
  return value.replaceAll("_", " ").replace(/\b\w/g, (c) => c.toUpperCase());
}

function statusVariant(status: string): "default" | "secondary" | "outline" {
  if (["serving", "checked_in"].includes(status)) {
    return "secondary";
  }
  if (["booked", "completed"].includes(status)) {
    return "default";
  }
  return "outline";
}

function AppointmentRow({
  appointment,
  businessName,
}: {
  appointment: Appointment;
  businessName: string;
}) {
  return (
    <Link href={`/customer/appointments/${appointment._id}`} key={appointment._id}>
      <Card size="sm" className="transition-colors hover:bg-muted/40">
        <CardContent className="flex flex-wrap items-center justify-between gap-3">
          <div className="min-w-0">
            <h3 className="font-semibold">{businessName}</h3>
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
  );
}

export default function CustomerAppointmentsPage() {
  const now = useNow();
  const appointments = useQuery(api.business.appointments.getMyAppointments, {});
  const businesses = useQuery(api.business.data.getAll, {});

  const businessName = (businessId: Id<"businesses">) =>
    businesses?.find((business) => business._id === businessId)?.name ??
    "Business";

  if (appointments === undefined) {
    return (
      <div className="flex flex-col gap-6">
        <div className="space-y-2">
          <Skeleton className="h-9 w-64" />
          <Skeleton className="h-4 w-full max-w-md" />
        </div>
        <Skeleton className="h-9 w-48" />
        <Skeleton className="h-24 rounded-3xl" />
        <Skeleton className="h-9 w-36" />
        <Skeleton className="h-24 rounded-3xl" />
      </div>
    );
  }

  const upcoming = appointments
    .filter(
      (appointment) =>
        ["booked", "checked_in"].includes(appointment.status) &&
        appointment.scheduledStart >= now,
    )
    .sort((a, b) => a.scheduledStart - b.scheduledStart);

  const history = appointments
    .filter(
      (appointment) =>
        !(
          ["booked", "checked_in"].includes(appointment.status) &&
          appointment.scheduledStart >= now
        ),
    )
    .sort((a, b) => b.scheduledStart - a.scheduledStart);

  return (
    <div className="flex flex-col gap-8">
      <div>
        <h1 className="font-heading text-3xl font-bold tracking-tight">
          My appointments
        </h1>
        <p className="mt-1 text-muted-foreground">
          Review upcoming bookings and your appointment history.
        </p>
      </div>

      {appointments.length === 0 ? (
        <Empty className="border-dashed">
          <EmptyContent>
            <EmptyMedia variant="icon">
              <HugeiconsIcon icon={Calendar02Icon} strokeWidth={2} />
            </EmptyMedia>
            <EmptyTitle>No appointments yet</EmptyTitle>
            <EmptyDescription>
              Find a business and book a visit to see it here.
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
        <>
          <section className="flex flex-col gap-3">
            <h2 className="font-heading text-xl font-bold tracking-tight">
              Upcoming
              <Badge variant="secondary" className="ml-2 rounded-full">
                {upcoming.length}
              </Badge>
            </h2>

            {upcoming.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                You have no upcoming appointments.
              </p>
            ) : (
              <div className="flex flex-col gap-3">
                {upcoming.map((appointment) => (
                  <AppointmentRow
                    key={appointment._id}
                    appointment={appointment}
                    businessName={businessName(appointment.businessId)}
                  />
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
                Your past appointments will appear here.
              </p>
            ) : (
              <div className="flex flex-col gap-3">
                {history.map((appointment) => (
                  <AppointmentRow
                    key={appointment._id}
                    appointment={appointment}
                    businessName={businessName(appointment.businessId)}
                  />
                ))}
              </div>
            )}
          </section>
        </>
      )}
    </div>
  );
}