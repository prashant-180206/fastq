"use client";

import Link from "next/link";
import { use } from "react";
import { useState } from "react";
import { useMutation, useQuery } from "convex/react";
import { api } from "@/../convex/_generated/api";
import type { Id } from "@/../convex/_generated/dataModel";

function todayInIST() {
  return new Date(Date.now() + 330 * 60_000).toISOString().slice(0, 10);
}

function formatTime(timestamp: number) {
  return new Intl.DateTimeFormat("en-IN", {
    timeZone: "Asia/Kolkata",
    hour: "2-digit",
    minute: "2-digit",
  }).format(timestamp);
}

export default function BookAppointmentPage({
  params,
}: {
  params: Promise<{ businessId: string }>;
}) {
  const { businessId } = use(params);
  const id = businessId as Id<"businesses">;

  const [serviceId, setServiceId] = useState("");
  const [date, setDate] = useState(todayInIST());
  const [selectedStart, setSelectedStart] = useState<number | null>(null);
  const [notes, setNotes] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState<{
    appointmentId: Id<"appointments">;
    scheduledStart: number;
    scheduledEnd: number;
  } | null>(null);

  const business = useQuery(api.business.data.getPublicById, {
    businessId: id,
  });

  const services = useQuery(api.business.services.getPublicByBusiness, {
    businessId: id,
  });

  const slots = useQuery(
    api.business.appointments.getAvailableSlots,
    serviceId
      ? {
          businessId: id,
          serviceId: serviceId as Id<"services">,
          date,
        }
      : "skip",
  );

  const book = useMutation(api.business.appointments.book);

  const selectedService = services?.find(
    (service) => service._id === serviceId,
  );

  async function handleBooking() {
    if (!serviceId || selectedStart === null) {
      setError("Choose a service and an available time.");
      return;
    }

    setError("");
    setSuccess(null);

    try {
      const result = await book({
        businessId: id,
        serviceId: serviceId as Id<"services">,
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
    }
  }

  if (business === undefined || services === undefined) {
    return <main className="p-6">Loading booking options...</main>;
  }

  if (!business) {
    return <main className="p-6">Business unavailable.</main>;
  }

  return (
    <main className="mx-auto max-w-3xl space-y-6 p-6">
      <Link
        href={`/b/${businessId}`}
        className="text-sm text-gray-500 hover:underline"
      >
        ← Back to {business.name}
      </Link>

      <header>
        <h1 className="text-3xl font-semibold">Book an appointment</h1>
        <p className="mt-2 text-gray-500">{business.name}</p>
      </header>

      {success && (
        <section className="rounded-xl border border-green-300 p-5">
          <h2 className="font-semibold">Appointment confirmed</h2>
          <p className="mt-2 text-sm text-gray-600">
            {formatTime(success.scheduledStart)} –{" "}
            {formatTime(success.scheduledEnd)}
          </p>
          <p className="mt-2 break-all text-xs text-gray-500">
            Booking ID: {success.appointmentId}
          </p>
          <Link href="/my-day" className="mt-4 inline-block underline">
            View my day →
          </Link>
        </section>
      )}

      <section className="space-y-5 rounded-xl border p-5">
        <label className="grid gap-2">
          <span className="text-sm font-medium">Service</span>
          <select
            value={serviceId}
            onChange={(event) => {
              setServiceId(event.target.value);
              setSelectedStart(null);
              setSuccess(null);
            }}
            className="rounded-lg border px-3 py-2"
          >
            <option value="">Choose a service</option>
            {services
              .filter((service) => service.appointmentsEnabled)
              .map((service) => (
                <option key={service._id} value={service._id}>
                  {service.name} ({service.durationMinutes} min)
                </option>
              ))}
          </select>
        </label>

        <label className="grid gap-2">
          <span className="text-sm font-medium">Appointment date</span>
          <input
            type="date"
            min={todayInIST()}
            value={date}
            onChange={(event) => {
              setDate(event.target.value);
              setSelectedStart(null);
              setSuccess(null);
            }}
            className="rounded-lg border px-3 py-2"
          />
        </label>

        {serviceId && (
          <section className="space-y-3">
            <div>
              <h2 className="font-medium">Available times</h2>
              <p className="mt-1 text-sm text-gray-500">
                Times shown in India Standard Time (IST).
                {selectedService
                  ? ` Duration: ${selectedService.durationMinutes} minutes.`
                  : ""}
              </p>
            </div>

            {slots === undefined ? (
              <p className="text-sm text-gray-500">Checking availability...</p>
            ) : slots.slots.filter((slot) => slot.available).length === 0 ? (
              <p className="rounded-lg bg-gray-50 p-4 text-sm text-gray-600">
                No available slots for this date. Try another day.
              </p>
            ) : (
              <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
                {slots.slots
                  .filter((slot) => slot.available)
                  .map((slot) => (
                    <button
                      type="button"
                      key={slot.scheduledStart}
                      onClick={() => setSelectedStart(slot.scheduledStart)}
                      className={`rounded-lg border px-3 py-3 text-sm ${
                        selectedStart === slot.scheduledStart
                          ? "border-black bg-black text-white"
                          : "hover:bg-gray-50"
                      }`}
                    >
                      {formatTime(slot.scheduledStart)}
                    </button>
                  ))}
              </div>
            )}
          </section>
        )}

        <label className="grid gap-2">
          <span className="text-sm font-medium">Note (optional)</span>
          <textarea
            value={notes}
            onChange={(event) => setNotes(event.target.value)}
            maxLength={1000}
            rows={3}
            placeholder="Anything the business should know?"
            className="resize-y rounded-lg border px-3 py-2"
          />
        </label>

        {error && (
          <p role="alert" className="text-sm text-red-600">
            {error}
          </p>
        )}

        <button
          type="button"
          onClick={handleBooking}
          disabled={!serviceId || selectedStart === null || slots === undefined}
          className="w-full rounded-lg bg-black px-4 py-3 font-medium text-white disabled:cursor-not-allowed disabled:opacity-40"
        >
          Confirm appointment
        </button>
      </section>
    </main>
  );
}
