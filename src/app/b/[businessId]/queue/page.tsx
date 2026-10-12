"use client";

import Link from "next/link";
import { use } from "react";
import { useState } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "@/../convex/_generated/api";
import type { Id } from "@/../convex/_generated/dataModel";

export default function JoinQueuePage({
  params,
}: {
  params: Promise<{ businessId: string }>;
}) {
  const { businessId } = use(params);
  const id = businessId as Id<"businesses">;

  const [queueId, setQueueId] = useState("");
  const [acknowledged, setAcknowledged] = useState<Record<string, boolean>>({});
  const [customerNote, setCustomerNote] = useState("");
  const [error, setError] = useState("");
  const [result, setResult] = useState<{
    tokenId: Id<"queueTokens">;
    tokenNumber: number;
    status: string;
  } | null>(null);

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

  const selectedQueue = queues?.find((queue) => queue._id === queueId);

  const selectedService = selectedQueue
    ? services?.find((service) => service._id === selectedQueue.serviceId)
    : undefined;

  async function handleJoin() {
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

    try {
      const response = await joinQueue({
        queueId: selectedQueue._id,
        acknowledgedPrerequisites: selectedQueue.prerequisites
          .filter((item) => acknowledged[item.id])
          .map((item) => ({
            prerequisiteId: item.id,
            acknowledgedAt: Date.now(),
          })),
        ...(customerNote.trim() ? { customerNote: customerNote.trim() } : {}),
      });

      setResult(response);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Unable to join this queue.",
      );
    }
  }

  if (
    business === undefined ||
    queues === undefined ||
    services === undefined
  ) {
    return <main className="p-6">Loading queues...</main>;
  }

  if (!business) {
    return <main className="p-6">Business unavailable.</main>;
  }

  return (
    <main className="mx-auto max-w-3xl space-y-6 p-6">
      <Link
        href={`/b/${businessId}`}
        className="text-sm text-gray-500 hover:underline"
      >
        ← Back to {business.name}
      </Link>

      <header>
        <h1 className="text-3xl font-semibold">Join a queue</h1>
        <p className="mt-2 text-gray-500">{business.name}</p>
      </header>

      {result ? (
        <section className="space-y-4 rounded-xl border p-6">
          <p className="text-sm text-green-700">You have joined the queue.</p>
          <h2 className="text-5xl font-bold">#{result.tokenNumber}</h2>
          <p className="text-gray-600">
            Your status:{" "}
            <span className="font-medium capitalize">{result.status}</span>
          </p>
          <p className="break-all text-xs text-gray-500">
            Token ID: {result.tokenId}
          </p>
          <Link href="/my-day" className="inline-block underline">
            View my day →
          </Link>
        </section>
      ) : (
        <section className="space-y-5 rounded-xl border p-5">
          <label className="grid gap-2">
            <span className="text-sm font-medium">Queue</span>
            <select
              value={queueId}
              onChange={(event) => {
                setQueueId(event.target.value);
                setAcknowledged({});
              }}
              className="rounded-lg border px-3 py-2"
            >
              <option value="">Choose a queue</option>
              {queues.map((queue) => {
                const service = services.find(
                  (item) => item._id === queue.serviceId,
                );

                return (
                  <option key={queue._id} value={queue._id}>
                    {queue.name}
                    {service ? ` — ${service.name}` : ""}
                  </option>
                );
              })}
            </select>
          </label>

          {selectedQueue && (
            <>
              <div>
                <h2 className="font-semibold">{selectedQueue.name}</h2>
                <p className="mt-1 text-sm text-gray-600">
                  {selectedQueue.description}
                </p>
                {selectedService && (
                  <p className="mt-2 text-sm text-gray-500">
                    Service duration: {selectedService.durationMinutes} minutes
                  </p>
                )}
              </div>

              {selectedQueue.prerequisites.length > 0 && (
                <section className="space-y-3">
                  <h3 className="font-medium">Before you join</h3>

                  {selectedQueue.prerequisites.map((item) => (
                    <label
                      key={item.id}
                      className="flex items-start gap-3 rounded-lg border p-3"
                    >
                      <input
                        type="checkbox"
                        checked={Boolean(acknowledged[item.id])}
                        onChange={(event) =>
                          setAcknowledged((previous) => ({
                            ...previous,
                            [item.id]: event.target.checked,
                          }))
                        }
                        className="mt-1"
                      />
                      <span>
                        <span className="block text-sm font-medium">
                          {item.label}
                          {item.isRequired ? " *" : ""}
                        </span>
                        {item.description && (
                          <span className="mt-1 block text-sm text-gray-500">
                            {item.description}
                          </span>
                        )}
                      </span>
                    </label>
                  ))}
                </section>
              )}

              <label className="grid gap-2">
                <span className="text-sm font-medium">Note (optional)</span>
                <textarea
                  rows={3}
                  maxLength={1000}
                  value={customerNote}
                  onChange={(event) => setCustomerNote(event.target.value)}
                  placeholder="Add a note for the business"
                  className="resize-y rounded-lg border px-3 py-2"
                />
              </label>
            </>
          )}

          {error && (
            <p role="alert" className="text-sm text-red-600">
              {error}
            </p>
          )}

          <button
            type="button"
            onClick={handleJoin}
            disabled={!selectedQueue}
            className="w-full rounded-lg bg-black px-4 py-3 font-medium text-white disabled:opacity-40"
          >
            Join queue
          </button>

          <p className="text-xs text-gray-500">
            Joining requires you to be signed in. Your ticket is created only
            after the server validates your request.
          </p>
        </section>
      )}
    </main>
  );
}
