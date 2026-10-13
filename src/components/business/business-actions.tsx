import Link from "next/link";
import { Card, CardContent } from "@/components/ui/card";
import {
  ArrowRight01Icon,
  Calendar02Icon,
  Queue02Icon,
} from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import { cn } from "cn";

interface BusinessActionsProps {
  businessId: string;
}

export function BusinessActions({ businessId }: BusinessActionsProps) {
  return (
    <div className="grid gap-4 sm:grid-cols-2">
      <Card className="group overflow-hidden border-primary/30">
        <CardContent className="p-0">
          <Link
            href={`/b/${businessId}/book`}
            className={cn(
              "flex h-full flex-col gap-3 bg-primary p-6 text-primary-foreground",
              "transition-colors hover:bg-primary/90",
            )}
          >
            <span className="flex items-center gap-2 font-semibold">
              <HugeiconsIcon icon={Calendar02Icon} strokeWidth={2} className="size-5" />
              Book an appointment
              <HugeiconsIcon
                icon={ArrowRight01Icon}
                strokeWidth={2}
                className="ml-auto size-5 transition-transform group-hover:translate-x-1"
              />
            </span>
            <span className="text-sm leading-6 text-primary-foreground/80">
              Choose a service, date, and an available time.
            </span>
          </Link>
        </CardContent>
      </Card>

      <Card className="group overflow-hidden">
        <CardContent className="p-0">
          <Link
            href={`/b/${businessId}/queue`}
            className={cn(
              "flex h-full flex-col gap-3 p-6 transition-colors hover:bg-accent",
            )}
          >
            <span className="flex items-center gap-2 font-semibold">
              <HugeiconsIcon icon={Queue02Icon} strokeWidth={2} className="size-5" />
              Join a queue
              <HugeiconsIcon
                icon={ArrowRight01Icon}
                strokeWidth={2}
                className="ml-auto size-5 text-muted-foreground transition-transform group-hover:translate-x-1"
              />
            </span>
            <span className="text-sm leading-6 text-muted-foreground">
              Join an active queue and receive your token.
            </span>
          </Link>
        </CardContent>
      </Card>
    </div>
  );
}