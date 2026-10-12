"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useQuery } from "convex/react";
import { api } from "@/../convex/_generated/api";
import type { Id } from "@/../convex/_generated/dataModel";

const dayNames: Record<string, string> = {
  monday: "Monday",
  tuesday: "Tuesday",
  wednesday: "Wednesday",
  thursday: "Thursday",
  friday: "Friday",
  saturday: "Saturday",
  sunday: "Sunday",
};

function getTodaySchedule(
  businessHours:
    | {
        day: string;
        isOpen: boolean;
        slots: { open: string; close: string }[];
      }[]
    | undefined,
) {
  const now = new Date(Date.now() + 330 * 60_000);
  const weekday = [
    "sunday",
    "monday",
    "tuesday",
    "wednesday",
    "thursday",
    "friday",
    "saturday",
  ][now.getUTCDay()];

  const day = businessHours?.find((item) => item.day === weekday);

  const currentMinutes = now.getUTCHours() * 60 + now.getUTCMinutes();

  const isOpenNow =
    Boolean(day?.isOpen) &&
    Boolean(
      day?.slots.some((slot) => {
        const [openHour, openMinute] = slot.open.split(":").map(Number);
        const [closeHour, closeMinute] = slot.close.split(":").map(Number);

        const open = openHour * 60 + openMinute;
        const close = closeHour * 60 + closeMinute;

        return currentMinutes >= open && currentMinutes < close;
      }),
    );

  return {
    day,
    isOpenNow,
    currentMinutes,
  };
}

export default function PublicBusinessPage() {
  const params = useParams<{ businessId: string }>();
  const businessId = params.businessId as Id<"businesses">;

  const business = useQuery(api.business.data.getPublicById, {
    businessId,
  });

  const services = useQuery(api.business.services.getPublicByBusiness, {
    businessId,
  });

  const queues = useQuery(api.business.queue.getPublicByBusiness, {
    businessId,
  });

  if (
    business === undefined ||
    services === undefined ||
    queues === undefined
  ) {
    return (
      <main className="mx-auto max-w-5xl px-4 py-12">
        <p className="text-sm text-gray-500">Loading business details...</p>
      </main>
    );
  }

  if (!business) {
    return (
      <main className="mx-auto max-w-5xl px-4 py-12">
        <h1 className="text-2xl font-semibold">Business unavailable</h1>
        <p className="mt-2 text-gray-600">
          This business may not exist or may no longer be available.
        </p>
        <Link href="/discover" className="mt-5 inline-block underline">
          Browse businesses
        </Link>
      </main>
    );
  }

  const todaySchedule = getTodaySchedule(business.businessHours);

  const todayLabel = new Intl.DateTimeFormat("en-IN", {
    timeZone: "Asia/Kolkata",
    weekday: "long",
    day: "numeric",
    month: "long",
  }).format(new Date());

  return (
    <main className="mx-auto max-w-5xl space-y-10 px-4 py-8">
      <Link
        href="/discover"
        className="text-sm text-gray-500 hover:text-gray-900"
      >
        ← Back to discovery
      </Link>

      {/* Business profile */}
      <section className="flex flex-col gap-5 rounded-2xl border p-6 sm:flex-row sm:items-start">
        {business.logoUrl ? (
          <img
            src={business.logoUrl}
            alt={`${business.name} logo`}
            className="h-24 w-24 rounded-xl border object-cover"
          />
        ) : (
          <div className="flex h-24 w-24 shrink-0 items-center justify-center rounded-xl bg-gray-100 text-3xl font-semibold text-gray-500">
            {business.name.charAt(0).toUpperCase()}
          </div>
        )}

        <div className="min-w-0 flex-1">
          <h1 className="text-3xl font-bold tracking-tight">{business.name}</h1>

          {business.description && (
            <p className="mt-3 whitespace-pre-wrap text-gray-600">
              {business.description}
            </p>
          )}

          <div className="mt-4 flex flex-wrap gap-3 text-sm text-gray-600">
            {business.phone && (
              <a
                href={`tel:${business.phone}`}
                className="underline underline-offset-4"
              >
                Call business
              </a>
            )}

            {business.contactEmail && (
              <a
                href={`mailto:${business.contactEmail}`}
                className="underline underline-offset-4"
              >
                Email business
              </a>
            )}
          </div>
        </div>
      </section>

      {/* Operating hours */}
      <section className="space-y-4">
        <div>
          <h2 className="text-xl font-semibold">Operating hours</h2>
          <p className="mt-1 text-sm text-gray-500">
            Check the business schedule before visiting.
          </p>
        </div>

        {!business.businessHours?.length ? (
          <div className="rounded-xl border p-4 text-sm text-gray-600">
            Operating hours have not been published yet.
          </div>
        ) : (
          <div className="divide-y rounded-xl border">
            {business.businessHours.map((day) => (
              <div
                key={day.day}
                className="flex flex-col gap-2 px-4 py-3 sm:flex-row sm:items-start sm:justify-between"
              >
                <span className="font-medium">
                  {dayNames[day.day] ?? day.day}
                </span>

                <div className="text-sm text-gray-600 sm:text-right">
                  {!day.isOpen || day.slots.length === 0 ? (
                    <span>Closed</span>
                  ) : (
                    day.slots.map((slot, index) => (
                      <div key={`${slot.open}-${slot.close}-${index}`}>
                        {slot.open} – {slot.close}
                      </div>
                    ))
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* Services */}
      <section className="space-y-4">
        <div>
          <h2 className="text-xl font-semibold">Available services</h2>
          <p className="mt-1 text-sm text-gray-500">
            Choose a service to see the available ways to book.
          </p>
        </div>

        {services.length === 0 ? (
          <div className="rounded-xl border p-6 text-sm text-gray-600">
            No services are currently available.
          </div>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2">
            {services.map((service) => {
              const serviceQueues = queues.filter(
                (queue) => queue.serviceId === service._id,
              );

              return (
                <article
                  key={service._id}
                  className="flex flex-col rounded-xl border p-5"
                >
                  <div className="flex-1">
                    <h3 className="text-lg font-semibold">{service.name}</h3>

                    {service.description && (
                      <p className="mt-2 text-sm text-gray-600">
                        {service.description}
                      </p>
                    )}

                    <p className="mt-3 text-sm text-gray-500">
                      Estimated service duration: {service.durationMinutes}{" "}
                      minutes
                    </p>
                  </div>

                  <div className="mt-5 flex flex-wrap gap-2">
                    {service.queueEnabled &&
                      (serviceQueues.length > 0 ? (
                        <Link
                          href={`/b/${businessId}/queue?serviceId=${service._id}`}
                          className="rounded-lg border px-4 py-2 text-sm font-medium hover:bg-gray-50"
                        >
                          Join a queue
                        </Link>
                      ) : (
                        <span className="rounded-lg border px-4 py-2 text-sm text-gray-500">
                          No active queue
                        </span>
                      ))}

                    {service.appointmentsEnabled && (
                      <Link
                        href={`/b/${businessId}/book?serviceId=${service._id}`}
                        className="rounded-lg bg-black px-4 py-2 text-sm font-medium text-white hover:bg-gray-800"
                      >
                        Book appointment
                      </Link>
                    )}
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </section>

      {/* Today's business schedule */}
      <section className="rounded-2xl border p-5">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <p className="text-sm text-gray-500">{todayLabel}</p>
            <h2 className="mt-1 text-xl font-semibold">Today's schedule</h2>
          </div>

          <span
            className={`rounded-full border px-3 py-1 text-sm ${
              todaySchedule.isOpenNow
                ? "border-green-300 text-green-700"
                : "text-gray-600"
            }`}
          >
            {todaySchedule.isOpenNow ? "Open now" : "Not currently open"}
          </span>
        </div>

        {!todaySchedule.day ? (
          <p className="mt-4 text-sm text-gray-500">
            Today's hours have not been configured.
          </p>
        ) : !todaySchedule.day.isOpen ||
          todaySchedule.day.slots.length === 0 ? (
          <p className="mt-4 text-sm text-gray-600">
            This business is scheduled to be closed today.
          </p>
        ) : (
          <div className="mt-4 space-y-3">
            {todaySchedule.day.slots.map((slot, index) => (
              <div
                key={`${slot.open}-${slot.close}-${index}`}
                className="flex items-center justify-between rounded-lg bg-gray-50 px-4 py-3"
              >
                <span className="text-sm text-gray-600">
                  {index === 0 ? "Operating hours" : `Session ${index + 1}`}
                </span>

                <span className="font-medium tabular-nums">
                  {slot.open} – {slot.close}
                </span>
              </div>
            ))}
          </div>
        )}

        <p className="mt-3 text-xs text-gray-500">
          Times shown in India Standard Time (IST). This reflects the configured
          schedule, not live staff availability.
        </p>
      </section>

      {/* Active queues */}
      <section className="space-y-4">
        <div>
          <h2 className="text-xl font-semibold">Active queues</h2>
          <p className="mt-1 text-sm text-gray-500">
            Select a queue to continue.
          </p>
        </div>

        {queues.length === 0 ? (
          <div className="rounded-xl border p-5 text-sm text-gray-600">
            There are no active queues right now.
          </div>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2">
            {queues.map((queue) => {
              const service = services.find(
                (item) => item._id === queue.serviceId,
              );

              return (
                <article key={queue._id} className="rounded-xl border p-5">
                  <h3 className="font-semibold">{queue.name}</h3>

                  {queue.description && (
                    <p className="mt-2 text-sm text-gray-600">
                      {queue.description}
                    </p>
                  )}

                  {service && (
                    <p className="mt-2 text-sm text-gray-500">
                      Service: {service.name}
                    </p>
                  )}

                  <Link
                    href={`/b/${businessId}/queue?queueId=${queue._id}`}
                    className="mt-4 inline-block rounded-lg bg-black px-4 py-2 text-sm font-medium text-white hover:bg-gray-800"
                  >
                    View queue
                  </Link>
                </article>
              );
            })}
          </div>
        )}
      </section>

      {/* Customer actions */}
      <section className="grid gap-3 sm:grid-cols-2">
        <Link
          href={`/b/${businessId}/book`}
          className="rounded-xl bg-black p-5 text-white transition hover:bg-gray-800"
        >
          <h2 className="font-semibold">Book an appointment →</h2>
          <p className="mt-2 text-sm text-gray-300">
            Choose a service, date, and available time.
          </p>
        </Link>

        <Link
          href={`/b/${businessId}/queue`}
          className="rounded-xl border p-5 transition hover:bg-gray-50"
        >
          <h2 className="font-semibold">Join a queue →</h2>
          <p className="mt-2 text-sm text-gray-500">
            Join an active queue and receive your token.
          </p>
        </Link>
      </section>
    </main>
  );
}
