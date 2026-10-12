"use client";

import { useQuery } from "convex/react";
import { api } from "@/../convex/_generated/api";

export default function DiscoverPage() {
  const businesses = useQuery(api.businesses.getAll, {});

  if (businesses === undefined) {
    return <p>Loading businesses...</p>;
  }

  if (businesses.length === 0) {
    return <p>No businesses are available right now.</p>;
  }

  return (
    <main>
      <h1>Discover businesses</h1>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {businesses.map((business) => (
          <article key={business._id} className="rounded-xl border p-4">
            {business.logoUrl && (
              <img
                src={business.logoUrl}
                alt={`${business.name} logo`}
                className="mb-3 h-16 w-16 rounded-lg object-cover"
              />
            )}

            <h2 className="text-lg font-semibold">{business.name}</h2>

            {business.description && (
              <p className="mt-2 text-sm text-gray-600">
                {business.description}
              </p>
            )}

            <a
              href={`/b/${business._id}`}
              className="mt-4 inline-block underline"
            >
              View business
            </a>
          </article>
        ))}
      </div>
    </main>
  );
}
