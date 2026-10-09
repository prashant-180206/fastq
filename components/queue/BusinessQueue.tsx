"use client";

import { useEffect, useMemo, useState } from "react";
import { useMutation, useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import type { Id } from "@/convex/_generated/dataModel";

import {
  AlertCircle,
  CheckCircle2,
  ChevronRight,
  Clock3,
  Loader2,
  Pause,
  Play,
  Plus,
  RotateCcw,
  SkipForward,
  Users,
  XCircle,
} from "lucide-react";

import { Button } from "@/components/ui/button";

type QueueStatus = "ACTIVE" | "PAUSED" | "CLOSED";

type BusinessQueueProps = {
  businessId: string;
};

const QUEUE_STATUS: Record<
  QueueStatus,
  {
    label: string;
    className: string;
  }
> = {
  ACTIVE: {
    label: "Active",
    className:
      "border-green-500/30 bg-green-500/10 text-green-700 dark:text-green-400",
  },
  PAUSED: {
    label: "Paused",
    className:
      "border-yellow-500/30 bg-yellow-500/10 text-yellow-700 dark:text-yellow-400",
  },
  CLOSED: {
    label: "Closed",
    className: "border-destructive/30 bg-destructive/10 text-destructive",
  },
};

const TOKEN_STATUS = {
  WAITING: "WAITING",
  CALLED: "CALLED",
  SERVING: "SERVING",
} as const;

function getErrorMessage(error: unknown) {
  return error instanceof Error ? error.message : "Something went wrong.";
}

export default function BusinessQueue({ businessId }: BusinessQueueProps) {
  const businessIdTyped = businessId as Id<"businesses">;

  const queues = useQuery(api.queues.list, {
    businessId: businessIdTyped,
    activeOnly: false,
  });

  const services = useQuery(api.services.list, {
    businessId: businessIdTyped,
    activeOnly: true,
  });

  const [selectedQueueId, setSelectedQueueId] = useState<Id<"queues"> | null>(
    null,
  );

  const [error, setError] = useState<string | null>(null);

  const [creating, setCreating] = useState(false);
  const [createOpen, setCreateOpen] = useState(false);

  const [queueName, setQueueName] = useState("");
  const [queueDescription, setQueueDescription] = useState("");
  const [queueType, setQueueType] = useState("GENERAL");
  const [queueServiceId, setQueueServiceId] = useState<Id<"services"> | "">("");

  const createQueue = useMutation(api.queues.create);
  const updateQueue = useMutation(api.queues.update);

  const pauseQueue = useMutation(api.queues.pause);
  const resumeQueue = useMutation(api.queues.resume);
  const closeQueue = useMutation(api.queues.close);

  const callNext = useMutation(api.queues.callNext);
  const callToken = useMutation(api.queues.call);
  const recallToken = useMutation(api.queues.recall);

  const startServing = useMutation(api.queues.startServing);
  const completeToken = useMutation(api.queues.complete);

  const skipToken = useMutation(api.queues.skip);
  const noShowToken = useMutation(api.queues.noShow);

  useEffect(() => {
    if (!queues || queues.length === 0) {
      setSelectedQueueId(null);
      return;
    }

    setSelectedQueueId((current) => {
      if (current && queues.some((queue) => queue._id === current)) {
        return current;
      }

      return queues[0]._id;
    });
  }, [queues]);

  const selectedQueue = useMemo(
    () => queues?.find((queue) => queue._id === selectedQueueId) ?? null,
    [queues, selectedQueueId],
  );

  const liveState = useQuery(
    api.queues.getLiveState,
    selectedQueueId
      ? {
          queueId: selectedQueueId,
        }
      : "skip",
  );

  const isLoading = queues === undefined || services === undefined;

  async function runAction(action: () => Promise<unknown>) {
    setError(null);

    try {
      await action();
    } catch (err) {
      setError(getErrorMessage(err));
    }
  }

  function openCreateDialog() {
    setError(null);
    setQueueName("");
    setQueueDescription("");
    setQueueType("GENERAL");

    const firstService = services?.[0];

    setQueueServiceId(firstService?._id ?? "");
    setCreateOpen(true);
  }

  async function handleCreateQueue() {
    if (!queueName.trim()) {
      setError("Queue name is required.");
      return;
    }

    if (!queueServiceId) {
      setError("Select a service for this queue.");
      return;
    }

    setCreating(true);
    setError(null);

    try {
      const queueId = await createQueue({
        businessId: businessIdTyped,
        serviceId: queueServiceId,
        name: queueName.trim(),
        description: queueDescription.trim() || undefined,
        type: queueType.trim() || "GENERAL",
      });

      setCreateOpen(false);
      setSelectedQueueId(queueId);
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setCreating(false);
    }
  }

  async function handleRenameQueue() {
    if (!selectedQueue) return;

    const name = window.prompt("Queue name", selectedQueue.name);

    if (name === null) return;

    if (!name.trim()) {
      setError("Queue name cannot be empty.");
      return;
    }

    await runAction(() =>
      updateQueue({
        queueId: selectedQueue._id,
        name: name.trim(),
      }),
    );
  }

  async function handleCloseQueue() {
    if (!selectedQueue) return;

    const confirmed = window.confirm(
      `Close "${selectedQueue.name}"? A closed queue cannot be resumed.`,
    );

    if (!confirmed) return;

    await runAction(() =>
      closeQueue({
        queueId: selectedQueue._id,
      }),
    );
  }

  async function handleCallNext() {
    if (!selectedQueue) return;

    await runAction(() =>
      callNext({
        queueId: selectedQueue._id,
      }),
    );
  }

  if (isLoading) {
    return (
      <div className="mx-auto w-full max-w-7xl space-y-6 p-4 sm:p-6">
        <div className="space-y-2">
          <div className="h-8 w-48 animate-pulse rounded bg-muted" />
          <div className="h-5 w-72 animate-pulse rounded bg-muted" />
        </div>

        <div className="grid gap-4 lg:grid-cols-[280px_1fr]">
          <div className="h-96 animate-pulse rounded-xl bg-muted" />
          <div className="h-96 animate-pulse rounded-xl bg-muted" />
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto w-full max-w-7xl space-y-6 p-4 sm:p-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <div className="flex items-center gap-2">
            <Users className="h-6 w-6 text-primary" />

            <h1 className="text-2xl font-semibold tracking-tight">
              Queue management
            </h1>
          </div>

          <p className="mt-1 text-sm text-muted-foreground">
            Manage customers waiting in your queues in real time.
          </p>
        </div>

        <Button
          type="button"
          onClick={openCreateDialog}
          disabled={services.length === 0}
        >
          <Plus className="mr-2 h-4 w-4" />
          New queue
        </Button>
      </div>

      {/* Global error */}
      {error && (
        <div className="flex items-start gap-3 rounded-lg border border-destructive/30 bg-destructive/5 p-4 text-sm text-destructive">
          <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />

          <div className="flex-1">
            <p className="font-medium">Queue action failed</p>

            <p className="mt-1 opacity-90">{error}</p>
          </div>

          <button
            type="button"
            onClick={() => setError(null)}
            className="text-xs underline"
          >
            Dismiss
          </button>
        </div>
      )}

      {services.length === 0 && (
        <div className="rounded-xl border border-yellow-500/30 bg-yellow-500/5 p-5">
          <div className="flex gap-3">
            <AlertCircle className="mt-0.5 h-5 w-5 text-yellow-600" />

            <div>
              <h2 className="font-medium">No queue-enabled services</h2>

              <p className="mt-1 text-sm text-muted-foreground">
                Create an active service with queue support enabled before
                creating a queue.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Main layout */}
      <div className="grid gap-6 lg:grid-cols-[300px_1fr]">
        {/* Queue list */}
        <aside className="rounded-xl border bg-card">
          <div className="flex items-center justify-between border-b p-4">
            <div>
              <h2 className="font-semibold">Queues</h2>

              <p className="text-xs text-muted-foreground">
                {queues.length} total
              </p>
            </div>
          </div>

          {queues.length === 0 ? (
            <div className="p-6 text-center">
              <Users className="mx-auto h-8 w-8 text-muted-foreground" />

              <p className="mt-3 text-sm font-medium">No queues yet</p>

              <p className="mt-1 text-xs text-muted-foreground">
                Create your first queue to start accepting customers.
              </p>
            </div>
          ) : (
            <div className="divide-y">
              {queues.map((queue) => {
                const isSelected = queue._id === selectedQueueId;

                const status =
                  QUEUE_STATUS[queue.status as QueueStatus] ??
                  QUEUE_STATUS.CLOSED;

                return (
                  <button
                    key={queue._id}
                    type="button"
                    onClick={() => setSelectedQueueId(queue._id)}
                    className={[
                      "w-full p-4 text-left transition-colors",
                      isSelected ? "bg-muted/70" : "hover:bg-muted/40",
                    ].join(" ")}
                  >
                    <div className="flex items-start gap-3">
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2">
                          <span className="truncate font-medium">
                            {queue.name}
                          </span>

                          {isSelected && (
                            <ChevronRight className="h-4 w-4 shrink-0 text-primary" />
                          )}
                        </div>

                        <p className="mt-1 truncate text-xs text-muted-foreground">
                          {queue.type}
                        </p>

                        <span
                          className={[
                            "mt-2 inline-flex rounded-full border px-2 py-0.5 text-[11px] font-medium",
                            status.className,
                          ].join(" ")}
                        >
                          {status.label}
                        </span>
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          )}
        </aside>

        {/* Selected queue */}
        <main className="min-w-0">
          {!selectedQueue || !liveState ? (
            <div className="flex min-h-[400px] items-center justify-center rounded-xl border bg-card">
              <div className="text-center">
                <Users className="mx-auto h-10 w-10 text-muted-foreground" />

                <p className="mt-3 font-medium">Select a queue</p>

                <p className="mt-1 text-sm text-muted-foreground">
                  Choose a queue from the list to manage it.
                </p>
              </div>
            </div>
          ) : (
            <div className="space-y-6">
              {/* Queue header */}
              <div className="rounded-xl border bg-card p-5">
                <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                  <div>
                    <div className="flex flex-wrap items-center gap-2">
                      <h2 className="text-xl font-semibold">
                        {selectedQueue.name}
                      </h2>

                      <span
                        className={[
                          "rounded-full border px-2.5 py-1 text-xs font-medium",
                          QUEUE_STATUS[selectedQueue.status as QueueStatus]
                            ?.className,
                        ].join(" ")}
                      >
                        {
                          QUEUE_STATUS[selectedQueue.status as QueueStatus]
                            ?.label
                        }
                      </span>
                    </div>

                    <p className="mt-1 text-sm text-muted-foreground">
                      {liveState.service?.name ?? "Service unavailable"}
                    </p>

                    {selectedQueue.description && (
                      <p className="mt-3 max-w-2xl text-sm text-muted-foreground">
                        {selectedQueue.description}
                      </p>
                    )}
                  </div>

                  <div className="flex flex-wrap gap-2">
                    {selectedQueue.status === "ACTIVE" ? (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() =>
                          runAction(() =>
                            pauseQueue({
                              queueId: selectedQueue._id,
                            }),
                          )
                        }
                      >
                        <Pause className="mr-2 h-4 w-4" />
                        Pause
                      </Button>
                    ) : selectedQueue.status === "PAUSED" ? (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() =>
                          runAction(() =>
                            resumeQueue({
                              queueId: selectedQueue._id,
                            }),
                          )
                        }
                      >
                        <Play className="mr-2 h-4 w-4" />
                        Resume
                      </Button>
                    ) : null}

                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handleRenameQueue}
                      disabled={selectedQueue.status === "CLOSED"}
                    >
                      Rename
                    </Button>

                    {selectedQueue.status !== "CLOSED" && (
                      <Button
                        variant="destructive"
                        size="sm"
                        onClick={handleCloseQueue}
                      >
                        <XCircle className="mr-2 h-4 w-4" />
                        Close
                      </Button>
                    )}
                  </div>
                </div>
              </div>

              {/* Stats */}
              <div className="grid gap-4 sm:grid-cols-3">
                <StatCard
                  label="Waiting"
                  value={liveState.waitingCount}
                  icon={<Clock3 className="h-5 w-5" />}
                />

                <StatCard
                  label="Called"
                  value={liveState.called.length}
                  icon={<Users className="h-5 w-5" />}
                />

                <StatCard
                  label="Serving"
                  value={liveState.serving.length}
                  icon={<CheckCircle2 className="h-5 w-5" />}
                />
              </div>

              {/* Primary action */}
              <div className="rounded-xl border bg-card p-5">
                <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <h3 className="font-semibold">Queue control</h3>

                    <p className="mt-1 text-sm text-muted-foreground">
                      Call the oldest waiting customer.
                    </p>
                  </div>

                  <Button
                    size="lg"
                    onClick={handleCallNext}
                    disabled={
                      selectedQueue.status !== "ACTIVE" ||
                      liveState.waitingCount === 0
                    }
                  >
                    <Play className="mr-2 h-4 w-4" />
                    Call next
                  </Button>
                </div>
              </div>

              {/* Now serving */}
              {liveState.nowServing && (
                <div className="rounded-xl border border-green-500/30 bg-green-500/5 p-5">
                  <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                      <p className="text-xs font-medium uppercase tracking-wide text-green-700 dark:text-green-400">
                        Now serving
                      </p>

                      <p className="mt-1 text-4xl font-bold tracking-tight">
                        #{liveState.nowServing.tokenNumber}
                      </p>

                      {liveState.nowServing.counterId && (
                        <p className="mt-1 text-sm text-muted-foreground">
                          Counter assigned
                        </p>
                      )}
                    </div>

                    <Button
                      onClick={() =>
                        runAction(() =>
                          completeToken({
                            tokenId: liveState.nowServing!._id,
                          }),
                        )
                      }
                    >
                      <CheckCircle2 className="mr-2 h-4 w-4" />
                      Complete
                    </Button>
                  </div>
                </div>
              )}

              {/* Called */}
              <TokenSection
                title="Called"
                description="Customers who have been called."
                emptyMessage="No customers have been called."
                tokens={liveState.called}
                renderActions={(token) => (
                  <div className="flex flex-wrap gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() =>
                        runAction(() =>
                          recallToken({
                            tokenId: token._id,
                          }),
                        )
                      }
                    >
                      <RotateCcw className="mr-2 h-4 w-4" />
                      Recall
                    </Button>

                    {token.counterId && (
                      <Button
                        size="sm"
                        onClick={() =>
                          runAction(() =>
                            startServing({
                              tokenId: token._id,
                            }),
                          )
                        }
                      >
                        <Play className="mr-2 h-4 w-4" />
                        Start serving
                      </Button>
                    )}

                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() =>
                        runAction(() =>
                          noShowToken({
                            tokenId: token._id,
                          }),
                        )
                      }
                    >
                      No-show
                    </Button>

                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() =>
                        runAction(() =>
                          skipToken({
                            tokenId: token._id,
                          }),
                        )
                      }
                    >
                      <SkipForward className="mr-2 h-4 w-4" />
                      Skip
                    </Button>
                  </div>
                )}
              />

              {/* Waiting */}
              <TokenSection
                title="Waiting"
                description="Customers currently waiting in line."
                emptyMessage="Nobody is waiting."
                tokens={liveState.waiting}
                renderActions={(token) => (
                  <div className="flex flex-wrap gap-2">
                    <Button
                      size="sm"
                      onClick={() =>
                        runAction(() =>
                          callToken({
                            tokenId: token._id,
                          }),
                        )
                      }
                    >
                      <Play className="mr-2 h-4 w-4" />
                      Call
                    </Button>

                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() =>
                        runAction(() =>
                          skipToken({
                            tokenId: token._id,
                          }),
                        )
                      }
                    >
                      <SkipForward className="mr-2 h-4 w-4" />
                      Skip
                    </Button>
                  </div>
                )}
              />
            </div>
          )}
        </main>
      </div>

      {/* Create queue dialog */}
      {createOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div
            role="dialog"
            aria-modal="true"
            className="w-full max-w-lg rounded-xl border bg-background p-6 shadow-xl"
          >
            <div className="mb-6">
              <h2 className="text-lg font-semibold">Create queue</h2>

              <p className="mt-1 text-sm text-muted-foreground">
                Create a queue for one of your queue-enabled services.
              </p>
            </div>

            <div className="space-y-4">
              <Field label="Queue name">
                <input
                  value={queueName}
                  onChange={(event) => setQueueName(event.target.value)}
                  placeholder="General queue"
                  className="h-10 w-full rounded-md border bg-background px-3 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
                />
              </Field>

              <Field label="Service">
                <select
                  value={queueServiceId}
                  onChange={(event) =>
                    setQueueServiceId(event.target.value as Id<"services">)
                  }
                  className="h-10 w-full rounded-md border bg-background px-3 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
                >
                  {services.map((service) => (
                    <option key={service._id} value={service._id}>
                      {service.name}
                    </option>
                  ))}
                </select>
              </Field>

              <Field label="Type">
                <select
                  value={queueType}
                  onChange={(event) => setQueueType(event.target.value)}
                  className="h-10 w-full rounded-md border bg-background px-3 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
                >
                  <option value="GENERAL">General</option>
                  <option value="WALK_IN">Walk-in</option>
                  <option value="APPOINTMENT">Appointment</option>
                </select>
              </Field>

              <Field label="Description" optional>
                <textarea
                  value={queueDescription}
                  onChange={(event) => setQueueDescription(event.target.value)}
                  placeholder="Optional description"
                  rows={3}
                  className="w-full resize-none rounded-md border bg-background px-3 py-2 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
                />
              </Field>
            </div>

            <div className="mt-6 flex justify-end gap-2">
              <Button
                type="button"
                variant="ghost"
                onClick={() => setCreateOpen(false)}
                disabled={creating}
              >
                Cancel
              </Button>

              <Button
                type="button"
                onClick={handleCreateQueue}
                disabled={creating}
              >
                {creating && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}

                {creating ? "Creating..." : "Create queue"}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/* Components                                                                 */
/* -------------------------------------------------------------------------- */

function StatCard({
  label,
  value,
  icon,
}: {
  label: string;
  value: number;
  icon: React.ReactNode;
}) {
  return (
    <div className="rounded-xl border bg-card p-5">
      <div className="flex items-center justify-between">
        <div className="text-sm text-muted-foreground">{label}</div>

        <div className="text-muted-foreground">{icon}</div>
      </div>

      <p className="mt-3 text-3xl font-semibold tracking-tight">{value}</p>
    </div>
  );
}

function TokenSection({
  title,
  description,
  emptyMessage,
  tokens,
  renderActions,
}: {
  title: string;
  description: string;
  emptyMessage: string;
  tokens: Array<{
    _id: Id<"queueTokens">;
    tokenNumber: string;
    position: number;
    estimatedWaitTime: number;
    counterId?: Id<"counters">;
  }>;
  renderActions: (token: {
    _id: Id<"queueTokens">;
    tokenNumber: string;
    position: number;
    estimatedWaitTime: number;
    counterId?: Id<"counters">;
  }) => React.ReactNode;
}) {
  return (
    <section className="rounded-xl border bg-card">
      <div className="border-b p-5">
        <h3 className="font-semibold">{title}</h3>

        <p className="mt-1 text-sm text-muted-foreground">{description}</p>
      </div>

      {tokens.length === 0 ? (
        <div className="p-8 text-center">
          <Users className="mx-auto h-8 w-8 text-muted-foreground" />

          <p className="mt-3 text-sm text-muted-foreground">{emptyMessage}</p>
        </div>
      ) : (
        <div className="divide-y">
          {tokens.map((token) => (
            <div
              key={token._id}
              className="flex flex-col gap-4 p-5 sm:flex-row sm:items-center sm:justify-between"
            >
              <div className="flex items-center gap-4">
                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-lg bg-muted text-lg font-bold">
                  {token.tokenNumber}
                </div>

                <div>
                  <p className="font-medium">Token #{token.tokenNumber}</p>

                  <p className="mt-1 text-xs text-muted-foreground">
                    Position {token.position}
                    {" · "}~{token.estimatedWaitTime} min wait
                  </p>

                  {token.counterId && (
                    <p className="mt-1 text-xs text-muted-foreground">
                      Counter assigned
                    </p>
                  )}
                </div>
              </div>

              <div className="sm:shrink-0">{renderActions(token)}</div>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}

function Field({
  label,
  optional = false,
  children,
}: {
  label: string;
  optional?: boolean;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-1.5">
      <label className="text-sm font-medium">
        {label}

        {optional && (
          <span className="ml-1 font-normal text-muted-foreground">
            (optional)
          </span>
        )}
      </label>

      {children}
    </div>
  );
}
