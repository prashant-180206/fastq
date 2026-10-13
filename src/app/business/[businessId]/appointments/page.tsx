"use client";

import Link from "next/link";
import { use, useState } from "react";
import { useMutation, useQuery } from "convex/react";
import { api } from "@/../convex/_generated/api";
import type { Id } from "@/../convex/_generated/dataModel";
import { Badge } from "@/components/ui/badge";
import { Button, buttonVariants } from "@/components/ui/button";
import {
  Card,
  CardContent,
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { Spinner } from "@/components/ui/spinner";
import { formatShortDateIST, formatTimeIST, todayInIST } from "@/lib/format";
import { notifyError, notifySuccess } from "@/lib/toast";
import {
  ArrowUpRight01Icon,
  Calendar02Icon,
  Ticket01Icon,
} from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import { cn } from "cn";

function appointmentVariant(
  status: string,
): "default" | "secondary" | "destructive" | "outline" | "ghost" {
  if (status === "checked_in") {
    return "default";
  }
  if (status === "completed" || status === "cancelled") {
    return "secondary";
  }
  if (status === "no_show") {
    return "destructive";
  }
  return "outline";
}

export default function BusinessAppointmentsPage({
  params,
}: {
  params: Promise<{ businessId: string }>;
}) {
  const { businessId } = use(params);
  const id = businessId as Id<"businesses">;

  const [selectedDate, setSelectedDate] = useState(todayInIST());
  const [statusFilter, setStatusFilter] = useState("all");
  const [busyId, setBusyId] = useState<string | null>(null);

  const appointments = useQuery(api.business.appointments.getByBusiness, {
    businessId: id,
    date: selectedDate,
  });

  const services = useQuery(api.business.services.getByBusiness, {
    businessId: id,
  });

  const checkIn = useMutation(api.business.appointments.checkIn);
  const complete = useMutation(api.business.appointments.complete);
  const markNoShow = useMutation(api.business.appointments.markNoShow);

  const serviceName = (serviceDbId: Id<"services">) =>
    services?.find((service) => service._id === serviceDbId)?.name ?? "Service";

  async function runAction(
    appointmentId: Id<"appointments">,
    action: "checkIn" | "complete" | "noShow",
  ) {
    setBusyId(appointmentId);
    try {
      if (action === "checkIn") {
        await checkIn({ appointmentId });
        notifySuccess("Checked in");
      } else if (action === "complete") {
        await complete({ appointmentId });
        notifySuccess("Visit completed");
      } else {
        await markNoShow({ appointmentId });
        notifySuccess("Marked as no-show");
      }
    } catch (error) {
      notifyError(
        "Could not update appointment",
        error instanceof Error
          ? error.message
          : "Please try again.",
      );
    } finally {
      setBusyId(null);
    }
  }

  const filteredAppointments = (appointments ?? []).filter(
    (appointment) =>
      statusFilter === "all" || appointment.status === statusFilter,
  );

  const bookedCount = (appointments ?? []).filter(
    (appointment) => appointment.status === "booked",
  ).length;

  const checkedInCount = (appointments ?? []).filter(
    (appointment) => appointment.status === "checked_in",
  ).length;

  const completedCount = (appointments ?? []).filter(
    (appointment) => appointment.status === "completed",
  ).length;

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="font-heading text-3xl font-bold tracking-tight">
            Appointments
          </h1>
          <p className="mt-1 text-muted-foreground">
            Review bookings and manage customer visits.
          </p>
        </div>

        <Link
          href={`/business/${businessId}/schedule`}
          className={cn(buttonVariants({ variant: "outline", size: "sm" }))}
        >
          View schedule
          <HugeiconsIcon
            icon={ArrowUpRight01Icon}
            strokeWidth={2}
            data-icon="inline-end"
          />
        </Link>
      </div>

      <section className="grid gap-3 sm:grid-cols-3">
        {[
          ["Booked", bookedCount],
          ["Checked in", checkedInCount],
          ["Completed", completedCount],
        ].map(([label, count]) => (
          <Card key={label}>
            <CardHeader>
              <CardTitle className="text-sm font-normal text-muted-foreground">
                {label}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="font-heading text-3xl font-bold tracking-tight">
                {count}
              </p>
            </CardContent>
          </Card>
        ))}
      </section>

      <Card>
        <CardHeader className="grid gap-4 sm:grid-cols-2">
          <Field>
            <FieldLabel htmlFor="appointment-date">
              Appointment date
            </FieldLabel>
            <Input
              id="appointment-date"
              type="date"
              value={selectedDate}
              onChange={(event) => setSelectedDate(event.target.value)}
            />
          </Field>

          <Field>
            <FieldLabel htmlFor="appointment-status">Status</FieldLabel>
            <Select
              value={statusFilter}
              onValueChange={(value) => setStatusFilter(value ?? "all")}
            >
              <SelectTrigger id="appointment-status" className="w-full">
                <SelectValue placeholder="All statuses" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All statuses</SelectItem>
                <SelectItem value="booked">Booked</SelectItem>
                <SelectItem value="checked_in">Checked in</SelectItem>
                <SelectItem value="completed">Completed</SelectItem>
                <SelectItem value="cancelled">Cancelled</SelectItem>
                <SelectItem value="no_show">No-show</SelectItem>
              </SelectContent>
            </Select>
          </Field>
        </CardHeader>
      </Card>

      {appointments === undefined || services === undefined ? (
        <div className="flex flex-col gap-3">
          <Skeleton className="h-9 w-72" />
          <Skeleton className="h-9 w-56" />
          <Skeleton className="h-28 rounded-3xl" />
        </div>
      ) : filteredAppointments.length === 0 ? (
        <Empty className="border-dashed">
          <EmptyContent>
            <EmptyMedia variant="icon">
              <HugeiconsIcon icon={Calendar02Icon} strokeWidth={2} />
            </EmptyMedia>
            <EmptyTitle>No appointments found</EmptyTitle>
            <EmptyDescription>
              Try another date or status filter.
            </EmptyDescription>
          </EmptyContent>
        </Empty>
      ) : (
        <div className="flex flex-col gap-3">
          {filteredAppointments.map((appointment) => (
            <Card key={appointment._id} size="sm">
              <CardContent className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div className="min-w-0 grid gap-1.5">
                  <div className="flex flex-wrap items-center gap-2">
                    <h2 className="font-semibold">
                      {serviceName(appointment.serviceId)}
                    </h2>
                    <Badge
                      variant={appointmentVariant(appointment.status)}
                      className="h-5 rounded-full capitalize"
                    >
                      {appointment.status.replace("_", " ")}
                    </Badge>
                  </div>

                  <p className="text-sm text-muted-foreground">
                    {formatTimeIST(appointment.scheduledStart)} –{" "}
                    {formatTimeIST(appointment.scheduledEnd)}
                    {" · "}
                    {formatShortDateIST(appointment.scheduledStart)}
                  </p>

                  <p className="flex items-center gap-1.5 text-xs text-muted-foreground">
                    <HugeiconsIcon
                      icon={Ticket01Icon}
                      strokeWidth={2}
                      data-icon="inline-start"
                    />
                    Booking ID: {appointment._id}
                  </p>

                  {appointment.notes ? (
                    <p className="text-sm text-muted-foreground">
                      Note: {appointment.notes}
                    </p>
                  ) : null}
                </div>

                <div className="flex flex-wrap gap-2">
                  {appointment.status === "booked" ? (
                    <>
                      <Button
                        size="sm"
                        disabled={busyId === appointment._id}
                        onClick={() =>
                          void runAction(appointment._id, "checkIn")
                        }
                      >
                        {busyId === appointment._id ? (
                          <Spinner data-icon="inline-start" />
                        ) : null}
                        {busyId === appointment._id ? "Updating…" : "Check in"}
                      </Button>

                      <Button
                        variant="outline"
                        size="sm"
                        className="text-destructive hover:bg-destructive/10 hover:text-destructive"
                        disabled={busyId === appointment._id}
                        onClick={() =>
                          void runAction(appointment._id, "noShow")
                        }
                      >
                        Mark no-show
                      </Button>
                    </>
                  ) : null}

                  {appointment.status === "checked_in" ? (
                    <Button
                      size="sm"
                      disabled={busyId === appointment._id}
                      onClick={() =>
                        void runAction(appointment._id, "complete")
                      }
                    >
                      {busyId === appointment._id ? (
                        <Spinner data-icon="inline-start" />
                      ) : null}
                      {busyId === appointment._id
                        ? "Updating…"
                        : "Complete visit"}
                    </Button>
                  ) : null}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}