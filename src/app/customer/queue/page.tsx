"use client";

import Link from "next/link";
import { useQuery } from "convex/react";
import { api } from "@/../convex/_generated/api";

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

export default function CustomerQueuePage() {
  const tokens = useQuery(api.queueCapacity.getMyTokens, {});

  if (tokens === undefined) {
    return <main className="p-6">Loading queue tokens...</main>;
  }

  const active = tokens.filter((token) =>
    activeStatuses.includes(token.status),
  );

  const history = tokens.filter(
    (token) => !activeStatuses.includes(token.status),
  );

  return (
    <main className="mx-auto max-w-5xl space-y-8 p-6">
      <header>
        <Link href="/customer/dashboard" className="text-sm underline">
          ← Dashboard
        </Link>
        <h1 className="mt-3 text-3xl font-bold">My queue tokens</h1>
        <p className="mt-2 text-gray-600">
          Track active tokens and review your previous queue visits.
        </p>
      </header>

      <section className="space-y-4">
        <h2 className="text-xl font-semibold">Active ({active.length})</h2>

        {active.length === 0 ? (
          <div className="rounded-xl border p-5">
            <p>You do not have any active queue tokens.</p>
            <Link href="/discover" className="mt-3 inline-block underline">
              Discover businesses
            </Link>
          </div>
        ) : (
          <div className="space-y-3">
            {active.map((token) => (
              <Link
                key={token._id}
                href={`/customer/queue/${token._id}`}
                className="block rounded-xl border p-5 hover:bg-gray-50"
              >
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <h3 className="font-semibold">
                      Token #{token.tokenNumber}
                    </h3>
                    <p className="mt-1 text-sm text-gray-500">
                      Joined {formatDate(token.joinedAt)}
                    </p>
                  </div>
                  <span className="rounded-full bg-gray-100 px-3 py-1 text-sm">
                    {titleCase(token.status)}
                  </span>
                </div>
              </Link>
            ))}
          </div>
        )}
      </section>

      <section className="space-y-4">
        <h2 className="text-xl font-semibold">History ({history.length})</h2>

        {history.length === 0 ? (
          <p className="text-gray-500">Your queue history will appear here.</p>
        ) : (
          <div className="space-y-3">
            {history.map((token) => (
              <Link
                key={token._id}
                href={`/customer/queue/${token._id}`}
                className="block rounded-xl border p-4 hover:bg-gray-50"
              >
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <p className="font-semibold">Token #{token.tokenNumber}</p>
                    <p className="mt-1 text-sm text-gray-500">
                      Joined {formatDate(token.joinedAt)}
                    </p>
                  </div>
                  <span className="text-sm text-gray-600">
                    {titleCase(token.status)}
                  </span>
                </div>
              </Link>
            ))}
          </div>
        )}
      </section>
    </main>
  );
}
