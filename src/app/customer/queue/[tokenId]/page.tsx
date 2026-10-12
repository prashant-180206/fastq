"use client";

import Link from "next/link";
import { use, useState } from "react";
import { useRouter } from "next/navigation";
import { useMutation, useQuery } from "convex/react";
import { api } from "@/../convex/_generated/api";
import type { Id } from "@/../convex/_generated/dataModel";

type PageProps = {
  params: Promise<{ tokenId: string }>;
};

const cancellableStatuses = ["waiting", "called", "checked_in"];

function formatDate(timestamp?: number) {
  if (timestamp === undefined) return "—";

  return new Date(timestamp).toLocaleString("en-IN", {
    dateStyle: "medium",
    timeStyle: "short",
  });
}

function titleCase(value: string) {
  return value.replaceAll("_", " ").replace(/\b\w/g, (c) => c.toUpperCase());
}

export default function CustomerQueueTokenPage({ params }: PageProps) {
  const { tokenId } = use(params);
  const router = useRouter();

  const token = useQuery(api.business.queueCapacity.getMyTokenById, {
    tokenId: tokenId as Id<"queueTokens">,
  });

  const checkIn = useMutation(api.business.queueCapacity.checkInToken);
  const cancel = useMutation(api.business.queueCapacity.cancelToken);

  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  async function handleCheckIn() {
    setBusy(true);
    setError("");

    try {
      await checkIn({ tokenId: tokenId as Id<"queueTokens"> });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to check in.");
    } finally {
      setBusy(false);
    }
  }

  async function handleCancel() {
    if (!window.confirm("Cancel this queue token?")) return;

    setBusy(true);
    setError("");

    try {
      await cancel({ tokenId: tokenId as Id<"queueTokens"> });
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Unable to cancel the token.",
      );
    } finally {
      setBusy(false);
    }
  }

  if (token === undefined) {
    return <main className="p-6">Loading token...</main>;
  }

  if (token === null) {
    return (
      <main className="mx-auto max-w-2xl space-y-4 p-6">
        <h1 className="text-2xl font-bold">Token not found</h1>
        <p className="text-gray-600">
          This token may not exist or may not belong to your account.
        </p>
        <Link href="/customer/queue" className="underline">
          Return to my queues
        </Link>
      </main>
    );
  }

  const canCheckIn = token.status === "called";
  const canCancel = cancellableStatuses.includes(token.status);

  return (
    <main className="mx-auto max-w-2xl space-y-6 p-6">
      <header>
        <Link href="/customer/queue" className="text-sm underline">
          ← My queue tokens
        </Link>
        <h1 className="mt-3 text-3xl font-bold">
          Queue token #{token.tokenNumber}
        </h1>
        <p className="mt-2 text-gray-600">
          Review your token and take any available action.
        </p>
      </header>

      <section className="space-y-4 rounded-xl border p-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <span className="text-gray-500">Current status</span>
          <span className="rounded-full bg-gray-100 px-3 py-1 text-sm font-medium">
            {titleCase(token.status)}
          </span>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <p className="text-sm text-gray-500">Token number</p>
            <p className="mt-1 text-lg font-semibold">#{token.tokenNumber}</p>
          </div>
          <div>
            <p className="text-sm text-gray-500">Joined</p>
            <p className="mt-1 font-medium">{formatDate(token.joinedAt)}</p>
          </div>
          <div>
            <p className="text-sm text-gray-500">Called at</p>
            <p className="mt-1">{formatDate(token.calledAt)}</p>
          </div>
          <div>
            <p className="text-sm text-gray-500">Check-in time</p>
            <p className="mt-1">{formatDate(token.checkedInAt)}</p>
          </div>
          <div>
            <p className="text-sm text-gray-500">Service started</p>
            <p className="mt-1">{formatDate(token.serviceStartedAt)}</p>
          </div>
          <div>
            <p className="text-sm text-gray-500">Completed at</p>
            <p className="mt-1">{formatDate(token.completedAt)}</p>
          </div>
        </div>

        {token.graceDeadlineAt !== undefined && token.status === "called" && (
          <div className="rounded-lg border p-3">
            <p className="text-sm text-gray-500">Check-in deadline</p>
            <p className="font-medium">{formatDate(token.graceDeadlineAt)}</p>
          </div>
        )}

        {token.customerNote && (
          <div>
            <p className="text-sm text-gray-500">Your note</p>
            <p className="mt-1 whitespace-pre-wrap">{token.customerNote}</p>
          </div>
        )}

        <div className="flex flex-wrap gap-3 border-t pt-4">
          {canCheckIn && (
            <button
              type="button"
              disabled={busy}
              onClick={handleCheckIn}
              className="rounded-lg bg-black px-4 py-2 text-white disabled:opacity-50"
            >
              {busy ? "Processing..." : "Check in now"}
            </button>
          )}

          {canCancel && (
            <button
              type="button"
              disabled={busy}
              onClick={handleCancel}
              className="rounded-lg border px-4 py-2 disabled:opacity-50"
            >
              Cancel token
            </button>
          )}

          {!canCheckIn && !canCancel && (
            <p className="text-sm text-gray-500">
              No customer actions are available for this token status.
            </p>
          )}
        </div>

        {error && (
          <p role="alert" className="text-sm text-red-600">
            {error}
          </p>
        )}
      </section>

      <section className="rounded-xl border p-5">
        <h2 className="font-semibold">Business</h2>
        <p className="mt-2 text-sm text-gray-600">
          Business ID: {token.businessId}
        </p>
        <Link
          href={`/b/${token.businessId}`}
          className="mt-3 inline-block underline"
        >
          View business
        </Link>
      </section>
    </main>
  );
}
