"use client";

import Link from "next/link";
import { use, useState } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "@/../convex/_generated/api";
import type { Id } from "@/../convex/_generated/dataModel";

type PageProps = {
  params: Promise<{
    businessId: string;
    queueId: string;
  }>;
};

const activeStatuses = ["waiting", "called", "checked_in", "serving"];

function formatDate(timestamp: number) {
  return new Date(timestamp).toLocaleString("en-IN", {
    dateStyle: "medium",
    timeStyle: "short",
  });
}

function titleCase(value: string) {
  return value.replaceAll("_", " ").replace(/\b\w/g, (c) => c.toUpperCase());
}

export default function BusinessQueueOperationsPage({ params }: PageProps) {
  const { businessId, queueId } = use(params);

  const typedQueueId = queueId as Id<"queues">;
  const typedBusinessId = businessId as Id<"businesses">;

  const queue = useQuery(api.queue.getById, {
    queueId: typedQueueId,
  });

  const services = useQuery(api.services.getByBusiness, {
    businessId: typedBusinessId,
  });

  const tokens = useQuery(api.queueCapacity.getActiveTokensByQueue, {
    queueId: typedQueueId,
  });

  const callNext = useMutation(api.queueCapacity.callNext);
  const startServing = useMutation(api.queueCapacity.startServing);
  const completeToken = useMutation(api.queueCapacity.completeToken);
  const skipToken = useMutation(api.queueCapacity.skipToken);

  const [busyAction, setBusyAction] = useState<string | null>(null);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");

  async function performAction(
    key: string,
    action: () => Promise<unknown>,
    successMessage: string,
  ) {
    setBusyAction(key);
    setError("");
    setNotice("");

    try {
      await action();
      setNotice(successMessage);
    } catch (err) {
      setError(err instanceof Error ? err.message : "The operation failed.");
    } finally {
      setBusyAction(null);
    }
  }

  async function handleCallNext() {
    setBusyAction("call-next");
    setError("");
    setNotice("");

    try {
      const result = await callNext({ queueId: typedQueueId });

      setNotice(
        result
          ? `Token #${result.tokenNumber} has been called.`
          : "There are no waiting customers.",
      );
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Could not call the next customer.",
      );
    } finally {
      setBusyAction(null);
    }
  }

  if (queue === undefined || tokens === undefined || services === undefined) {
    return <main className="p-6">Loading queue operations...</main>;
  }

  if (!queue || queue.businessId !== typedBusinessId) {
    return (
      <main className="space-y-4 p-6">
        <h1 className="text-2xl font-semibold">Queue not found</h1>
        <Link href={`/business/${businessId}/queues`} className="underline">
          Return to queues
        </Link>
      </main>
    );
  }

  const service = services.find((item) => item._id === queue.serviceId);

  const waiting = tokens.filter((token) => token.status === "waiting");
  const called = tokens.filter((token) => token.status === "called");
  const checkedIn = tokens.filter((token) => token.status === "checked_in");
  const serving = tokens.filter((token) => token.status === "serving");

  return (
    <main className="mx-auto max-w-6xl space-y-6 p-6">
      <header className="space-y-2">
        <Link
          href={`/business/${businessId}/queues`}
          className="text-sm text-gray-500 hover:underline"
        >
          ← Queue management
        </Link>

        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <h1 className="text-3xl font-semibold">{queue.name}</h1>
            <p className="mt-2 text-gray-600">{queue.description}</p>
            <p className="mt-2 text-sm text-gray-500">
              Service: {service?.name ?? "Service unavailable"}
            </p>
          </div>

          <span className="rounded-full border px-3 py-1 text-sm capitalize">
            {queue.status}
          </span>
        </div>
      </header>

      {error && (
        <p
          role="alert"
          className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700"
        >
          {error}
        </p>
      )}

      {notice && (
        <p
          role="status"
          className="rounded-lg border border-green-200 bg-green-50 p-3 text-sm text-green-800"
        >
          {notice}
        </p>
      )}

      <section className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {[
          ["Waiting", waiting.length],
          ["Called", called.length],
          ["Checked in", checkedIn.length],
          ["Serving", serving.length],
        ].map(([label, count]) => (
          <div key={label} className="rounded-xl border p-4">
            <p className="text-sm text-gray-500">{label}</p>
            <p className="mt-2 text-3xl font-semibold">{count}</p>
          </div>
        ))}
      </section>

      <section className="flex flex-wrap items-center justify-between gap-3 rounded-xl border p-4">
        <div>
          <h2 className="font-semibold">Queue controls</h2>
          <p className="mt-1 text-sm text-gray-500">
            Call the earliest waiting customer in this queue.
          </p>
        </div>

        <button
          type="button"
          disabled={
            busyAction !== null ||
            queue.status !== "active" ||
            waiting.length === 0
          }
          onClick={handleCallNext}
          className="rounded-lg bg-black px-4 py-2.5 text-sm text-white disabled:opacity-40"
        >
          {busyAction === "call-next" ? "Calling..." : "Call next customer"}
        </button>
      </section>

      <section className="space-y-4">
        <div>
          <h2 className="text-xl font-semibold">Active tokens</h2>
          <p className="mt-1 text-sm text-gray-500">
            This list updates automatically when token statuses change.
          </p>
        </div>

        {tokens.length === 0 ? (
          <div className="rounded-xl border border-dashed p-8 text-center">
            <p className="font-medium">No active tokens</p>
            <p className="mt-2 text-sm text-gray-500">
              Customers who join this queue will appear here.
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {tokens.map((token) => (
              <article key={token._id} className="rounded-xl border p-4">
                <div className="flex flex-wrap items-start justify-between gap-4">
                  <div>
                    <h3 className="text-lg font-semibold">
                      Token #{token.tokenNumber}
                    </h3>
                    <p className="mt-1 text-sm text-gray-500">
                      Joined {formatDate(token.joinedAt)}
                    </p>

                    {token.customerNote && (
                      <p className="mt-2 text-sm">Note: {token.customerNote}</p>
                    )}

                    {token.graceDeadlineAt !== undefined &&
                      token.status === "called" && (
                        <p className="mt-2 text-sm text-amber-700">
                          Check-in deadline: {formatDate(token.graceDeadlineAt)}
                        </p>
                      )}
                  </div>

                  <span className="rounded-full bg-gray-100 px-3 py-1 text-sm">
                    {titleCase(token.status)}
                  </span>
                </div>

                <div className="mt-4 flex flex-wrap gap-2 border-t pt-4">
                  {token.status === "checked_in" && (
                    <button
                      type="button"
                      disabled={busyAction !== null}
                      onClick={() =>
                        performAction(
                          token._id,
                          () =>
                            startServing({
                              tokenId: token._id,
                            }),
                          `Service started for token #${token.tokenNumber}.`,
                        )
                      }
                      className="rounded-lg bg-black px-3 py-2 text-sm text-white disabled:opacity-40"
                    >
                      {busyAction === token._id
                        ? "Processing..."
                        : "Start service"}
                    </button>
                  )}

                  {token.status === "serving" && (
                    <button
                      type="button"
                      disabled={busyAction !== null}
                      onClick={() =>
                        performAction(
                          token._id,
                          () =>
                            completeToken({
                              tokenId: token._id,
                            }),
                          `Token #${token.tokenNumber} completed.`,
                        )
                      }
                      className="rounded-lg bg-black px-3 py-2 text-sm text-white disabled:opacity-40"
                    >
                      {busyAction === token._id
                        ? "Processing..."
                        : "Complete service"}
                    </button>
                  )}

                  {["waiting", "called", "checked_in"].includes(
                    token.status,
                  ) && (
                    <button
                      type="button"
                      disabled={busyAction !== null}
                      onClick={() => {
                        if (
                          !window.confirm(`Skip token #${token.tokenNumber}?`)
                        ) {
                          return;
                        }

                        void performAction(
                          token._id,
                          () =>
                            skipToken({
                              tokenId: token._id,
                            }),
                          `Token #${token.tokenNumber} skipped.`,
                        );
                      }}
                      className="rounded-lg border border-red-200 px-3 py-2 text-sm text-red-700 disabled:opacity-40"
                    >
                      Skip token
                    </button>
                  )}
                </div>
              </article>
            ))}
          </div>
        )}
      </section>
    </main>
  );
}
