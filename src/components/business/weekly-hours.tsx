import { DAY_NAMES, type BusinessDay } from "@/lib/business-hours";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export function WeeklyHours({
  businessHours,
}: {
  businessHours: BusinessDay[] | undefined | null;
}) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Operating hours</CardTitle>
      </CardHeader>
      <CardContent>
        {!businessHours?.length ? (
          <p className="text-sm text-muted-foreground">
            Operating hours have not been published yet.
          </p>
        ) : (
          <dl className="divide-y divide-border/60">
            {businessHours.map((day) => (
              <div
                key={day.day}
                className="flex items-center justify-between gap-4 py-2.5"
              >
                <dt className="text-sm font-medium">
                  {DAY_NAMES[day.day] ?? day.day}
                </dt>
                <dd className="text-right text-sm text-muted-foreground">
                  {!day.isOpen || day.slots.length === 0 ? (
                    <span>Closed</span>
                  ) : (
                    <span className="flex flex-col gap-0.5 sm:flex-row sm:gap-3">
                      {day.slots.map((slot, index) => (
                        <span key={`${slot.open}-${slot.close}-${index}`}>
                          {slot.open} &ndash; {slot.close}
                        </span>
                      ))}
                    </span>
                  )}
                </dd>
              </div>
            ))}
          </dl>
        )}
      </CardContent>
    </Card>
  );
}