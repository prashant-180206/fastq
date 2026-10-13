import { api } from "@/../convex/_generated/api";
import type { FunctionReturnType } from "convex/server";
import Link from "next/link";
import { buttonVariants } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  ArrowRight01Icon,
  CheckmarkCircle01Icon,
  Ticket01Icon,
} from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import { cn } from "cn";

type Queue = FunctionReturnType<
  typeof api.business.queue.getPublicByBusiness
>[number];

interface QueueCardProps {
  businessId: string;
  queue: Queue;
  serviceName?: string;
}

export function QueueCard({ businessId, queue, serviceName }: QueueCardProps) {
  return (
    <Card className="flex h-full flex-col">
      <CardContent className="flex flex-1 flex-col gap-3.5 p-5">
        <div className="flex-1">
          <h3 className="font-heading text-lg font-semibold tracking-tight">
            {queue.name}
          </h3>

          {queue.description ? (
            <p className="mt-2 text-sm leading-6 text-muted-foreground">
              {queue.description}
            </p>
          ) : null}

          {serviceName ? (
            <p className="mt-3 flex items-center gap-1.5 text-sm text-muted-foreground">
              <HugeiconsIcon icon={Ticket01Icon} strokeWidth={2} className="size-4" />
              {serviceName}
            </p>
          ) : null}

          {queue.prerequisites.length > 0 ? (
            <div className="mt-2 space-y-1">
              {queue.prerequisites.map((prerequisite) => (
                <p
                  key={prerequisite.id}
                  className="flex items-center gap-1.5 text-sm text-muted-foreground"
                >
                  <HugeiconsIcon
                    icon={CheckmarkCircle01Icon}
                    strokeWidth={2}
                    className="size-3.5 shrink-0"
                  />
                  {prerequisite.label}
                </p>
              ))}
            </div>
          ) : null}
        </div>

        <div>
          <Link
            href={`/b/${businessId}/queue?queueId=${queue._id}`}
            className={cn(buttonVariants({ size: "sm" }))}
          >
            View queue
            <HugeiconsIcon icon={ArrowRight01Icon} strokeWidth={2} className="size-4" />
          </Link>
        </div>
      </CardContent>
    </Card>
  );
}