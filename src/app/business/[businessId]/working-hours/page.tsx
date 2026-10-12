"use client";

import { use, useEffect, useState } from "react";
import Link from "next/link";
import { useMutation, useQuery } from "convex/react";
import { api } from "@/../convex/_generated/api";
import type { Id } from "@/../convex/_generated/dataModel";

const DAYS = [
  "monday",
  "tuesday",
  "wednesday",
  "thursday",
  "friday",
  "saturday",
  "sunday",
] as const;

type DayName = (typeof DAYS)[number];

type TimeSlot = {
  open: string;
  close: string;
};

type BusinessDay = {
  day: DayName;
  isOpen: boolean;
  slots: TimeSlot[];
};

function defaultHours(): BusinessDay[] {
  return DAYS.map((day) => ({
    day,
    isOpen: false,
    slots: [],
  }));
}

export default function WorkingHoursPage({
  params,
}: {
  params: Promise<{ businessId: string }>;
}) {
  const { businessId } = use(params);

  const business = useQuery(api.businesses.getById, {
    businessId: businessId as Id<"businesses">,
  });

  const saveHours = useMutation(api.businesses.updateBusinessHours);

  const [hours, setHours] = useState<BusinessDay[]>(defaultHours);
  const [initialized, setInitialized] = useState(false);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");

  useEffect(() => {
    if (business === undefined || initialized) return;

    const existing = business?.businessHours ?? [];

    setHours(
      DAYS.map((day) => {
        const saved = existing.find((item) => item.day === day);

        return saved
          ? {
              day,
              isOpen: saved.isOpen,
              slots: saved.slots.map((slot) => ({
                open: slot.open,
                close: slot.close,
              })),
            }
          : { day, isOpen: false, slots: [] };
      })
    );

    setInitialized(true);
  }, [business, initialized]);

  function updateDay(
    day: DayName,
    updater: (current: BusinessDay) => BusinessDay
  ) {
    setHours((current) =>
      current.map((item) =>
        item.day === day ? updater(item) : item
      )
    );
  }

  function toggleDay(day: DayName, isOpen: boolean) {
    updateDay(day, (current) => ({
      ...current,
      isOpen,
      slots: isOpen
        ? current.slots.length
          ? current.slots
          : [{ open: "09:00", close: "17:00" }]
        : [],
    }));
  }

  function updateSlot(
    day: DayName,
    index: number,
    field: keyof TimeSlot,
    value: string
  ) {
    updateDay(day, (current) => ({
      ...current,
      slots: current.slots.map((slot, i) =>
        i === index ? { ...slot, [field]: value } : slot
      ),
    }));
  }

  function addSlot(day: DayName) {
    updateDay(day, (current) => ({
      ...current,
      slots: [
        ...current.slots,
        { open: "09:00", close: "17:00" },
      ],
    }));
  }

  function removeSlot(day: DayName, index: number) {
    updateDay(day, (current) => ({
      ...current,
      slots: current.slots.filter((_, i) => i !== index),
    }));
  }

  async function handleSave() {
    setMessage("");
    setSaving(true);

    try {
      await saveHours({
        businessId: businessId as Id<"businesses">,
        businessHours: hours,
      });

      setMessage("Working hours saved successfully.");
    } catch (error) {
      setMessage(
        error instanceof Error
          ? error.message
          : "Could not save working hours."
      );
    } finally {
      setSaving(false);
    }
  }

  if (business === undefined || !initialized) {
    return <main className="p-6">Loading working hours...</main>;
  }

  if (business === null) {
    return <main className="p-6">Business not found.</main>;
  }

  return (
    <main className="mx-auto max-w-3xl space-y-6 p-6">
      <Link
        href={`/business/${businessId}`}
        className="text-sm text-gray-500 hover:underline"
      >
        ← Back to {business.name}
      </Link>

      <header>
        <h1 className="text-2xl font-semibold">Working hours</h1>
        <p className="mt-1 text-sm text-gray-500">
          Set opening hours for each day. Add multiple slots for
          split shifts.
        </p>
      </header>

      <div className="space-y-4">
        {hours.map((day) => (
          <section
            key={day.day}
            className="space-y-4 rounded-xl border p-4"
          >
            <div className="flex items-center justify-between gap-4">
              <h2 className="font-medium capitalize">{day.day}</h2>

              <label className="flex items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  checked={day.isOpen}
                  onChange={(event) =>
                    toggleDay(day.day, event.target.checked)
                  }
                />
                Open
              </label>
            </div>

            {!day.isOpen ? (
              <p className="text-sm text-gray-500">Closed</p>
            ) : (
              <div className="space-y-3">
                {day.slots.map((slot, index) => (
                  <div
                    key={index}
                    className="flex flex-wrap items-end gap-3"
                  >
                    <label className="flex-1 space-y-1">
                      <span className="text-xs text-gray-500">
                        Opens
                      </span>
                      <input
                        type="time"
                        required
                        value={slot.open}
                        onChange={(event) =>
                          updateSlot(
                            day.day,
                            index,
                            "open",
                            event.target.value
                          )
                        }
                        className="w-full rounded-lg border px-3 py-2"
                      />
                    </label>

                    <label className="flex-1 space-y-1">
                      <span className="text-xs text-gray-500">
                        Closes
                      </span>
                      <input
                        type="time"
                        required
                        value={slot.close}
                        onChange={(event) =>
                          updateSlot(
                            day.day,
                            index,
                            "close",
                            event.target.value
                          )
                        }
                        className="w-full rounded-lg border px-3 py-2"
                      />
                    </label>

                    <button
                      type="button"
                      onClick={() => removeSlot(day.day, index)}
                      className="rounded-lg border px-3 py-2 text-sm"
                    >
                      Remove
                    </button>
                  </div>
                ))}

                <button
                  type="button"
                  onClick={() => addSlot(day.day)}
                  className="text-sm underline"
                >
                  + Add time slot
                </button>
              </div>
            )}
          </section>
        ))}
      </div>

      {message && (
        <p role="status" className="text-sm">
          {message}
        </p>
      )}

      <button
        type="button"
        onClick={handleSave}
        disabled={saving}
        className="w-full rounded-lg bg-black px-4 py-3 text-white disabled:opacity-50"
      >
        {saving ? "Saving..." : "Save working hours"}
      </button>
    </main>
  );
}