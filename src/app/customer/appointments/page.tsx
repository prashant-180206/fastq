"use client";

import Link from "next/link";
import { useQuery } from "convex/react";
import { api } from "@/../convex/_generated/api";

function formatDate(timestamp: number) {
  return new Date(timestamp).toLocaleString("en-IN", {
    dateStyle: "medium",
    timeStyle: "short",
  });
}

function titleCase(value: string) {
  return value.replaceAll("_", " ").replace(/\b\w/g, (c) => c.toUpperCase());
}

export default function CustomerAppointmentsPage() {
  const appointments = useQuery(api.business.appointments.getMyAppointments, {});

  if (appointments === undefined) {
    return <main className="p-6">Loading appointments...</main>;
  }

  const now = Date.now();

  const upcoming = appointments
    .filter(
      (appointment) =>
        ["booked", "checked_in"].includes(appointment.status) &&
        appointment.scheduledStart >= now,
    )
    .sort((a, b) => a.scheduledStart - b.scheduledStart);

  const past = appointments
    .filter(
      (appointment) =>
        !(
          ["booked", "checked_in"].includes(appointment.status) &&
          appointment.scheduledStart >= now
        ),
    )
    .sort((a, b) => b.scheduledStart - a.scheduledStart);

  function renderAppointment(appointment: NonNullable<typeof appointments>[number]) {
    return (
      <Link
        key={appointment._id}
        href={`/customer/appointments/${appointment._id}`}
        className="block rounded-xl border p-5 transition hover:bg-gray-50"
      >
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <h3 className="font-semibold">Appointment</h3>
            <p className="mt-1 text-sm text-gray-600">
              {formatDate(appointment.scheduledStart)}
            </p>
            <p className="mt-1 text-xs text-gray-500">
              Business ID: {appointment.businessId}
            </p>
          </div>

          <span className="rounded-full bg-gray-100 px-3 py-1 text-sm">
            {titleCase(appointment.status)}
          </span>
        </div>
      </Link>
    );
  }

  return (
    <main className="mx-auto max-w-5xl space-y-8 p-6">
      <header>
        <Link href="/customer/dashboard" className="text-sm underline">
          ← Dashboard
        </Link>
        <h1 className="mt-3 text-3xl font-bold">My appointments</h1>
        <p className="mt-2 text-gray-600">
          Review upcoming bookings and your appointment history.
        </p>
      </header>

      <section className="space-y-4">
        <h2 className="text-xl font-semibold">Upcoming ({upcoming.length})</h2>

        {upcoming.length === 0 ? (
          <div className="rounded-xl border p-5">
            <p>You have no upcoming appointments.</p>
            <Link href="/discover" className="mt-3 inline-block underline">
              Discover businesses
            </Link>
          </div>
        ) : (
          <div className="space-y-3">{upcoming.map(renderAppointment)}</div>
        )}
      </section>

      <section className="space-y-4">
        <h2 className="text-xl font-semibold">History ({past.length})</h2>

        {past.length === 0 ? (
          <p className="text-gray-500">
            Your past appointments will appear here.
          </p>
        ) : (
          <div className="space-y-3">{past.map(renderAppointment)}</div>
        )}
      </section>
    </main>
  );
}
