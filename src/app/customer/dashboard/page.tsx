"use client";

import Link from "next/link";
import { useQuery } from "convex/react";
import { api } from "@/../convex/_generated/api";

const activeQueueStatuses = ["waiting", "called", "checked_in", "serving"];

function formatDate(timestamp: number) {
  return new Date(timestamp).toLocaleString("en-IN", {
    dateStyle: "medium",
    timeStyle: "short",
  });
}

function titleCase(value: string) {
  return value.replaceAll("_", " ").replace(/\b\w/g, (c) => c.toUpperCase());
}

export default function CustomerDashboardPage() {
  const tokens = useQuery(api.queueCapacity.getMyTokens, {});
  const appointments = useQuery(api.appointments.getMyAppointments, {});

  if (tokens === undefined || appointments === undefined) {
    return <main className="p-6">Loading your dashboard...</main>;
  }

  const activeTokens = tokens.filter((token) =>
    activeQueueStatuses.includes(token.status),
  );

  const upcomingAppointments = appointments
    .filter(
      (appointment) =>
        ["booked", "checked_in"].includes(appointment.status) &&
        appointment.scheduledStart >= Date.now(),
    )
    .sort((a, b) => a.scheduledStart - b.scheduledStart);

  const recentTokens = [...tokens]
    .sort((a, b) => b.joinedAt - a.joinedAt)
    .slice(0, 5);

  const recentAppointments = [...appointments]
    .sort((a, b) => b.createdAt - a.createdAt)
    .slice(0, 5);

  return (
    <main className="mx-auto max-w-6xl space-y-8 p-6">
      <header>
        <p className="text-sm text-gray-500">QuiLess customer account</p>
        <h1 className="text-3xl font-bold">Your dashboard</h1>
        <p className="mt-2 text-gray-600">
          Manage your queues and appointments in one place.
        </p>
      </header>

      <section className="grid gap-4 sm:grid-cols-2">
        <Link
          href="/customer/queue"
          className="rounded-xl border p-5 transition hover:bg-gray-50"
        >
          <p className="text-sm text-gray-500">Active queue tokens</p>
          <p className="mt-2 text-3xl font-semibold">{activeTokens.length}</p>
          <p className="mt-2 text-sm">View your queue activity →</p>
        </Link>

        <Link
          href="/customer/appointments"
          className="rounded-xl border p-5 transition hover:bg-gray-50"
        >
          <p className="text-sm text-gray-500">Upcoming appointments</p>
          <p className="mt-2 text-3xl font-semibold">
            {upcomingAppointments.length}
          </p>
          <p className="mt-2 text-sm">View your appointments →</p>
        </Link>
      </section>

      <section className="space-y-4">
        <div className="flex items-center justify-between gap-4">
          <h2 className="text-xl font-semibold">Active queues</h2>
          <Link href="/customer/queue" className="text-sm underline">
            All queue tokens
          </Link>
        </div>

        {activeTokens.length === 0 ? (
          <div className="rounded-xl border p-5 text-gray-600">
            You have no active queue tokens.
            <p className="mt-2">
              <Link href="/discover" className="underline">
                Discover businesses
              </Link>
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {activeTokens.map((token) => (
              <Link
                key={token._id}
                href={`/customer/queue/${token._id}`}
                className="block rounded-xl border p-4 transition hover:bg-gray-50"
              >
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <p className="font-semibold">
                      Queue token #{token.tokenNumber}
                    </p>
                    <p className="mt-1 text-sm text-gray-500">
                      Joined {formatDate(token.joinedAt)}
                    </p>
                  </div>
                  <span className="rounded-full bg-gray-100 px-3 py-1 text-sm">
                    {titleCase(token.status)}
                  </span>
                </div>
              </Link>
            ))}
          </div>
        )}
      </section>

      <section className="space-y-4">
        <div className="flex items-center justify-between gap-4">
          <h2 className="text-xl font-semibold">Upcoming appointments</h2>
          <Link href="/customer/appointments" className="text-sm underline">
            All appointments
          </Link>
        </div>

        {upcomingAppointments.length === 0 ? (
          <div className="rounded-xl border p-5 text-gray-600">
            You have no upcoming appointments.
            <p className="mt-2">
              <Link href="/discover" className="underline">
                Find a business
              </Link>
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {upcomingAppointments.slice(0, 5).map((appointment) => (
              <Link
                key={appointment._id}
                href={`/customer/appointments/${appointment._id}`}
                className="block rounded-xl border p-4 transition hover:bg-gray-50"
              >
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <p className="font-semibold">Appointment</p>
                    <p className="mt-1 text-sm text-gray-500">
                      {formatDate(appointment.scheduledStart)}
                    </p>
                  </div>
                  <span className="rounded-full bg-gray-100 px-3 py-1 text-sm">
                    {titleCase(appointment.status)}
                  </span>
                </div>
              </Link>
            ))}
          </div>
        )}
      </section>

      <section className="grid gap-6 md:grid-cols-2">
        <div className="space-y-3">
          <h2 className="text-xl font-semibold">Recent queue activity</h2>
          {recentTokens.length === 0 ? (
            <p className="text-sm text-gray-500">No queue history yet.</p>
          ) : (
            recentTokens.map((token) => (
              <Link
                key={token._id}
                href={`/customer/queue/${token._id}`}
                className="block rounded-lg border p-3 hover:bg-gray-50"
              >
                <div className="flex justify-between gap-3">
                  <span>Token #{token.tokenNumber}</span>
                  <span className="text-sm text-gray-500">
                    {titleCase(token.status)}
                  </span>
                </div>
              </Link>
            ))
          )}
        </div>

        <div className="space-y-3">
          <h2 className="text-xl font-semibold">Recent appointments</h2>
          {recentAppointments.length === 0 ? (
            <p className="text-sm text-gray-500">No appointment history yet.</p>
          ) : (
            recentAppointments.map((appointment) => (
              <Link
                key={appointment._id}
                href={`/customer/appointments/${appointment._id}`}
                className="block rounded-lg border p-3 hover:bg-gray-50"
              >
                <div className="flex justify-between gap-3">
                  <span>{formatDate(appointment.scheduledStart)}</span>
                  <span className="text-sm text-gray-500">
                    {titleCase(appointment.status)}
                  </span>
                </div>
              </Link>
            ))
          )}
        </div>
      </section>
    </main>
  );
}
