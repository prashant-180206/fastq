"use client";

import Link from "next/link";
import { use } from "react";
import { useQuery } from "convex/react";
import { api } from "@/../convex/_generated/api";
import type { Id } from "@/../convex/_generated/dataModel";

export default function BusinessDetailPage({
  params,
}: {
  params: Promise<{ businessId: string }>;
}) {
  const { businessId } = use(params);
  const id = businessId as Id<"businesses">;

  const business = useQuery(api.business.data.getById, {
    businessId: id,
  });

  const queues = useQuery(api.business.queue.getByBusiness, {
    businessId: id,
  });

  const services = useQuery(api.business.services.getByBusiness, {
    businessId: id,
  });

  if (business === undefined) {
    return <main className="p-6">Loading business...</main>;
  }

  if (business === null) {
    return <main className="p-6">Business not found.</main>;
  }

  const configuredDays = business.businessHours?.filter(
    (day) => day.isOpen,
  ).length;

  return (
    <main className="mx-auto max-w-4xl space-y-6 p-6">
      <Link href="/business" className="text-sm text-gray-500 hover:underline">
        ← All businesses
      </Link>

      <header>
        <h1 className="text-3xl font-semibold">{business.name}</h1>
        <p className="mt-2 text-sm text-gray-500">
          {business.description || "No description added."}
        </p>
      </header>

      <section className="grid gap-4 sm:grid-cols-2">
        <div className="rounded-xl border p-5">
          <p className="text-sm text-gray-500">Status</p>
          <p className="mt-2 font-medium capitalize">{business.status}</p>
        </div>

        <div className="rounded-xl border p-5">
          <p className="text-sm text-gray-500">Working hours</p>
          <p className="mt-2 font-medium">
            {business.businessHours
              ? `${configuredDays} open days configured`
              : "Not configured"}
          </p>
          <Link
            href={`/business/${business._id}/working-hours`}
            className="mt-3 inline-block text-sm underline"
          >
            Configure working hours →
          </Link>
        </div>

        <div className="rounded-xl border p-5">
          <p className="text-sm text-gray-500">Contact email</p>
          <p className="mt-2">{business.contactEmail || "Not provided"}</p>
        </div>

        <div className="rounded-xl border p-5">
          <p className="text-sm text-gray-500">Phone</p>
          <p className="mt-2">{business.phone || "Not provided"}</p>
        </div>
      </section>

      {/* Services */}
      <section className="space-y-4 rounded-xl border p-5">
        <div className="flex items-center justify-between gap-3">
          <div>
            <h2 className="font-semibold">Services</h2>
            <p className="mt-1 text-sm text-gray-500">
              Configure service duration and booking methods.
            </p>
          </div>

          <Link
            href={`/business/${business._id}/services`}
            className="shrink-0 rounded-lg bg-black px-4 py-2 text-sm text-white"
          >
            Manage services
          </Link>
        </div>

        {services === undefined ? (
          <p className="text-sm text-gray-500">Loading services...</p>
        ) : services.length === 0 ? (
          <p className="rounded-lg bg-gray-50 p-4 text-sm text-gray-500">
            No services created yet. Add a service before assigning it to queues
            or enabling appointments.
          </p>
        ) : (
          <div className="divide-y">
            {services.map((service) => (
              <div
                key={service._id}
                className="flex flex-wrap items-center justify-between gap-3 py-4"
              >
                <div>
                  <h3 className="font-medium">{service.name}</h3>
                  <p className="mt-1 text-sm text-gray-500">
                    {service.description || "No description"}
                  </p>
                  <p className="mt-1 text-sm text-gray-500">
                    {service.durationMinutes} minutes per customer
                  </p>
                  <div className="mt-2 flex flex-wrap gap-2 text-xs">
                    {service.queueEnabled && (
                      <span className="rounded-full border px-2 py-1">
                        Queue enabled
                      </span>
                    )}
                    {service.appointmentsEnabled && (
                      <span className="rounded-full border px-2 py-1">
                        Appointments enabled
                      </span>
                    )}
                    {!service.queueEnabled && !service.appointmentsEnabled && (
                      <span className="rounded-full border px-2 py-1">
                        No booking method
                      </span>
                    )}
                  </div>
                </div>

                <span className="rounded-full border px-3 py-1 text-xs">
                  {service.isActive ? "Active" : "Inactive"}
                </span>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* Queues */}
      <section className="space-y-4 rounded-xl border p-5">
        <div className="flex items-center justify-between gap-3">
          <div>
            <h2 className="font-semibold">Queues</h2>
            <p className="mt-1 text-sm text-gray-500">
              Manage waiting lines and customer prerequisites.
            </p>
          </div>

          <Link
            href={`/business/${business._id}/queues`}
            className="shrink-0 rounded-lg border px-4 py-2 text-sm"
          >
            Manage queues
          </Link>
        </div>

        {queues === undefined ? (
          <p className="text-sm text-gray-500">Loading queues...</p>
        ) : queues.length === 0 ? (
          <p className="rounded-lg bg-gray-50 p-4 text-sm text-gray-500">
            No queues created yet.
          </p>
        ) : (
          <div className="divide-y">
            {queues.map((queue) => (
              <div
                key={queue._id}
                className="flex items-center justify-between gap-3 py-4"
              >
                <div>
                  <h3 className="font-medium">{queue.name}</h3>
                  <p className="mt-1 text-sm text-gray-500">
                    {queue.description}
                  </p>
                  <p className="mt-1 text-xs text-gray-500">
                    {queue.prerequisites.length} prerequisites
                  </p>
                </div>

                <span className="rounded-full border px-3 py-1 text-xs capitalize">
                  {queue.status}
                </span>
              </div>
            ))}
          </div>
        )}
      </section>

      <section className="rounded-xl border p-5">
        <h2 className="font-semibold">Business settings</h2>
        <p className="mt-1 text-sm text-gray-500">
          Configure your regular operating schedule.
        </p>
        <Link
          href={`/business/${business._id}/working-hours`}
          className="mt-4 inline-block rounded-lg border px-4 py-2 text-sm"
        >
          Manage working hours
        </Link>
      </section>

      {/* Appointments and schedule */}
      <section className="grid gap-4 sm:grid-cols-2">
        <Link
          href={`/business/${business._id}/appointments`}
          className="rounded-xl border p-5 transition hover:bg-gray-50"
        >
          <h2 className="font-semibold">Appointments →</h2>
          <p className="mt-2 text-sm text-gray-500">
            View bookings, check customers in, and manage visit statuses.
          </p>
        </Link>

        <Link
          href={`/business/${business._id}/schedule`}
          className="rounded-xl border p-5 transition hover:bg-gray-50"
        >
          <h2 className="font-semibold">Daily schedule →</h2>
          <p className="mt-2 text-sm text-gray-500">
            Review operating hours and the day's appointment timeline.
          </p>
        </Link>
      </section>
    </main>
  );
}
