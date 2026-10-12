"use client";

import Link from "next/link";
import { useQuery } from "convex/react";
import { api } from "@/../convex/_generated/api";

export default function BusinessesPage() {
  const businesses = useQuery(api.business.data.getMine, {});

  return (
    <main className="mx-auto max-w-4xl space-y-6 p-6">
      <header className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold">Businesses</h1>
          <p className="text-sm text-gray-500">
            Manage your businesses and working hours.
          </p>
        </div>

        <Link
          href="/business/new"
          className="rounded-lg bg-black px-4 py-2 text-sm text-white"
        >
          Create business
        </Link>
      </header>

      {businesses === undefined ? (
        <p className="text-sm text-gray-500">Loading businesses...</p>
      ) : businesses.length === 0 ? (
        <div className="rounded-xl border border-dashed p-10 text-center">
          <h2 className="font-medium">No businesses yet</h2>
          <p className="mt-2 text-sm text-gray-500">
            Create your first business to get started.
          </p>
          <Link
            href="/business/new"
            className="mt-4 inline-block text-sm underline"
          >
            Create a business
          </Link>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2">
          {businesses.map((business) => (
            <Link
              key={business._id}
              href={`/business/${business._id}`}
              className="rounded-xl border p-5 transition hover:bg-gray-50"
            >
              <h2 className="font-semibold">{business.name}</h2>
              <p className="mt-1 text-sm text-gray-500">
                {business.description || "No description"}
              </p>
              <p className="mt-3 text-xs capitalize text-gray-500">
                {business.status}
              </p>
            </Link>
          ))}
        </div>
      )}
    </main>
  );
}