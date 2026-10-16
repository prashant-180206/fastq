"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { useMutation, useQuery } from "convex/react";
import { api } from "@/../convex/_generated/api";
import type { Id } from "@/../convex/_generated/dataModel";
import { FlowHeader } from "@/components/business/flow-header";
import { SummaryCard } from "@/components/business/summary-card";
import {
  Alert,
  AlertDescription,
  AlertTitle,
} from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { buttonVariants, Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { Spinner } from "@/components/ui/spinner";
import { Textarea } from "@/components/ui/textarea";
import {
  Building01Icon,
  CheckmarkCircle01Icon,
  Clock01Icon,
  Queue02Icon,
  Ticket01Icon,
} from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import { cn } from "cn";

interface JoinQueueFormProps {
  businessId: string;
  initialQueueId?: string;
  initialServiceId?: string;
}

export function JoinQueueForm({
  businessId,
  initialQueueId,
  initialServiceId,
}: JoinQueueFormProps) {
  const id = businessId as Id<"businesses">;

  const business = useQuery(api.business.data.getPublicById, {
    businessId: id,
  });
  const queues = useQuery(api.business.queue.getPublicByBusiness, {
    businessId: id,
  });
  const services = useQuery(api.business.services.getPublicByBusiness, {
    businessId: id,
  });
  const joinQueue = useMutation(api.business.queueCapacity.joinQueue);

  const [queueChoice, setQueueChoice] = useState(initialQueueId ?? "");
  const [touchedQueue, setTouchedQueue] = useState(false);
  const [acknowledged, setAcknowledged] = useState<Record<string, boolean>>({});
  const [customerNote, setCustomerNote] = useState("");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState<{
    tokenId: Id<"queueTokens">;
    tokenNumber: number;
    status: string;
    joinedAt?: number;
  } | null>(null);

  const requestedQueueId = useMemo(() => {
    if (queues === undefined) {
      return "";
    }
    if (initialQueueId) {
      return queues.find((queue) => queue._id === initialQueueId)?._id ?? "";
    }
    if (initialServiceId) {
      return (
        queues.find((queue) => queue.serviceId === initialServiceId)?._id ?? ""
      );
    }
    return "";
  }, [queues, initialQueueId, initialServiceId]);

  const selectedQueueId = touchedQueue
    ? queueChoice
    : queueChoice || requestedQueueId;

  const selectedQueue = queues?.find(
    (queue) => queue._id === selectedQueueId,
  ) ?? null;

  const selectedService = selectedQueue
    ? services?.find((service) => service._id === selectedQueue.serviceId)
    : undefined;

  const handleJoin = async () => {
    if (!selectedQueue) {
      setError("Choose a queue first.");
      return;
    }

    const missing = selectedQueue.prerequisites.find(
      (item) => item.isRequired && !acknowledged[item.id],
    );

    if (missing) {
      setError(`Please acknowledge: ${missing.label}`);
      return;
    }

    setError("");
    setSubmitting(true);

    try {
      const response = await joinQueue({
        queueId: selectedQueue._id,
        acknowledgedPrerequisites: selectedQueue.prerequisites
          .filter((item) => acknowledged[item.id])
          .map((item) => ({
            prerequisiteId: item.id,
            acknowledgedAt: Date.now(),
          })),
        ...(customerNote.trim()
          ? { customerNote: customerNote.trim() }
          : {}),
      });

      setResult(response);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Unable to join this queue.",
      );
    } finally {
      setSubmitting(false);
    }
  };

  if (business === undefined || queues === undefined || services === undefined) {
    return (
      <main className="mx-auto max-w-6xl space-y-8 px-4 py-8 sm:px-6">
        <Skeleton className="h-6 w-40" />
        <Skeleton className="h-12 w-80 max-w-full" />
        <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_360px]">
          <Skeleton className="h-96 rounded-3xl" />
          <Skeleton className="h-64 rounded-3xl" />
        </div>
      </main>
    );
  }

  if (!business) {
    return (
      <main className="mx-auto max-w-6xl px-4 pt-16 sm:px-6">
        <Empty>
          <EmptyContent>
            <EmptyMedia variant="icon">
              <HugeiconsIcon icon={Building01Icon} strokeWidth={2} />
            </EmptyMedia>
            <EmptyTitle>Business unavailable</EmptyTitle>
            <EmptyDescription>
              This business may not exist or may no longer be available on
              FastQ.
            </EmptyDescription>
          </EmptyContent>
        </Empty>
      </main>
    );
  }

  if (result) {
    const success = result;

    return (
      <main className="mx-auto max-w-6xl px-4 py-8 sm:px-6">
        <FlowHeader
          businessId={businessId}
          businessName={business.name}
          title="You got a token"
        />

        <Card className="mx-auto mt-8 max-w-xl">
          <CardContent className="flex flex-col items-center gap-4 p-8 text-center">
            <div className="flex size-12 items-center justify-center rounded-full bg-primary/10 text-primary">
              <HugeiconsIcon
                icon={CheckmarkCircle01Icon}
                strokeWidth={2}
                className="size-6"
              />
            </div>

            <div>
              <p className="font-heading text-lg font-semibold">
                You have joined {selectedQueue?.name ?? "the queue"}
              </p>
              <p className="mt-1 text-sm text-muted-foreground">
                Your token number
              </p>
            </div>

            <p className="font-heading text-6xl font-bold tracking-tight text-primary">
              #{success.tokenNumber}
            </p>

            <Badge variant="secondary" className="rounded-full capitalize">
              {success.status}
            </Badge>

            <p className="w-full break-all rounded-xl bg-muted/60 p-3 font-mono text-xs text-muted-foreground">
              Token ID: {success.tokenId}
            </p>

            <div className="flex flex-wrap items-center justify-center gap-3">
              <Link
                href="/my-day"
                className={cn(buttonVariants())}
              >
                View my day
                <HugeiconsIcon icon={Queue02Icon} strokeWidth={2} />
              </Link>
              <Link
                href={`/b/${businessId}/book`}
                className={cn(buttonVariants({ variant: "outline" }))}
              >
                Book an appointment
              </Link>
              <button
                type="button"
                onClick={() => {
                  setResult(null);
                  setTouchedQueue(true);
                  setQueueChoice("");
                }}
                className={cn(buttonVariants({ variant: "ghost" }))}
              >
                Join another queue
              </button>
            </div>
          </CardContent>
        </Card>
      </main>
    );
  }

  const prerequisitesCount = selectedQueue?.prerequisites.length ?? 0;

  return (
    <main className="mx-auto max-w-6xl px-4 py-8 sm:px-6">
      <FlowHeader
        businessId={businessId}
        businessName={business.name}
        title="Join a queue"
        description={`Choose a queue for ${business.name} and receive your token number.`}
      />

      <div className="mt-8 grid gap-6 lg:grid-cols-[minmax(0,1fr)_360px]">
        <Card className="h-fit">
          <CardHeader>
            <CardTitle>Queue details</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid gap-2">
              <Label>Queue</Label>
              <Select
                value={selectedQueueId}
                onValueChange={(value) => {
                  setTouchedQueue(true);
                  setQueueChoice(value ?? "");
                  setAcknowledged({});
                  setError("");
                }}
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Choose a queue" />
                </SelectTrigger>
                <SelectContent>
                  {queues.map((queue) => {
                    const service = services.find(
                      (item) => item._id === queue.serviceId,
                    );

                    return (
                      <SelectItem key={queue._id} value={queue._id}>
                        {queue.name}
                        {service ? ` — ${service.name}` : ""}
                      </SelectItem>
                    );
                  })}
                </SelectContent>
              </Select>
            </div>

            {selectedQueue ? (
              <>
                <div className="space-y-1.5 rounded-2xl bg-muted/60 p-4">
                  <p className="flex items-center gap-2 font-medium">
                    <HugeiconsIcon
                      icon={Ticket01Icon}
                      strokeWidth={2}
                      className="size-4 text-muted-foreground"
                    />
                    {selectedQueue.name}
                  </p>
                  {selectedQueue.description ? (
                    <p className="text-sm text-muted-foreground">
                      {selectedQueue.description}
                    </p>
                  ) : null}
                  {selectedService ? (
                    <p className="flex items-center gap-1.5 text-sm text-muted-foreground">
                      <HugeiconsIcon
                        icon={Clock01Icon}
                        strokeWidth={2}
                        className="size-4"
                      />
                      {selectedService.name} &middot;{" "}
                      {selectedService.durationMinutes} min
                    </p>
                  ) : null}
                </div>

                {selectedQueue.prerequisites.length > 0 ? (
                  <div className="grid gap-3">
                    <div>
                      <h3 className="text-sm font-medium">Before you join</h3>
                      <p className="mt-1 text-sm text-muted-foreground">
                        Acknowledge the requirements to continue.
                      </p>
                    </div>

                    {selectedQueue.prerequisites.map((item) => (
                      <label
                        key={item.id}
                        className="flex cursor-pointer items-start gap-3 rounded-2xl border p-3.5 transition-colors hover:bg-muted/40"
                      >
                        <Checkbox
                          checked={Boolean(acknowledged[item.id])}
                          onCheckedChange={(checked) =>
                            setAcknowledged((previous) => ({
                              ...previous,
                              [item.id]: checked === true,
                            }))
                          }
                          className="mt-0.5"
                        />
                        <span className="min-w-0">
                          <span className="block text-sm font-medium">
                            {item.label}
                            {item.isRequired ? " *" : ""}
                          </span>
                          {item.description ? (
                            <span className="mt-1 block text-sm text-muted-foreground">
                              {item.description}
                            </span>
                          ) : null}
                        </span>
                      </label>
                    ))}
                  </div>
                ) : null}

                <div className="grid gap-2">
                  <Label htmlFor="queue-note">Note (optional)</Label>
                  <Textarea
                    id="queue-note"
                    rows={3}
                    maxLength={1000}
                    value={customerNote}
                    onChange={(event) => setCustomerNote(event.target.value)}
                    placeholder="Add a note for the business"
                  />
                </div>
              </>
            ) : null}

            {error ? (
              <Alert variant="destructive">
                <AlertTitle>Could not join the queue</AlertTitle>
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            ) : null}

            <div className="grid gap-3">
              <Button
                onClick={handleJoin}
                disabled={!selectedQueue || submitting}
                className="w-full"
              >
                {submitting ? (
                  <Spinner data-icon="inline-start" />
                ) : null}
                {submitting ? "Joining…" : "Join queue"}
              </Button>

              <p className="text-center text-xs text-muted-foreground">
                Joining requires you to be signed in. Your token is created only
                after the server validates your request.
              </p>
            </div>
          </CardContent>
        </Card>

        <SummaryCard title="Order summary">
          {selectedQueue ? (
            <div className="grid gap-4">
              <div className="space-y-1">
                <p className="text-sm text-muted-foreground">Queue</p>
                <p className="text-sm font-medium">{selectedQueue.name}</p>
              </div>

              {selectedService ? (
                <div className="space-y-1">
                  <p className="text-sm text-muted-foreground">Service</p>
                  <p className="text-sm font-medium">
                    {selectedService.name}
                    <span className="ml-2 text-muted-foreground">
                      &middot; {selectedService.durationMinutes} min
                    </span>
                  </p>
                </div>
              ) : null}

              {prerequisitesCount > 0 ? (
                <div className="space-y-1">
                  <p className="text-sm text-muted-foreground">
                    Requirements
                  </p>
                  <p className="text-sm font-medium">
                    {Object.values(acknowledged).filter(Boolean).length} of{" "}
                    {prerequisitesCount} acknowledged
                  </p>
                </div>
              ) : null}

              {customerNote.trim() ? (
                <div className="space-y-1">
                  <p className="text-sm text-muted-foreground">Note</p>
                  <p className="line-clamp-3 text-sm">{customerNote.trim()}</p>
                </div>
              ) : null}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">
              Pick a queue to preview your token details here.
            </p>
          )}
        </SummaryCard>
      </div>
    </main>
  );
}