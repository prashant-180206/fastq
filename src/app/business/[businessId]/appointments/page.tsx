"use client";

import Link from "next/link";
import { use, useState } from "react";
import { useMutation, useQuery } from "convex/react";
import { api } from "@/../convex/_generated/api";
import type { Id } from "@/../convex/_generated/dataModel";

function todayInIST() {
  return new Date(Date.now() + 5.5 * 60 * 60 * 1000).toISOString().slice(0, 10);
}

function formatTime(timestamp: number) {
  return new Intl.DateTimeFormat("en-IN", {
    timeZone: "Asia/Kolkata",
    hour: "2-digit",
    minute: "2-digit",
  }).format(timestamp);
}

function formatDate(timestamp: number) {
  return new Intl.DateTimeFormat("en-IN", {
    timeZone: "Asia/Kolkata",
    day: "numeric",
    month: "short",
    year: "numeric",
  }).format(timestamp);
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
  const [error, setError] = useState("");
  const [busyId, setBusyId] = useState<string | null>(null);

  const appointments = useQuery(api.appointments.getByBusiness, {
    businessId: id,
    date: selectedDate,
  });

  const services = useQuery(api.services.getByBusiness, {
    businessId: id,
  });

  const checkIn = useMutation(api.appointments.checkIn);
  const complete = useMutation(api.appointments.complete);
  const markNoShow = useMutation(api.appointments.markNoShow);

  const serviceName = (serviceId: Id<"services">) =>
    services?.find((service) => service._id === serviceId)?.name ?? "Service";

  async function runAction(
    appointmentId: Id<"appointments">,
    action: "checkIn" | "complete" | "noShow",
  ) {
    setError("");
    setBusyId(appointmentId);

    try {
      if (action === "checkIn") {
        await checkIn({ appointmentId });
      } else if (action === "complete") {
        await complete({ appointmentId });
      } else {
        await markNoShow({ appointmentId });
      }
    } catch (error) {
      setError(
        error instanceof Error
          ? error.message
          : "The appointment could not be updated.",
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
    <main className="mx-auto max-w-6xl space-y-6 p-6">
      <Link
        href={`/business/${businessId}`}
        className="text-sm text-gray-500 hover:underline"
      >
        ← Back to business
      </Link>

      <header className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-3xl font-semibold">Appointments</h1>
          <p className="mt-2 text-sm text-gray-500">
            Review bookings and manage customer visits.
          </p>
        </div>

        <Link
          href={`/business/${businessId}/schedule`}
          className="rounded-lg border px-4 py-2 text-sm"
        >
          View schedule →
        </Link>
      </header>

      <section className="grid gap-4 sm:grid-cols-3">
        <div className="rounded-xl border p-4">
          <p className="text-sm text-gray-500">Booked</p>
          <p className="mt-2 text-2xl font-semibold">{bookedCount}</p>
        </div>

        <div className="rounded-xl border p-4">
          <p className="text-sm text-gray-500">Checked in</p>
          <p className="mt-2 text-2xl font-semibold">{checkedInCount}</p>
        </div>

        <div className="rounded-xl border p-4">
          <p className="text-sm text-gray-500">Completed</p>
          <p className="mt-2 text-2xl font-semibold">{completedCount}</p>
        </div>
      </section>

      <section className="flex flex-wrap items-end gap-4 rounded-xl border p-4">
        <label className="grid gap-2 text-sm">
          <span className="font-medium">Appointment date</span>
          <input
            type="date"
            value={selectedDate}
            onChange={(event) => setSelectedDate(event.target.value)}
            className="rounded-lg border px-3 py-2"
          />
        </label>

        <label className="grid gap-2 text-sm">
          <span className="font-medium">Status</span>
          <select
            value={statusFilter}
            onChange={(event) => setStatusFilter(event.target.value)}
            className="rounded-lg border px-3 py-2"
          >
            <option value="all">All statuses</option>
            <option value="booked">Booked</option>
            <option value="checked_in">Checked in</option>
            <option value="completed">Completed</option>
            <option value="cancelled">Cancelled</option>
            <option value="no_show">No-show</option>
          </select>
        </label>
      </section>

      {error && (
        <div
          role="alert"
          className="rounded-lg border border-red-300 bg-red-50 p-3 text-sm text-red-700"
        >
          {error}
        </div>
      )}

      {appointments === undefined || services === undefined ? (
        <p className="text-sm text-gray-500">Loading appointments...</p>
      ) : filteredAppointments.length === 0 ? (
        <div className="rounded-xl border p-8 text-center">
          <h2 className="font-medium">No appointments found</h2>
          <p className="mt-2 text-sm text-gray-500">
            Try another date or status filter.
          </p>
        </div>
      ) : (
        <section className="space-y-3">
          {filteredAppointments.map((appointment) => (
            <article
              key={appointment._id}
              className="flex flex-col gap-4 rounded-xl border p-5 sm:flex-row sm:items-center sm:justify-between"
            >
              <div className="space-y-2">
                <div className="flex flex-wrap items-center gap-2">
                  <h2 className="font-semibold">
                    {serviceName(appointment.serviceId)}
                  </h2>

                  <span className="rounded-full border px-2.5 py-1 text-xs capitalize">
                    {appointment.status.replace("_", " ")}
                  </span>
                </div>

                <p className="text-sm text-gray-600">
                  {formatTime(appointment.scheduledStart)} –{" "}
                  {formatTime(appointment.scheduledEnd)}
                  {" · "}
                  {formatDate(appointment.scheduledStart)}
                </p>

                <p className="text-xs text-gray-500">
                  Booking ID: {appointment._id}
                </p>

                {appointment.notes && (
                  <p className="text-sm text-gray-600">
                    Note: {appointment.notes}
                  </p>
                )}
              </div>

              <div className="flex flex-wrap gap-2">
                {appointment.status === "booked" && (
                  <>
                    <button
                      type="button"
                      disabled={busyId === appointment._id}
                      onClick={() => runAction(appointment._id, "checkIn")}
                      className="rounded-lg bg-black px-3 py-2 text-sm text-white disabled:opacity-50"
                    >
                      {busyId === appointment._id ? "Updating..." : "Check in"}
                    </button>

                    <button
                      type="button"
                      disabled={busyId === appointment._id}
                      onClick={() => runAction(appointment._id, "noShow")}
                      className="rounded-lg border px-3 py-2 text-sm disabled:opacity-50"
                    >
                      Mark no-show
                    </button>
                  </>
                )}

                {appointment.status === "checked_in" && (
                  <button
                    type="button"
                    disabled={busyId === appointment._id}
                    onClick={() => runAction(appointment._id, "complete")}
                    className="rounded-lg bg-black px-3 py-2 text-sm text-white disabled:opacity-50"
                  >
                    {busyId === appointment._id
                      ? "Updating..."
                      : "Complete visit"}
                  </button>
                )}
              </div>
            </article>
          ))}
        </section>
      )}
    </main>
  );
}
