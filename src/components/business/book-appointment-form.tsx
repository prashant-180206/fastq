"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { useMutation, useQuery } from "convex/react";
import { api } from "@/../convex/_generated/api";
import type { Id } from "@/../convex/_generated/dataModel";
import { FlowHeader } from "@/components/business/flow-header";
import { SummaryCard } from "@/components/business/summary-card";
import {
  Alert,
  AlertDescription,
  AlertTitle,
} from "@/components/ui/alert";
import { buttonVariants, Button } from "@/components/ui/button";
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
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { Spinner } from "@/components/ui/spinner";
import { Textarea } from "@/components/ui/textarea";
import {
  Building01Icon,
  Calendar02Icon,
  CheckmarkCircle01Icon,
  Clock01Icon,
} from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import {
  formatLongDateIST,
  formatTimeIST,
  todayInIST,
} from "@/lib/format";
import { cn } from "cn";

interface BookAppointmentFormProps {
  businessId: string;
  initialServiceId?: string;
}

export function BookAppointmentForm({
  businessId,
  initialServiceId,
}: BookAppointmentFormProps) {
  const id = businessId as Id<"businesses">;

  const [serviceChoice, setServiceChoice] = useState(initialServiceId ?? "");
  const [touchedService, setTouchedService] = useState(false);
  const [date, setDate] = useState(todayInIST());
  const [selectedStart, setSelectedStart] = useState<number | null>(null);
  const [notes, setNotes] = useState("");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState<{
    appointmentId: Id<"appointments">;
    scheduledStart: number;
    scheduledEnd: number;
    status: string;
  } | null>(null);

  const business = useQuery(api.business.data.getPublicById, {
    businessId: id,
  });
  const services = useQuery(api.business.services.getPublicByBusiness, {
    businessId: id,
  });

  const requestedServiceId = useMemo(() => {
    if (services === undefined) {
      return "";
    }
    if (!initialServiceId) {
      return "";
    }
    return services.some(
      (service) =>
        service._id === initialServiceId && service.appointmentsEnabled,
    )
      ? initialServiceId
      : "";
  }, [services, initialServiceId]);

  const selectedServiceId = touchedService
    ? serviceChoice
    : serviceChoice || requestedServiceId;

  const selectedService = services?.find(
    (service) =>
      service._id === selectedServiceId && service.appointmentsEnabled,
  );

  const slots = useQuery(
    api.business.appointments.getAvailableSlots,
    selectedServiceId
      ? {
          businessId: id,
          serviceId: selectedServiceId as Id<"services">,
          date,
        }
      : "skip",
  );

  const book = useMutation(api.business.appointments.book);

  async function handleBooking() {
    if (!selectedService || selectedStart === null) {
      setError("Choose a service and an available time.");
      return;
    }

    setError("");
    setSubmitting(true);

    try {
      const result = await book({
        businessId: id,
        serviceId: selectedService._id,
        scheduledStart: selectedStart,
        ...(notes.trim() ? { notes: notes.trim() } : {}),
      });

      setSuccess(result);
      setSelectedStart(null);
      setNotes("");
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Unable to book this appointment.",
      );
    } finally {
      setSubmitting(false);
    }
  }

  if (business === undefined || services === undefined) {
    return (
      <main className="mx-auto max-w-6xl space-y-8 px-4 py-8 sm:px-6">
        <Skeleton className="h-6 w-40" />
        <Skeleton className="h-12 w-80 max-w-full" />
        <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_360px]">
          <Skeleton className="h-96 rounded-3xl" />
          <Skeleton className="h-64 rounded-3xl" />
        </div>
      </main>
    );
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
              FastQ.
            </EmptyDescription>
          </EmptyContent>
        </Empty>
      </main>
    );
  }

  const bookableServices = services.filter(
    (service) => service.appointmentsEnabled,
  );

  if (success) {
    const confirmed = success;

    return (
      <main className="mx-auto max-w-6xl px-4 py-8 sm:px-6">
        <FlowHeader
          businessId={businessId}
          businessName={business.name}
          title="Appointment confirmed"
        />

        <Card className="mx-auto mt-8 max-w-xl">
          <CardContent className="flex flex-col items-center gap-4 p-8 text-center">
            <div className="flex size-12 items-center justify-center rounded-full bg-primary/10 text-primary">
              <HugeiconsIcon
                icon={CheckmarkCircle01Icon}
                strokeWidth={2}
                className="size-6"
              />
            </div>

            <div>
              <p className="font-heading text-lg font-semibold">
                {selectedService?.name ?? "Your appointment"} is booked
              </p>
              <p className="mt-1 text-sm text-muted-foreground">
                {formatLongDateIST(
                  new Date(`${date}T00:00:00+05:30`),
                )}{" "}
                &middot; {formatTimeIST(confirmed.scheduledStart)} –{" "}
                {formatTimeIST(confirmed.scheduledEnd)} (IST)
              </p>
            </div>

            <p className="w-full break-all rounded-xl bg-muted/60 p-3 font-mono text-xs text-muted-foreground">
              Booking ID: {confirmed.appointmentId}
            </p>

            <div className="flex flex-wrap items-center justify-center gap-3">
              <Link href="/my-day" className={cn(buttonVariants())}>
                View my day
                <HugeiconsIcon icon={Calendar02Icon} strokeWidth={2} />
              </Link>
              <button
                type="button"
                onClick={() => setSuccess(null)}
                className={cn(buttonVariants({ variant: "outline" }))}
              >
                Book another appointment
              </button>
            </div>
          </CardContent>
        </Card>
      </main>
    );
  }

  const availableSlots = slots?.slots.filter((slot) => slot.available) ?? [];

  return (
    <main className="mx-auto max-w-6xl px-4 py-8 sm:px-6">
      <FlowHeader
        businessId={businessId}
        businessName={business.name}
        title="Book an appointment"
        description={
          bookableServices.length > 0
            ? `Pick a service and an open slot for ${business.name}.`
            : `${business.name} is not taking bookings right now.`
        }
      />

      <div className="mt-8 grid gap-6 lg:grid-cols-[minmax(0,1fr)_360px]">
        <Card className="h-fit">
          <CardHeader>
            <CardTitle>Appointment details</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {bookableServices.length === 0 ? (
              <Empty>
                <EmptyContent>
                  <EmptyDescription>
                    This business is not accepting bookings at the moment.
                    Try joining a queue instead.
                  </EmptyDescription>
                </EmptyContent>
              </Empty>
            ) : (
              <>
                <div className="grid gap-2">
                  <Label>Service</Label>
                  <Select
                    value={selectedServiceId}
                    onValueChange={(value) => {
                      setTouchedService(true);
                      setServiceChoice(value ?? "");
                      setSelectedStart(null);
                      setError("");
                    }}
                  >
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Choose a service" />
                    </SelectTrigger>
                    <SelectContent>
                      {bookableServices.map((service) => (
                        <SelectItem key={service._id} value={service._id}>
                          {service.name} ({service.durationMinutes} min)
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="grid gap-2">
                  <Label htmlFor="appointment-date">Appointment date</Label>
                  <Input
                    id="appointment-date"
                    type="date"
                    min={todayInIST()}
                    value={date}
                    onChange={(event) => {
                      setDate(event.target.value);
                      setSelectedStart(null);
                      setError("");
                    }}
                  />
                </div>

                {selectedService ? (
                  <div className="grid gap-3">
                    <div className="flex items-center justify-between">
                      <h3 className="text-sm font-medium">Available times</h3>
                      <p className="flex items-center gap-1.5 text-xs text-muted-foreground">
                        <HugeiconsIcon
                          icon={Clock01Icon}
                          strokeWidth={2}
                          className="size-3.5"
                        />
                        IST
                      </p>
                    </div>

                    {slots === undefined ? (
                      <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
                        {Array.from({ length: 6 }).map((_, index) => (
                          <Skeleton key={index} className="h-11 rounded-xl" />
                        ))}
                      </div>
                    ) : availableSlots.length === 0 ? (
                      <p className="rounded-2xl bg-muted/60 p-4 text-sm text-muted-foreground">
                        No available slots for this date. Try another day.
                      </p>
                    ) : (
                      <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
                        {availableSlots.map((slot) => {
                          const isSelected =
                            selectedStart === slot.scheduledStart;

                          return (
                            <button
                              type="button"
                              key={slot.scheduledStart}
                              onClick={() => {
                                setSelectedStart(slot.scheduledStart);
                                setError("");
                              }}
                              className={cn(
                                buttonVariants({
                                  variant: isSelected ? "default" : "outline",
                                  size: "sm",
                                }),
                                "h-11 justify-center",
                              )}
                            >
                              {formatTimeIST(slot.scheduledStart)}
                            </button>
                          );
                        })}
                      </div>
                    )}
                  </div>
                ) : null}

                <div className="grid gap-2">
                  <Label htmlFor="booking-note">Note (optional)</Label>
                  <Textarea
                    id="booking-note"
                    rows={3}
                    maxLength={1000}
                    value={notes}
                    onChange={(event) => setNotes(event.target.value)}
                    placeholder="Anything the business should know?"
                  />
                </div>
              </>
            )}

            {error ? (
              <Alert variant="destructive">
                <AlertTitle>Could not book the appointment</AlertTitle>
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            ) : null}

            {bookableServices.length > 0 ? (
              <div className="grid gap-3">
                <Button
                  onClick={handleBooking}
                  disabled={
                    !selectedService || selectedStart === null || slots === undefined || submitting
                  }
                  className="w-full"
                >
                  {submitting ? <Spinner data-icon="inline-start" /> : null}
                  {submitting ? "Booking…" : "Confirm appointment"}
                </Button>

                <p className="text-center text-xs text-muted-foreground">
                  Booking requires you to be signed in. Times are shown in
                  India Standard Time (IST).
                </p>
              </div>
            ) : null}
          </CardContent>
        </Card>

        <SummaryCard title="Order summary">
          {selectedService ? (
            <div className="grid gap-4">
              <div className="space-y-1">
                <p className="text-sm text-muted-foreground">Service</p>
                <p className="text-sm font-medium">
                  {selectedService.name}
                  <span className="ml-2 text-muted-foreground">
                    &middot; {selectedService.durationMinutes} min
                  </span>
                </p>
              </div>

              <div className="space-y-1">
                <p className="text-sm text-muted-foreground">Date</p>
                <p className="text-sm font-medium">
                  {formatLongDateIST(new Date(`${date}T00:00:00+05:30`))}
                </p>
              </div>

              {selectedStart !== null ? (
                <div className="space-y-1">
                  <p className="text-sm text-muted-foreground">Time</p>
                  <p className="text-sm font-medium">
                    {formatTimeIST(selectedStart)} (IST)
                  </p>
                </div>
              ) : null}

              {notes.trim() ? (
                <div className="space-y-1">
                  <p className="text-sm text-muted-foreground">Note</p>
                  <p className="line-clamp-3 text-sm">{notes.trim()}</p>
                </div>
              ) : null}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">
              Pick a service and a time to preview your booking here.
            </p>
          )}
        </SummaryCard>
      </div>
    </main>
  );
}