"use client";

import { getTodaySchedule, type BusinessDay } from "@/lib/business-hours";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Clock01Icon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";

export function TodaySchedule({
  businessHours,
}: {
  businessHours: BusinessDay[] | undefined | null;
}) {
  const { day, isOpenNow } = getTodaySchedule(businessHours);

  const todayLabel = new Intl.DateTimeFormat("en-IN", {
    timeZone: "Asia/Kolkata",
    weekday: "long",
    day: "numeric",
    month: "long",
  }).format(new Date());

  return (
    <Card>
      <CardHeader>
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <CardTitle>{"Today's schedule"}</CardTitle>
            <p className="mt-1 text-sm text-muted-foreground">{todayLabel}</p>
          </div>
          <Badge
            variant={isOpenNow ? "default" : "secondary"}
            className="rounded-full"
          >
            {isOpenNow ? "Open now" : "Currently closed"}
          </Badge>
        </div>
      </CardHeader>

      <CardContent>
        {!day ? (
          <p className="text-sm text-muted-foreground">
            {"Today's hours have not been configured."}
          </p>
        ) : !day.isOpen || day.slots.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            This business is scheduled to be closed today.
          </p>
        ) : (
          <div className="space-y-3">
            {day.slots.map((slot, index) => (
              <div
                key={`${slot.open}-${slot.close}-${index}`}
                className="flex items-center justify-between gap-4 rounded-2xl bg-muted/60 px-4 py-3"
              >
                <span className="flex items-center gap-2 text-sm text-muted-foreground">
                  <HugeiconsIcon
                    icon={Clock01Icon}
                    strokeWidth={2}
                    className="size-4"
                  />
                  {index === 0 ? "Operating hours" : `Session ${index + 1}`}
                </span>
                <span className="font-medium tabular-nums">
                  {slot.open} &ndash; {slot.close}
                </span>
              </div>
            ))}
          </div>
        )}

        <p className="mt-4 text-xs text-muted-foreground">
          Times shown in India Standard Time (IST). This reflects the configured
          schedule, not live staff availability.
        </p>
      </CardContent>
    </Card>
  );
}