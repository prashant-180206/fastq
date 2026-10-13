"use client";

import Link from "next/link";
import { use, useState } from "react";
import { useMutation, useQuery } from "convex/react";
import { api } from "@/../convex/_generated/api";
import type { Id } from "@/../convex/_generated/dataModel";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogMedia,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty";
import { Skeleton } from "@/components/ui/skeleton";
import { Spinner } from "@/components/ui/spinner";
import { formatDateTimeIST } from "@/lib/format";
import { notifyError, notifySuccess } from "@/lib/toast";
import { PageHeader } from "@/components/customer/page-header";
import { useNow } from "@/hooks/use-now";
import { Calendar02Icon, Cancel01Icon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import { cn } from "cn";

type PageProps = {
  params: Promise<{ appointmentId: string }>;
};

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

function DetailRow({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <div>
      <p className="text-sm text-muted-foreground">{label}</p>
      <p className="mt-1 font-medium">{value}</p>
    </div>
  );
}

export default function CustomerAppointmentDetailPage({ params }: PageProps) {
  const { appointmentId } = use(params);
  const appointmentIdRef = appointmentId as Id<"appointments">;
  const now = useNow();

  const appointment = useQuery(
    api.business.appointments.getMyAppointmentById,
    { appointmentId: appointmentIdRef },
  );
  const businesses = useQuery(api.business.data.getAll, {});

  const cancelAppointment = useMutation(api.business.appointments.cancel);

  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [confirmOpen, setConfirmOpen] = useState(false);

  async function handleCancel() {
    setBusy(true);
    setError("");

    try {
      await cancelAppointment({ appointmentId: appointmentIdRef });
      notifySuccess("Appointment cancelled");
      setConfirmOpen(false);
    } catch (err) {
      const message =
        err instanceof Error
          ? err.message
          : "Unable to cancel the appointment.";
      setError(message);
      notifyError(message);
      setConfirmOpen(false);
    } finally {
      setBusy(false);
    }
  }

  if (appointment === undefined) {
    return (
      <div className="flex flex-col gap-6">
        <PageHeader
          title="Appointment details"
          subtitle="Loading your booking…"
          backHref="/customer/appointments"
          backLabel="My appointments"
        />
        <Card>
          <CardContent className="gap-3">
            <Skeleton className="h-6 w-40 rounded-full" />
            <div className="grid gap-4 sm:grid-cols-2">
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-full" />
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (appointment === null) {
    return (
      <div className="flex flex-col gap-6">
        <Empty>
          <EmptyContent>
            <EmptyMedia variant="icon">
              <HugeiconsIcon icon={Calendar02Icon} strokeWidth={2} />
            </EmptyMedia>
            <EmptyTitle>Appointment not found</EmptyTitle>
            <EmptyDescription>
              This appointment may not exist or may not belong to your account.
            </EmptyDescription>
          </EmptyContent>
          <Link
            href="/customer/appointments"
            className={cn(buttonVariants({ size: "sm" }))}
          >
            Return to appointments
          </Link>
        </Empty>
      </div>
    );
  }

  const business = businesses?.find(
    (entry) => entry._id === appointment.businessId,
  );
  const canCancel =
    appointment.status === "booked" && appointment.scheduledStart > now;

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Appointment details"
        subtitle="Review your booking and manage its status."
        backHref="/customer/appointments"
        backLabel="My appointments"
      />

      <Card>
        <CardContent className="flex flex-col gap-5">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <h2 className="font-heading text-lg font-bold tracking-tight">
              {business ? business.name : "Booking information"}
            </h2>
            <Badge
              variant={statusVariant(appointment.status)}
              className="h-6 rounded-full capitalize"
            >
              {titleCase(appointment.status)}
            </Badge>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <DetailRow
              label="Appointment starts"
              value={formatDateTimeIST(appointment.scheduledStart)}
            />
            <DetailRow
              label="Appointment ends"
              value={formatDateTimeIST(appointment.scheduledEnd)}
            />
            <DetailRow
              label="Booked on"
              value={formatDateTimeIST(appointment.createdAt)}
            />
            <DetailRow
              label="Last updated"
              value={formatDateTimeIST(appointment.updatedAt)}
            />
          </div>

          {appointment.notes ? (
            <div>
              <p className="text-sm text-muted-foreground">Your notes</p>
              <p className="mt-1 whitespace-pre-wrap">{appointment.notes}</p>
            </div>
          ) : null}

          {business && (
            <div className="flex flex-wrap items-center justify-between gap-3 rounded-lg border p-3">
              <span className="text-sm text-muted-foreground">Business</span>
              <Link
                href={`/b/${business._id}`}
                className={cn(
                  buttonVariants({ variant: "outline", size: "sm" }),
                )}
              >
                View business
              </Link>
            </div>
          )}

          {canCancel ? (
            <div className="flex flex-wrap gap-3 border-t pt-4">
              <Button
                type="button"
                variant="destructive"
                disabled={busy}
                onClick={() => setConfirmOpen(true)}
              >
                {busy ? (
                  <>
                    <Spinner />
                    Cancelling…
                  </>
                ) : (
                  <>
                    <HugeiconsIcon
                      icon={Cancel01Icon}
                      strokeWidth={2}
                      data-icon="inline-start"
                    />
                    Cancel appointment
                  </>
                )}
              </Button>
            </div>
          ) : appointment.status !== "cancelled" ? (
            <p className="border-t pt-4 text-sm text-muted-foreground">
              Cancellation is not available for this appointment.
            </p>
          ) : null}

          {error && (
            <p role="alert" className="text-sm text-destructive">
              {error}
            </p>
          )}
        </CardContent>
      </Card>

      <AlertDialog
        open={confirmOpen}
        onOpenChange={(open) => {
          if (!open) {
            setConfirmOpen(false);
          }
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogMedia>
              <HugeiconsIcon icon={Cancel01Icon} strokeWidth={2} />
            </AlertDialogMedia>
            <AlertDialogTitle>Cancel this appointment?</AlertDialogTitle>
            <AlertDialogDescription>
              Your booking will be cancelled. You can book a new time whenever
              you are ready.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Keep appointment</AlertDialogCancel>
            <AlertDialogAction variant="destructive" onClick={handleCancel}>
              Cancel appointment
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}