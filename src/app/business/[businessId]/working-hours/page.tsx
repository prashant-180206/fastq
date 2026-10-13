"use client";

import { use, useState } from "react";
import Link from "next/link";
import { useMutation, useQuery } from "convex/react";
import { api } from "@/../convex/_generated/api";
import type { Id } from "@/../convex/_generated/dataModel";
import { Button, buttonVariants } from "@/components/ui/button";
import {
  Card,
  CardContent,
} from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty";
import { Field, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { Spinner } from "@/components/ui/spinner";
import { notifyError, notifySuccess } from "@/lib/toast";
import { PlusIcon, TimeSetting03Icon, TrashIcon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import { cn } from "cn";

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

type InitialDay = {
  day: DayName;
  isOpen: boolean;
  slots: { open: string; close: string }[];
};

function buildHours(initial: InitialDay[]): BusinessDay[] {
  return DAYS.map((day) => {
    const saved = initial.find((item) => item.day === day);

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
  });
}

export default function WorkingHoursPage({
  params,
}: {
  params: Promise<{ businessId: string }>;
}) {
  const { businessId } = use(params);
  const typedBusinessId = businessId as Id<"businesses">;

  const business = useQuery(api.business.data.getById, {
    businessId: typedBusinessId,
  });

  if (business === undefined) {
    return (
      <div className="flex flex-col gap-6">
        <div className="space-y-2">
          <Skeleton className="h-9 w-56" />
          <Skeleton className="h-4 w-full max-w-md" />
        </div>
        <Skeleton className="h-28 rounded-3xl" />
        <Skeleton className="h-28 rounded-3xl" />
        <Skeleton className="h-28 rounded-3xl" />
      </div>
    );
  }

  if (business === null) {
    return (
      <Empty className="justify-center py-24">
        <EmptyContent>
          <EmptyMedia variant="icon">
            <HugeiconsIcon icon={TimeSetting03Icon} strokeWidth={2} />
          </EmptyMedia>
          <EmptyTitle>Business not found</EmptyTitle>
          <EmptyDescription>
            It may have been removed or the link is incorrect.
          </EmptyDescription>
        </EmptyContent>
        <Link href="/business" className={cn(buttonVariants({ size: "sm" }))}>
          Return to businesses
        </Link>
      </Empty>
    );
  }

  return (
    <HoursEditor
      key={business._id}
      businessId={typedBusinessId}
      initialHours={business.businessHours ?? []}
    />
  );
}

function HoursEditor({
  businessId,
  initialHours,
}: {
  businessId: Id<"businesses">;
  initialHours: InitialDay[];
}) {
  const saveHours = useMutation(api.business.data.updateBusinessHours);

  const [hours, setHours] = useState<BusinessDay[]>(() =>
    buildHours(initialHours),
  );
  const [saving, setSaving] = useState(false);

  function updateDay(
    day: DayName,
    updater: (current: BusinessDay) => BusinessDay,
  ) {
    setHours((current) =>
      current.map((item) => (item.day === day ? updater(item) : item)),
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
    value: string,
  ) {
    updateDay(day, (current) => ({
      ...current,
      slots: current.slots.map((slot, i) =>
        i === index ? { ...slot, [field]: value } : slot,
      ),
    }));
  }

  function addSlot(day: DayName) {
    updateDay(day, (current) => ({
      ...current,
      slots: [...current.slots, { open: "09:00", close: "17:00" }],
    }));
  }

  function removeSlot(day: DayName, index: number) {
    updateDay(day, (current) => ({
      ...current,
      slots: current.slots.filter((_, i) => i !== index),
    }));
  }

  async function handleSave() {
    setSaving(true);
    try {
      await saveHours({
        businessId,
        businessHours: hours,
      });
      notifySuccess("Working hours saved");
    } catch (error) {
      notifyError(
        "Could not save working hours",
        error instanceof Error ? error.message : "Please try again.",
      );
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="font-heading text-3xl font-bold tracking-tight">
          Working hours
        </h1>
        <p className="mt-1 max-w-2xl text-muted-foreground">
          Set opening hours for each day. Add multiple slots for split
          shifts.
        </p>
      </div>

      <div className="flex flex-col gap-3">
        {hours.map((day) => (
          <Card key={day.day} size="sm">
            <CardContent className="gap-4">
              <div className="flex items-center justify-between gap-4">
                <h2 className="font-heading text-base font-medium capitalize">
                  {day.day}
                </h2>

                <label className="flex cursor-pointer items-center gap-2.5 text-sm">
                  <Checkbox
                    checked={day.isOpen}
                    onCheckedChange={(checked) =>
                      toggleDay(day.day, checked === true)
                    }
                  />
                  Open
                </label>
              </div>

              {!day.isOpen ? (
                <p className="text-sm text-muted-foreground">Closed</p>
              ) : (
                <div className="grid gap-3">
                  {day.slots.map((slot, index) => (
                    <div
                      key={index}
                      className="flex flex-wrap items-end justify-between gap-3 rounded-2xl border p-3"
                    >
                      <div className="grid flex-1 gap-3 min-[400px]:grid-cols-2">
                        <Field>
                          <FieldLabel>Opens</FieldLabel>
                          <Input
                            type="time"
                            required
                            value={slot.open}
                            onChange={(event) =>
                              updateSlot(
                                day.day,
                                index,
                                "open",
                                event.target.value,
                              )
                            }
                          />
                        </Field>

                        <Field>
                          <FieldLabel>Closes</FieldLabel>
                          <Input
                            type="time"
                            required
                            value={slot.close}
                            onChange={(event) =>
                              updateSlot(
                                day.day,
                                index,
                                "close",
                                event.target.value,
                              )
                            }
                          />
                        </Field>
                      </div>

                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="text-destructive hover:bg-destructive/10 hover:text-destructive"
                        onClick={() => removeSlot(day.day, index)}
                      >
                        <HugeiconsIcon
                          icon={TrashIcon}
                          strokeWidth={2}
                          data-icon="inline-start"
                        />
                        Remove
                      </Button>
                    </div>
                  ))}

                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="w-fit"
                    onClick={() => addSlot(day.day)}
                  >
                    <HugeiconsIcon
                      icon={PlusIcon}
                      strokeWidth={2}
                      data-icon="inline-start"
                    />
                    Add time slot
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        ))}
      </div>

      <Button
        type="button"
        size="lg"
        disabled={saving}
        onClick={handleSave}
      >
        {saving ? <Spinner data-icon="inline-start" /> : null}
        {saving ? "Saving…" : "Save working hours"}
      </Button>
    </div>
  );
}