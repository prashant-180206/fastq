"use client";

import Link from "next/link";
import { use, useState } from "react";
import { useMutation, useQuery } from "convex/react";
import { api } from "@/../convex/_generated/api";
import type { Id } from "@/../convex/_generated/dataModel";

type PageProps = {
  params: Promise<{ appointmentId: string }>;
};

function formatDate(timestamp?: number) {
  if (timestamp === undefined) return "—";

  return new Date(timestamp).toLocaleString("en-IN", {
    dateStyle: "medium",
    timeStyle: "short",
  });
}

function titleCase(value: string) {
  return value.replaceAll("_", " ").replace(/\b\w/g, (c) => c.toUpperCase());
}

export default function CustomerAppointmentDetailPage({ params }: PageProps) {
  const { appointmentId } = use(params);

  const appointment = useQuery(api.business.appointments.getMyAppointmentById, {
    appointmentId: appointmentId as Id<"appointments">,
  });

  const cancelAppointment = useMutation(api.business.appointments.cancel);

  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  if (appointment === undefined) {
    return <main className="p-6">Loading appointment...</main>;
  }

  if (appointment === null) {
    return (
      <main className="mx-auto max-w-2xl space-y-4 p-6">
        <h1 className="text-2xl font-bold">Appointment not found</h1>
        <p className="text-gray-600">
          This appointment may not exist or may not belong to your account.
        </p>
        <Link href="/customer/appointments" className="underline">
          Return to appointments
        </Link>
      </main>
    );
  }

  const canCancel =
    appointment.status === "booked" && appointment.scheduledStart > Date.now();

  async function handleCancel() {
    if (!window.confirm("Cancel this appointment?")) return;

    setBusy(true);
    setError("");
    setSuccess("");

    try {
      await cancelAppointment({
        appointmentId: appointmentId as Id<"appointments">,
      });
      setSuccess("Appointment cancelled successfully.");
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Unable to cancel the appointment.",
      );
    } finally {
      setBusy(false);
    }
  }

  return (
    <main className="mx-auto max-w-2xl space-y-6 p-6">
      <header>
        <Link href="/customer/appointments" className="text-sm underline">
          ← My appointments
        </Link>

        <h1 className="mt-3 text-3xl font-bold">Appointment details</h1>
        <p className="mt-2 text-gray-600">
          Review your booking and manage its status.
        </p>
      </header>

      <section className="space-y-5 rounded-xl border p-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h2 className="text-lg font-semibold">Booking information</h2>
          <span className="rounded-full bg-gray-100 px-3 py-1 text-sm">
            {titleCase(appointment.status)}
          </span>
        </div>

        <div className="grid gap-5 sm:grid-cols-2">
          <div>
            <p className="text-sm text-gray-500">Appointment starts</p>
            <p className="mt-1 font-medium">
              {formatDate(appointment.scheduledStart)}
            </p>
          </div>

          <div>
            <p className="text-sm text-gray-500">Appointment ends</p>
            <p className="mt-1 font-medium">
              {formatDate(appointment.scheduledEnd)}
            </p>
          </div>

          <div>
            <p className="text-sm text-gray-500">Booked on</p>
            <p className="mt-1">{formatDate(appointment.createdAt)}</p>
          </div>

          <div>
            <p className="text-sm text-gray-500">Last updated</p>
            <p className="mt-1">{formatDate(appointment.updatedAt)}</p>
          </div>
        </div>

        {appointment.notes && (
          <div>
            <p className="text-sm text-gray-500">Your notes</p>
            <p className="mt-1 whitespace-pre-wrap">{appointment.notes}</p>
          </div>
        )}

        <div className="space-y-2 border-t pt-4">
          <p className="text-sm text-gray-500">
            Business ID: {appointment.businessId}
          </p>
          <Link
            href={`/b/${appointment.businessId}`}
            className="inline-block underline"
          >
            View business
          </Link>
        </div>

        {canCancel && (
          <div className="border-t pt-4">
            <button
              type="button"
              disabled={busy}
              onClick={handleCancel}
              className="rounded-lg border border-red-300 px-4 py-2 text-red-700 disabled:opacity-50"
            >
              {busy ? "Cancelling..." : "Cancel appointment"}
            </button>
          </div>
        )}

        {!canCancel && appointment.status !== "cancelled" && (
          <p className="border-t pt-4 text-sm text-gray-500">
            Cancellation is not available for this appointment.
          </p>
        )}

        {success && (
          <p role="status" className="text-sm text-green-700">
            {success}
          </p>
        )}

        {error && (
          <p role="alert" className="text-sm text-red-600">
            {error}
          </p>
        )}
      </section>
    </main>
  );
}
