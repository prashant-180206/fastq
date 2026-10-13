import { api } from "@/../convex/_generated/api";
import type { FunctionReturnType } from "convex/server";
import Link from "next/link";
import { buttonVariants } from "@/components/ui/button";
import {
  Card,
  CardContent,
} from "@/components/ui/card";
import {
  ArrowRight01Icon,
  Clock01Icon,
} from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import { cn } from "cn";

type Service = FunctionReturnType<
  typeof api.business.services.getPublicByBusiness
>[number];

interface ServiceCardProps {
  businessId: string;
  service: Service;
  hasActiveQueue: boolean;
}

export function ServiceCard({
  businessId,
  service,
  hasActiveQueue,
}: ServiceCardProps) {
  return (
    <Card className="flex h-full flex-col">
      <CardContent className="flex flex-1 flex-col gap-4 p-5">
        <div className="flex-1">
          <h3 className="font-heading text-lg font-semibold tracking-tight">
            {service.name}
          </h3>

          {service.description ? (
            <p className="mt-2 text-sm leading-6 text-muted-foreground">
              {service.description}
            </p>
          ) : null}

          <p className="mt-4 flex items-center gap-1.5 text-sm text-muted-foreground">
            <HugeiconsIcon icon={Clock01Icon} strokeWidth={2} className="size-4" />
            {service.durationMinutes} minute
            {service.durationMinutes === 1 ? "" : "s"}
          </p>
        </div>

        <div className="flex flex-wrap gap-2">
          {service.queueEnabled ? (
            hasActiveQueue ? (
              <Link
                href={`/b/${businessId}/queue?serviceId=${service._id}`}
                className={cn(buttonVariants({ size: "sm" }))}
              >
                Join a queue
                <HugeiconsIcon icon={ArrowRight01Icon} strokeWidth={2} className="size-4" />
              </Link>
            ) : (
              <span className="inline-flex items-center rounded-full border px-3 py-1 text-xs text-muted-foreground">
                No active queue
              </span>
            )
          ) : null}

          {service.appointmentsEnabled ? (
            <Link
              href={`/b/${businessId}/book?serviceId=${service._id}`}
              className={cn(buttonVariants({ variant: "outline", size: "sm" }))}
            >
              Book appointment
            </Link>
          ) : null}
        </div>
      </CardContent>
    </Card>
  );
}