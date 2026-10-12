"use client";

import Link from "next/link";
import { use, useState } from "react";
import { useQuery } from "convex/react";
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

  const business = useQuery(api.businesses.getById, {
    businessId: id,
  });

  const appointments = useQuery(api.appointments.getByBusiness, {
    businessId: id,
    date: selectedDate,
  });

  const services = useQuery(api.services.getByBusiness, {
    businessId: id,
  });

  if (business === undefined) {
    return <main className="p-6">Loading business...</main>;
  }

  if (business === null) {
    return <main className="p-6">Business not found.</main>;
  }

  const selectedDay = new Date(`${selectedDate}T12:00:00+05:30`);
  const weekday = dayNames[selectedDay.getDay()].toLowerCase();

  const businessDay = business.businessHours?.find(
    (day) => day.day === weekday,
  );

  const serviceName = (serviceId: Id<"services">) =>
    services?.find((service) => service._id === serviceId)?.name ?? "Service";

  const sortedAppointments = [...(appointments ?? [])].sort(
    (a, b) => a.scheduledStart - b.scheduledStart,
  );

  const activeAppointments = sortedAppointments.filter(
    (appointment) =>
      appointment.status === "booked" || appointment.status === "checked_in",
  );

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
          <h1 className="text-3xl font-semibold">Daily schedule</h1>
          <p className="mt-2 text-sm text-gray-500">
            {business.name} · Asia/Kolkata (IST)
          </p>
        </div>

        <Link
          href={`/business/${businessId}/appointments`}
          className="rounded-lg border px-4 py-2 text-sm"
        >
          Manage appointments →
        </Link>
      </header>

      <section className="flex flex-wrap items-end justify-between gap-4 rounded-xl border p-4">
        <label className="grid gap-2 text-sm">
          <span className="font-medium">Schedule date</span>
          <input
            type="date"
            value={selectedDate}
            onChange={(event) => setSelectedDate(event.target.value)}
            className="rounded-lg border px-3 py-2"
          />
        </label>

        <div className="text-sm text-gray-500">
          {activeAppointments.length} active appointment
          {activeAppointments.length === 1 ? "" : "s"}
        </div>
      </section>

      <section className="rounded-xl border p-5">
        <h2 className="font-semibold">Operating hours</h2>

        {!businessDay || !businessDay.isOpen ? (
          <p className="mt-3 text-sm text-gray-500">
            The business is marked closed for this day.
          </p>
        ) : businessDay.slots.length === 0 ? (
          <p className="mt-3 text-sm text-gray-500">
            No operating intervals are configured.
          </p>
        ) : (
          <div className="mt-3 flex flex-wrap gap-2">
            {businessDay.slots.map((slot, index) => (
              <span
                key={`${slot.open}-${slot.close}-${index}`}
                className="rounded-lg border px-3 py-2 text-sm"
              >
                {slot.open} – {slot.close}
              </span>
            ))}
          </div>
        )}

        <Link
          href={`/business/${businessId}/working-hours`}
          className="mt-4 inline-block text-sm underline"
        >
          Edit operating hours →
        </Link>
      </section>

      <section className="space-y-4">
        <div>
          <h2 className="text-xl font-semibold">Appointment timeline</h2>
          <p className="mt-1 text-sm text-gray-500">
            Reservations are ordered by their scheduled start time.
          </p>
        </div>

        {appointments === undefined || services === undefined ? (
          <p className="text-sm text-gray-500">Loading schedule...</p>
        ) : sortedAppointments.length === 0 ? (
          <div className="rounded-xl border p-8 text-center">
            <h3 className="font-medium">No appointments scheduled</h3>
            <p className="mt-2 text-sm text-gray-500">
              No bookings were found for this date.
            </p>
          </div>
        ) : (
          <div className="relative space-y-3">
            {sortedAppointments.map((appointment) => {
              const active =
                appointment.status === "booked" ||
                appointment.status === "checked_in";

              return (
                <article
                  key={appointment._id}
                  className="flex gap-4 rounded-xl border p-4"
                >
                  <div className="w-24 shrink-0">
                    <p className="font-semibold tabular-nums">
                      {formatTime(appointment.scheduledStart)}
                    </p>
                    <p className="mt-1 text-xs text-gray-500">
                      {formatTime(appointment.scheduledEnd)}
                    </p>
                  </div>

                  <div className="min-w-0 flex-1 border-l pl-4">
                    <div className="flex flex-wrap items-center gap-2">
                      <h3 className="font-medium">
                        {serviceName(appointment.serviceId)}
                      </h3>
                      <span className="rounded-full border px-2 py-1 text-xs capitalize">
                        {appointment.status.replace("_", " ")}
                      </span>
                    </div>

                    <p className="mt-1 break-all text-xs text-gray-500">
                      Booking: {appointment._id}
                    </p>

                    {appointment.notes && (
                      <p className="mt-2 text-sm text-gray-600">
                        {appointment.notes}
                      </p>
                    )}

                    {active && (
                      <Link
                        href={`/business/${businessId}/appointments`}
                        className="mt-3 inline-block text-sm underline"
                      >
                        Manage booking →
                      </Link>
                    )}
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </section>
    </main>
  );
}
