"use client";

import Link from "next/link";
import { use, useState } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "@/../convex/_generated/api";
import type { Id } from "@/../convex/_generated/dataModel";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogMedia,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Badge } from "@/components/ui/badge";
import { Button, buttonVariants } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty";
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
import { useNow } from "@/hooks/use-now";
import { formatDateTimeIST } from "@/lib/format";
import { notifyError, notifyInfo, notifySuccess } from "@/lib/toast";
import {
  ArrowLeft01Icon,
  Clock01Icon,
  Megaphone01Icon,
  Queue02Icon,
} from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import { cn } from "cn";

const BROADCAST_TTL_OPTIONS = [15, 30, 60, 240] as const;
const DEFAULT_BROADCAST_TTL = 30;

type PageProps = {
  params: Promise<{
    businessId: string;
    queueId: string;
  }>;
};

function formatDate(timestamp: number) {
  return new Date(timestamp).toLocaleString("en-IN", {
    dateStyle: "medium",
    timeStyle: "short",
  });
}

function titleCase(value: string) {
  return value.replaceAll("_", " ").replace(/\b\w/g, (c) => c.toUpperCase());
}

function statusVariant(status: string): "default" | "secondary" | "outline" {
  if (status === "called" || status === "serving") {
    return "secondary";
  }
  if (status === "checked_in") {
    return "default";
  }
  return "outline";
}

export default function BusinessQueueOperationsPage({ params }: PageProps) {
  const { businessId, queueId } = use(params);

  const typedQueueId = queueId as Id<"queues">;
  const typedBusinessId = businessId as Id<"businesses">;

  const queue = useQuery(api.business.queue.getById, {
    queueId: typedQueueId,
  });

  const services = useQuery(api.business.services.getByBusiness, {
    businessId: typedBusinessId,
  });

  const tokens = useQuery(api.business.queueCapacity.getActiveTokensByQueue, {
    queueId: typedQueueId,
  });

  const callNext = useMutation(api.business.queueCapacity.callNext);
  const startServing = useMutation(api.business.queueCapacity.startServing);
  const completeToken = useMutation(api.business.queueCapacity.completeToken);
  const skipToken = useMutation(api.business.queueCapacity.skipToken);

  const now = useNow(30_000);

  const broadcasts = useQuery(api.business.broadcasts.getActiveByQueue, {
    queueId: typedQueueId,
    now,
  });

  const createBroadcast = useMutation(api.business.broadcasts.create);
  const removeBroadcast = useMutation(api.business.broadcasts.remove);

  const [busyAction, setBusyAction] = useState<string | null>(null);
  const [broadcastMessage, setBroadcastMessage] = useState("");
  const [broadcastMinutes, setBroadcastMinutes] = useState<number>(
    DEFAULT_BROADCAST_TTL,
  );
  const [sendingBroadcast, setSendingBroadcast] = useState(false);
  const [skipTarget, setSkipTarget] = useState<{
    tokenId: Id<"queueTokens">;
    tokenNumber: number;
  } | null>(null);

  async function performAction(
    key: string,
    action: () => Promise<unknown>,
    successMessage: string,
  ) {
    setBusyAction(key);
    try {
      await action();
      notifySuccess(successMessage);
    } catch (err) {
      notifyError(
        "Operation failed",
        err instanceof Error ? err.message : "Please try again.",
      );
    } finally {
      setBusyAction(null);
    }
  }

  async function handleCallNext() {
    setBusyAction("call-next");
    try {
      const result = await callNext({ queueId: typedQueueId });
      if (result) {
        notifySuccess(`Token #${result.tokenNumber} has been called.`);
      } else {
        notifyInfo("No waiting customers", "There are no waiting customers.");
      }
    } catch (err) {
      notifyError(
        "Could not call the next customer",
        err instanceof Error ? err.message : "Please try again.",
      );
    } finally {
      setBusyAction(null);
    }
  }

  function handleSkipConfirm() {
    if (!skipTarget) {
      return;
    }
    const { tokenId } = skipTarget;
    setSkipTarget(null);
    void performAction(
      tokenId,
      () =>
        skipToken({
          tokenId,
        }),
      `Token #${skipTarget.tokenNumber} skipped.`,
    );
  }

  async function handleBroadcast() {
    const message = broadcastMessage.trim();
    if (!message) {
      return;
    }

    setSendingBroadcast(true);
    try {
      await createBroadcast({
        businessId: typedBusinessId,
        queueId: typedQueueId,
        message,
        expiresInMinutes: broadcastMinutes,
      });
      setBroadcastMessage("");
      notifySuccess("Announcement sent to everyone in the queue.");
    } catch (err) {
      notifyError(
        "Could not send the announcement",
        err instanceof Error ? err.message : "Please try again.",
      );
    } finally {
      setSendingBroadcast(false);
    }
  }

  if (queue === undefined || tokens === undefined || services === undefined) {
    return (
      <div className="flex flex-col gap-6">
        <div className="space-y-2">
          <Skeleton className="h-8 w-64" />
          <Skeleton className="h-4 w-full max-w-xl" />
        </div>
        <Skeleton className="h-28 rounded-3xl" />
        <Skeleton className="h-8 w-64" />
        <Skeleton className="h-64 rounded-3xl" />
      </div>
    );
  }

  if (!queue || queue.businessId !== typedBusinessId) {
    return (
      <Empty className="justify-center py-24">
        <EmptyContent>
          <EmptyMedia variant="icon">
            <HugeiconsIcon icon={Queue02Icon} strokeWidth={2} />
          </EmptyMedia>
          <EmptyTitle>Queue not found</EmptyTitle>
          <EmptyDescription>
            This queue may have been removed or the link is incorrect.
          </EmptyDescription>
        </EmptyContent>
        <Link
          href={`/business/${businessId}/queues`}
          className={cn(buttonVariants({ size: "sm" }))}
        >
          <HugeiconsIcon
            icon={ArrowLeft01Icon}
            strokeWidth={2}
            data-icon="inline-start"
          />
          Return to queues
        </Link>
      </Empty>
    );
  }

  const service = services.find((item) => item._id === queue.serviceId);

  const waiting = tokens.filter((token) => token.status === "waiting");
  const called = tokens.filter((token) => token.status === "called");
  const checkedIn = tokens.filter((token) => token.status === "checked_in");
  const serving = tokens.filter((token) => token.status === "serving");

  const counts: Array<[string, number]> = [
    ["Waiting", waiting.length],
    ["Called", called.length],
    ["Checked in", checkedIn.length],
    ["Serving", serving.length],
  ];

  return (
    <div className="flex flex-col gap-6">
      <div>
        <Link
          href={`/business/${businessId}/queues`}
          className="inline-flex items-center gap-1.5 text-sm text-muted-foreground transition-colors hover:text-foreground"
        >
          <HugeiconsIcon icon={ArrowLeft01Icon} strokeWidth={2} data-icon="inline-start" />
          Queue management
        </Link>

        <div className="mt-2 flex flex-wrap items-start justify-between gap-4">
          <div className="min-w-0">
            <h1 className="font-heading text-3xl font-bold tracking-tight">
              {queue.name}
            </h1>
            <p className="mt-1 text-muted-foreground">{queue.description}</p>
            <p className="mt-2 text-sm text-muted-foreground">
              Service: {service?.name ?? "Service unavailable"}
            </p>
          </div>

          <Badge
            variant={statusVariant(queue.status)}
            className="h-5 rounded-full capitalize"
          >
            {queue.status}
          </Badge>
        </div>
      </div>

      <section className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {counts.map(([label, count]) => (
          <Card key={label}>
            <CardHeader>
              <CardTitle className="text-sm font-normal text-muted-foreground">
                {label}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="font-heading text-3xl font-bold tracking-tight">
                {count}
              </p>
            </CardContent>
          </Card>
        ))}
      </section>

      <Card>
        <CardHeader className="flex-row items-center justify-between gap-4">
          <div className="grid gap-1">
            <CardTitle>Queue controls</CardTitle>
            <CardDescription>
              Call the earliest waiting customer in this queue.
            </CardDescription>
          </div>
          <Button
            disabled={
              busyAction !== null ||
              queue.status !== "active" ||
              waiting.length === 0
            }
            onClick={handleCallNext}
          >
            {busyAction === "call-next" ? (
              <Spinner data-icon="inline-start" />
            ) : null}
            {busyAction === "call-next"
              ? "Calling…"
              : "Call next customer"}
          </Button>
        </CardHeader>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <HugeiconsIcon
              icon={Megaphone01Icon}
              strokeWidth={2}
              className="size-5 text-primary"
            />
            Broadcast an announcement
          </CardTitle>
          <CardDescription>
            Send a short message to every customer currently in this queue. It
            disappears automatically when it expires.
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-3">
          <Textarea
            value={broadcastMessage}
            onChange={(event) => setBroadcastMessage(event.target.value)}
            maxLength={500}
            rows={3}
            placeholder="e.g. Our card machine is down — please carry cash."
            aria-label="Announcement message"
          />

          <div className="flex flex-wrap items-center justify-between gap-3">
            <Select
              value={String(broadcastMinutes)}
              onValueChange={(value) =>
                setBroadcastMinutes(Number(value ?? DEFAULT_BROADCAST_TTL))
              }
            >
              <SelectTrigger
                aria-label="Announcement duration"
                className="w-40"
              >
                <SelectValue>{`${broadcastMinutes} min`}</SelectValue>
              </SelectTrigger>
              <SelectContent>
                {BROADCAST_TTL_OPTIONS.map((minutes) => (
                  <SelectItem key={minutes} value={String(minutes)}>
                    {minutes >= 60 ? `${minutes / 60} hr` : `${minutes} min`}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Button
              disabled={
                sendingBroadcast || broadcastMessage.trim().length === 0
              }
              onClick={handleBroadcast}
            >
              {sendingBroadcast ? <Spinner data-icon="inline-start" /> : null}
              {sendingBroadcast ? "Sending…" : "Send announcement"}
            </Button>
          </div>
        </CardContent>
      </Card>

      {broadcasts && broadcasts.length > 0 ? (
        <Card>
          <CardHeader>
            <CardTitle>Active announcements</CardTitle>
            <CardDescription>
              Visible to customers in this queue until they expire.
            </CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col gap-3">
            {broadcasts.map((broadcast) => (
              <div
                key={broadcast._id}
                className="flex flex-wrap items-start justify-between gap-3 rounded-xl border p-3"
              >
                <div className="min-w-0">
                  <p className="whitespace-pre-wrap text-sm">
                    {broadcast.message}
                  </p>
                  <p className="mt-1 text-xs text-muted-foreground">
                    Expires {formatDateTimeIST(broadcast.expiresAt)}
                    {broadcast.queueId === undefined
                      ? " · all queues"
                      : ""}
                  </p>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  disabled={busyAction !== null}
                  onClick={() =>
                    void performAction(
                      broadcast._id,
                      () =>
                        removeBroadcast({
                          broadcastId: broadcast._id,
                        }),
                      "Announcement stopped.",
                    )
                  }
                >
                  {busyAction === broadcast._id ? (
                    <Spinner data-icon="inline-start" />
                  ) : null}
                  Stop
                </Button>
              </div>
            ))}
          </CardContent>
        </Card>
      ) : null}

      <div>
        <h2 className="font-heading text-xl font-bold tracking-tight">
          Active tokens
        </h2>
        <p className="mt-1 text-sm text-muted-foreground">
          This list updates automatically when token statuses change.
        </p>
      </div>

      {tokens.length === 0 ? (
        <Empty className="border-dashed">
          <EmptyContent>
            <EmptyMedia variant="icon">
              <HugeiconsIcon icon={Clock01Icon} strokeWidth={2} />
            </EmptyMedia>
            <EmptyTitle>No active tokens</EmptyTitle>
            <EmptyDescription>
              Customers who join this queue will appear here.
            </EmptyDescription>
          </EmptyContent>
        </Empty>
      ) : (
        <div className="flex flex-col gap-3">
          {tokens.map((token) => (
            <Card key={token._id} size="sm">
              <CardContent className="gap-3">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="min-w-0">
                    <h3 className="font-heading text-lg font-bold tracking-tight">
                      Token #{token.tokenNumber}
                    </h3>
                    <p className="mt-1 flex items-center gap-1.5 text-sm text-muted-foreground">
                      <HugeiconsIcon icon={Clock01Icon} strokeWidth={2} data-icon="inline-start" />
                      Joined {formatDate(token.joinedAt)}
                    </p>

                    {token.customerNote ? (
                      <p className="mt-2 text-sm">
                        Note: {token.customerNote}
                      </p>
                    ) : null}

                    {token.graceDeadlineAt !== undefined &&
                      token.status === "called" ? (
                      <p className="mt-2 text-sm text-amber-600 dark:text-amber-500">
                        Check-in deadline: {formatDate(token.graceDeadlineAt)}
                      </p>
                    ) : null}
                  </div>

                  <Badge
                    variant={statusVariant(token.status)}
                    className="h-5 rounded-full capitalize"
                  >
                    {titleCase(token.status)}
                  </Badge>
                </div>

                <div className="flex flex-wrap gap-2 border-t pt-3">
                  {token.status === "checked_in" ? (
                    <Button
                      size="sm"
                      disabled={busyAction !== null}
                      onClick={() =>
                        void performAction(
                          token._id,
                          () =>
                            startServing({
                              tokenId: token._id,
                            }),
                          `Service started for token #${token.tokenNumber}.`,
                        )
                      }
                    >
                      {busyAction === token._id ? (
                        <Spinner data-icon="inline-start" />
                      ) : null}
                      {busyAction === token._id
                        ? "Processing…"
                        : "Start service"}
                    </Button>
                  ) : null}

                  {token.status === "serving" ? (
                    <Button
                      size="sm"
                      disabled={busyAction !== null}
                      onClick={() =>
                        void performAction(
                          token._id,
                          () =>
                            completeToken({
                              tokenId: token._id,
                            }),
                          `Token #${token.tokenNumber} completed.`,
                        )
                      }
                    >
                      {busyAction === token._id ? (
                        <Spinner data-icon="inline-start" />
                      ) : null}
                      {busyAction === token._id
                        ? "Processing…"
                        : "Complete service"}
                    </Button>
                  ) : null}

                  {["waiting", "called", "checked_in"].includes(
                    token.status,
                  ) ? (
                    <Button
                      variant="outline"
                      size="sm"
                      className="text-destructive hover:bg-destructive/10 hover:text-destructive"
                      disabled={busyAction !== null}
                      onClick={() =>
                        setSkipTarget({
                          tokenId: token._id,
                          tokenNumber: token.tokenNumber,
                        })
                      }
                    >
                      Skip token
                    </Button>
                  ) : null}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <AlertDialog
        open={skipTarget !== null}
        onOpenChange={(open) => {
          if (!open) {
            setSkipTarget(null);
          }
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogMedia>
              <HugeiconsIcon icon={Clock01Icon} strokeWidth={2} />
            </AlertDialogMedia>
            <AlertDialogTitle>Skip token #{skipTarget?.tokenNumber}?</AlertDialogTitle>
            <AlertDialogDescription>
              The customer will be moved out of the active queue. This cannot be
              undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction variant="destructive" onClick={handleSkipConfirm}>
              Skip token
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}