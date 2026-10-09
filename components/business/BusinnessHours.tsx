"use client";

import { useEffect, useMemo, useState } from "react";
import { useMutation, useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import type { Id } from "@/convex/_generated/dataModel";
import {
  AlertCircle,
  Check,
  Clock3,
  Copy,
  Loader2,
  RotateCcw,
  Save,
} from "lucide-react";

import { Button } from "@/components/ui/button";

type DayHours = {
  dayOfWeek: number;
  isOpen: boolean;
  openTime?: string;
  closeTime?: string;
};

type BusinessHoursProps = {
  businessId: string;
};

const DAYS = [
  { dayOfWeek: 0, name: "Sunday", shortName: "Sun" },
  { dayOfWeek: 1, name: "Monday", shortName: "Mon" },
  { dayOfWeek: 2, name: "Tuesday", shortName: "Tue" },
  { dayOfWeek: 3, name: "Wednesday", shortName: "Wed" },
  { dayOfWeek: 4, name: "Thursday", shortName: "Thu" },
  { dayOfWeek: 5, name: "Friday", shortName: "Fri" },
  { dayOfWeek: 6, name: "Saturday", shortName: "Sat" },
];

const DEFAULT_HOURS: DayHours[] = DAYS.map((day) => ({
  dayOfWeek: day.dayOfWeek,
  isOpen: false,
  openTime: undefined,
  closeTime: undefined,
}));

function normalizeHours(
  hours: Array<{
    dayOfWeek: number;
    isOpen: boolean;
    openTime?: string;
    closeTime?: string;
  }>,
): DayHours[] {
  return DAYS.map((day) => {
    const existing = hours.find(
      (item) => item.dayOfWeek === day.dayOfWeek,
    );

    if (!existing) {
      return {
        dayOfWeek: day.dayOfWeek,
        isOpen: false,
        openTime: undefined,
        closeTime: undefined,
      };
    }

    return {
      dayOfWeek: day.dayOfWeek,
      isOpen: existing.isOpen,
      openTime: existing.isOpen ? existing.openTime : undefined,
      closeTime: existing.isOpen ? existing.closeTime : undefined,
    };
  });
}

function areHoursEqual(a: DayHours[], b: DayHours[]) {
  return DAYS.every((day) => {
    const first = a.find((item) => item.dayOfWeek === day.dayOfWeek);
    const second = b.find((item) => item.dayOfWeek === day.dayOfWeek);

    return (
      first?.isOpen === second?.isOpen &&
      first?.openTime === second?.openTime &&
      first?.closeTime === second?.closeTime
    );
  });
}

export default function BusinessHours({
  businessId,
}: BusinessHoursProps) {
  const businessIdTyped = businessId as Id<"businesses">;

  const hours = useQuery(api.businessHours.list, {
    businessId: businessIdTyped,
  });

  const setWeek = useMutation(api.businessHours.setWeek);

  const [draft, setDraft] = useState<DayHours[]>(DEFAULT_HOURS);
  const [savedHours, setSavedHours] =
    useState<DayHours[]>(DEFAULT_HOURS);

  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [saveSuccess, setSaveSuccess] = useState(false);

  /*
   * Populate the editor when Convex returns the current schedule.
   *
   * We only do this when there are no local unsaved changes.
   * That prevents a Convex refresh from overwriting something
   * the user is currently editing.
   */
  useEffect(() => {
    if (hours === undefined) return;

    const normalized = normalizeHours(hours);

    setDraft((current) => {
      if (areHoursEqual(current, savedHours)) {
        return normalized;
      }

      return current;
    });

    setSavedHours(normalized);
  }, [hours]);

  const hasChanges = useMemo(
    () => !areHoursEqual(draft, savedHours),
    [draft, savedHours],
  );

  const openDays = useMemo(
    () => draft.filter((day) => day.isOpen).length,
    [draft],
  );

  function updateDay(
    dayOfWeek: number,
    updates: Partial<DayHours>,
  ) {
    setSaveSuccess(false);
    setSaveError(null);

    setDraft((current) =>
      current.map((day) =>
        day.dayOfWeek === dayOfWeek
          ? {
              ...day,
              ...updates,
            }
          : day,
      ),
    );
  }

  function toggleDay(dayOfWeek: number) {
    const current = draft.find(
      (day) => day.dayOfWeek === dayOfWeek,
    );

    if (!current) return;

    if (current.isOpen) {
      updateDay(dayOfWeek, {
        isOpen: false,
        openTime: undefined,
        closeTime: undefined,
      });

      return;
    }

    updateDay(dayOfWeek, {
      isOpen: true,
      openTime: current.openTime ?? "09:00",
      closeTime: current.closeTime ?? "17:00",
    });
  }

  function copyMondayToAll() {
    const monday = draft.find((day) => day.dayOfWeek === 1);

    if (!monday) return;

    setSaveSuccess(false);
    setSaveError(null);

    setDraft(
      DAYS.map((day) => ({
        dayOfWeek: day.dayOfWeek,
        isOpen: monday.isOpen,
        openTime: monday.isOpen
          ? monday.openTime
          : undefined,
        closeTime: monday.isOpen
          ? monday.closeTime
          : undefined,
      })),
    );
  }

  function resetChanges() {
    setDraft(savedHours);
    setSaveError(null);
    setSaveSuccess(false);
  }

  async function saveChanges() {
    setSaving(true);
    setSaveError(null);
    setSaveSuccess(false);

    try {
      await setWeek({
        businessId: businessIdTyped,
        hours: draft.map((day) => ({
          dayOfWeek: day.dayOfWeek,
          isOpen: day.isOpen,
          openTime: day.isOpen
            ? day.openTime
            : undefined,
          closeTime: day.isOpen
            ? day.closeTime
            : undefined,
        })),
      });

      setSavedHours(draft);
      setSaveSuccess(true);
    } catch (error) {
      setSaveError(
        error instanceof Error
          ? error.message
          : "Failed to save business hours.",
      );
    } finally {
      setSaving(false);
    }
  }

  if (hours === undefined) {
    return (
      <div className="mx-auto w-full max-w-4xl space-y-6 p-6">
        <div className="space-y-2">
          <div className="h-8 w-52 animate-pulse rounded-md bg-muted" />
          <div className="h-5 w-80 animate-pulse rounded-md bg-muted" />
        </div>

        <div className="overflow-hidden rounded-xl border bg-card">
          {DAYS.map((day) => (
            <div
              key={day.dayOfWeek}
              className="flex h-20 animate-pulse items-center gap-4 border-b px-5 last:border-b-0"
            >
              <div className="h-5 w-24 rounded bg-muted" />
              <div className="ml-auto h-9 w-20 rounded bg-muted" />
              <div className="h-9 w-28 rounded bg-muted" />
              <div className="h-9 w-28 rounded bg-muted" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto w-full max-w-4xl space-y-6 p-4 sm:p-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <div className="flex items-center gap-2">
            <Clock3 className="h-6 w-6 text-primary" />

            <h1 className="text-2xl font-semibold tracking-tight">
              Business hours
            </h1>
          </div>

          <p className="mt-1 text-sm text-muted-foreground">
            Set when your business is available each day.
          </p>
        </div>

        <div className="rounded-lg border bg-muted/40 px-4 py-2 text-sm">
          <span className="font-medium">{openDays}</span>{" "}
          {openDays === 1 ? "day" : "days"} open
        </div>
      </div>

      {/* Actions */}
      <div className="flex flex-wrap gap-2">
        <Button
          type="button"
          variant="outline"
          onClick={copyMondayToAll}
          disabled={saving}
        >
          <Copy className="mr-2 h-4 w-4" />
          Copy Monday to all
        </Button>

        {hasChanges && (
          <Button
            type="button"
            variant="ghost"
            onClick={resetChanges}
            disabled={saving}
          >
            <RotateCcw className="mr-2 h-4 w-4" />
            Reset changes
          </Button>
        )}
      </div>

      {/* Schedule */}
      <div className="overflow-hidden rounded-xl border bg-card">
        <div className="hidden grid-cols-[1.2fr_100px_1fr_1fr] gap-4 border-b bg-muted/30 px-5 py-3 text-xs font-medium uppercase tracking-wide text-muted-foreground md:grid">
          <div>Day</div>
          <div>Status</div>
          <div>Opening</div>
          <div>Closing</div>
        </div>

        <div>
          {DAYS.map((day) => {
            const current = draft.find(
              (item) => item.dayOfWeek === day.dayOfWeek,
            );

            if (!current) return null;

            return (
              <div
                key={day.dayOfWeek}
                className="border-b px-4 py-5 last:border-b-0 sm:px-5"
              >
                <div className="grid gap-4 md:grid-cols-[1.2fr_100px_1fr_1fr] md:items-center">
                  {/* Day */}
                  <div>
                    <div className="font-medium">
                      <span className="sm:hidden">
                        {day.shortName}
                      </span>

                      <span className="hidden sm:inline">
                        {day.name}
                      </span>
                    </div>
                  </div>

                  {/* Open / Closed */}
                  <div>
                    <button
                      type="button"
                      onClick={() => toggleDay(day.dayOfWeek)}
                      className={[
                        "inline-flex h-9 min-w-[82px] items-center justify-center rounded-full border px-3 text-sm font-medium transition-colors",
                        current.isOpen
                          ? "border-green-500/30 bg-green-500/10 text-green-700 dark:text-green-400"
                          : "border-border bg-muted text-muted-foreground",
                      ].join(" ")}
                    >
                      {current.isOpen ? "Open" : "Closed"}
                    </button>
                  </div>

                  {/* Opening */}
                  <div className="space-y-1.5">
                    <label className="text-xs text-muted-foreground md:hidden">
                      Opening time
                    </label>

                    <input
                      type="time"
                      value={current.openTime ?? ""}
                      disabled={!current.isOpen || saving}
                      onChange={(event) =>
                        updateDay(day.dayOfWeek, {
                          openTime: event.target.value,
                        })
                      }
                      className="h-10 w-full rounded-md border bg-background px-3 text-sm outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/20 disabled:cursor-not-allowed disabled:opacity-50"
                    />
                  </div>

                  {/* Closing */}
                  <div className="space-y-1.5">
                    <label className="text-xs text-muted-foreground md:hidden">
                      Closing time
                    </label>

                    <input
                      type="time"
                      value={current.closeTime ?? ""}
                      disabled={!current.isOpen || saving}
                      onChange={(event) =>
                        updateDay(day.dayOfWeek, {
                          closeTime: event.target.value,
                        })
                      }
                      className="h-10 w-full rounded-md border bg-background px-3 text-sm outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/20 disabled:cursor-not-allowed disabled:opacity-50"
                    />
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Validation / errors */}
      {saveError && (
        <div className="flex items-start gap-3 rounded-lg border border-destructive/30 bg-destructive/5 p-4 text-sm text-destructive">
          <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />

          <div>
            <p className="font-medium">
              Could not save hours
            </p>

            <p className="mt-1 opacity-90">
              {saveError}
            </p>
          </div>
        </div>
      )}

      {saveSuccess && !hasChanges && (
        <div className="flex items-center gap-3 rounded-lg border border-green-500/30 bg-green-500/5 p-4 text-sm text-green-700 dark:text-green-400">
          <Check className="h-4 w-4" />

          <span>
            Business hours saved successfully.
          </span>
        </div>
      )}

      {/* Save bar */}
      <div className="sticky bottom-4 z-10 flex items-center justify-between gap-4 rounded-xl border bg-background/95 p-3 shadow-lg backdrop-blur">
        <div className="min-w-0">
          {hasChanges ? (
            <>
              <p className="text-sm font-medium">
                Unsaved changes
              </p>

              <p className="hidden text-xs text-muted-foreground sm:block">
                Save your weekly schedule when you're ready.
              </p>
            </>
          ) : (
            <p className="text-sm text-muted-foreground">
              All changes saved
            </p>
          )}
        </div>

        <Button
          type="button"
          onClick={saveChanges}
          disabled={!hasChanges || saving}
        >
          {saving ? (
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          ) : (
            <Save className="mr-2 h-4 w-4" />
          )}

          {saving ? "Saving..." : "Save hours"}
        </Button>
      </div>
    </div>
  );
}