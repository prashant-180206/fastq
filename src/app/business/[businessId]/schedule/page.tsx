"use client";

import Link from "next/link";
import { use, useState } from "react";
import { useQuery } from "convex/react";
import { api } from "@/../convex/_generated/api";
import type { Id } from "@/../convex/_generated/dataModel";
import { Badge } from "@/components/ui/badge";
import { Button, buttonVariants } from "@/components/ui/button";
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
import { Field, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { formatTimeIST, todayInIST } from "@/lib/format";
import {
  ArrowUpRight01Icon,
  Clock01Icon,
  TimeScheduleIcon,
} from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import { cn } from "cn";

const dayNames = [
  "Sunday",
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
];

export default function BusinessSchedulePage({
  params,
}: {
  params: Promise<{ businessId: string }>;
}) {
  const { businessId } = use(params);
  const id = businessId as Id<"businesses">;
  const [selectedDate, setSelectedDate] = useState(todayInIST());

  const business = useQuery(api.business.data.getById, {
    businessId: id,
  });

  const appointments = useQuery(api.business.appointments.getByBusiness, {
    businessId: id,
    date: selectedDate,
  });

  const services = useQuery(api.business.services.getByBusiness, {
    businessId: id,
  });

  if (business === undefined) {
    return (
      <div className="flex flex-col gap-6">
        <div className="space-y-2">
          <Skeleton className="h-9 w-56" />
          <Skeleton className="h-4 w-full max-w-md" />
        </div>
        <Skeleton className="h-40 rounded-3xl" />
        <Skeleton className="h-64 rounded-3xl" />
      </div>
    );
  }

  if (business === null) {
    return (
      <Empty className="justify-center py-24">
        <EmptyContent>
          <EmptyMedia variant="icon">
            <HugeiconsIcon icon={TimeScheduleIcon} strokeWidth={2} />
          </EmptyMedia>
          <EmptyTitle>Business not found</EmptyTitle>
          <EmptyDescription>
            It may have been removed or the link is incorrect.
          </EmptyDescription>
        </EmptyContent>
        <Link
          href="/business"
          className={cn(buttonVariants({ size: "sm" }))}
        >
          Return to businesses
        </Link>
      </Empty>
    );
  }

  const selectedDay = new Date(`${selectedDate}T12:00:00+05:30`);
  const weekday = dayNames[selectedDay.getDay()].toLowerCase();

  const businessDay = business.businessHours?.find(
    (day) => day.day === weekday,
  );

  const serviceName = (serviceDbId: Id<"services">) =>
    services?.find((service) => service._id === serviceDbId)?.name ?? "Service";

  const sortedAppointments = [...(appointments ?? [])].sort(
    (a, b) => a.scheduledStart - b.scheduledStart,
  );

  const activeAppointments = sortedAppointments.filter(
    (appointment) =>
      appointment.status === "booked" || appointment.status === "checked_in",
  );

  const isActive = (status: string) =>
    status === "booked" || status === "checked_in";

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="font-heading text-3xl font-bold tracking-tight">
            Daily schedule
          </h1>
          <p className="mt-1 text-muted-foreground">
            {business.name} · Asia/Kolkata (IST)
          </p>
        </div>

        <Link
          href={`/business/${businessId}/appointments`}
          className={cn(buttonVariants({ variant: "outline", size: "sm" }))}
        >
          Manage appointments
          <HugeiconsIcon
            icon={ArrowUpRight01Icon}
            strokeWidth={2}
            data-icon="inline-end"
          />
        </Link>
      </div>

      <Card>
        <CardContent className="flex flex-wrap items-end justify-between gap-4">
          <Field>
            <FieldLabel htmlFor="schedule-date">Schedule date</FieldLabel>
            <Input
              id="schedule-date"
              type="date"
              value={selectedDate}
              onChange={(event) => setSelectedDate(event.target.value)}
            />
          </Field>

          <p className="text-sm text-muted-foreground">
            {activeAppointments.length} active appointment
            {activeAppointments.length === 1 ? "" : "s"}
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <HugeiconsIcon icon={Clock01Icon} strokeWidth={2} data-icon="inline-start" />
            Operating hours
          </CardTitle>
          <CardDescription>
            The configured hours for {weekday}.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {!businessDay || !businessDay.isOpen ? (
            <p className="text-sm text-muted-foreground">
              The business is marked closed for this day.
            </p>
          ) : businessDay.slots.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              No operating intervals are configured.
            </p>
          ) : (
            <div className="flex flex-wrap gap-2">
              {businessDay.slots.map((slot, index) => (
                <Badge
                  key={`${slot.open}-${slot.close}-${index}`}
                  variant="outline"
                  className="h-7 rounded-xl px-3 text-sm font-medium tabular-nums"
                >
                  {slot.open} – {slot.close}
                </Badge>
              ))}
            </div>
          )}

          <Link
            href={`/business/${businessId}/working-hours`}
            className="mt-4 inline-flex items-center gap-1.5 text-sm font-medium text-primary underline-offset-4 hover:underline"
          >
            Edit operating hours
            <HugeiconsIcon icon={ArrowUpRight01Icon} strokeWidth={2} data-icon="inline-end" />
          </Link>
        </CardContent>
      </Card>

      <div>
        <h2 className="font-heading text-xl font-bold tracking-tight">
          Appointment timeline
        </h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Reservations are ordered by their scheduled start time.
        </p>
      </div>

      {appointments === undefined || services === undefined ? (
        <div className="flex flex-col gap-3">
          <Skeleton className="h-9 w-72" />
          <Skeleton className="h-28 rounded-3xl" />
          <Skeleton className="h-28 rounded-3xl" />
        </div>
      ) : sortedAppointments.length === 0 ? (
        <Empty className="border-dashed">
          <EmptyContent>
            <EmptyMedia variant="icon">
              <HugeiconsIcon icon={TimeScheduleIcon} strokeWidth={2} />
            </EmptyMedia>
            <EmptyTitle>No appointments scheduled</EmptyTitle>
            <EmptyDescription>
              No bookings were found for this date.
            </EmptyDescription>
          </EmptyContent>
        </Empty>
      ) : (
        <div className="flex flex-col gap-3">
          {sortedAppointments.map((appointment) => {
            const active = isActive(appointment.status);

            return (
              <Card key={appointment._id} size="sm">
                <CardContent className="flex gap-4">
                  <div className="w-24 shrink-0">
                    <p className="font-semibold tabular-nums">
                      {formatTimeIST(appointment.scheduledStart)}
                    </p>
                    <p className="mt-1 text-xs text-muted-foreground">
                      {formatTimeIST(appointment.scheduledEnd)}
                    </p>
                  </div>

                  <div className="min-w-0 flex-1 border-l pl-4">
                    <div className="flex flex-wrap items-center gap-2">
                      <h3 className="font-medium">
                        {serviceName(appointment.serviceId)}
                      </h3>
                      <Badge
                        className="h-5 rounded-full capitalize"
                        variant={active ? "default" : "secondary"}
                      >
                        {appointment.status.replace("_", " ")}
                      </Badge>
                    </div>

                    <p className="mt-1 break-all text-xs text-muted-foreground">
                      Booking: {appointment._id}
                    </p>

                    {appointment.notes ? (
                      <p className="mt-2 text-sm text-muted-foreground">
                        {appointment.notes}
                      </p>
                    ) : null}

                    {active ? (
                      <Button
                        variant="link"
                        size="sm"
                        className="mt-1 h-auto p-0"
                        render={
                          <Link
                            href={`/business/${businessId}/appointments`}
                          />
                        }
                      >
                        Manage booking
                      </Button>
                    ) : null}
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}