"use client";

import Link from "next/link";
import { useQuery } from "convex/react";
// import { api } from "@/../convex/_generated/api";
import { ArrowRight, Building2, MapPin, Plus, Store } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { api } from "@/convex/_generated/api";

function BusinessCard({
  business,
}: {
  business: {
    _id: string;
    name: string;
    description?: string;
    type: string;
    city: string;
    address: string;
    logoUrl?: string;
    membershipRole: string;
  };
}) {
  return (
    <Card className="group overflow-hidden transition-shadow hover:shadow-md">
      <CardHeader>
        <div className="flex items-start justify-between gap-4">
          <div className="flex min-w-0 items-center gap-3">
            <div className="flex size-12 shrink-0 items-center justify-center overflow-hidden rounded-xl bg-muted">
              {business.logoUrl ? (
                <img
                  src={business.logoUrl}
                  alt={`${business.name} logo`}
                  className="size-full object-cover"
                />
              ) : (
                <Building2 className="size-6 text-muted-foreground" />
              )}
            </div>

            <div className="min-w-0">
              <CardTitle className="truncate text-lg">
                {business.name}
              </CardTitle>

              <p className="mt-1 text-sm text-muted-foreground">
                {business.type}
              </p>
            </div>
          </div>

          <span className="rounded-full bg-muted px-2.5 py-1 text-xs font-medium capitalize">
            {business.membershipRole.toLowerCase()}
          </span>
        </div>
      </CardHeader>

      <CardContent>
        <div className="space-y-2 text-sm text-muted-foreground">
          <div className="flex items-start gap-2">
            <MapPin className="mt-0.5 size-4 shrink-0" />
            <span>
              {business.address}, {business.city}
            </span>
          </div>

          {business.description && (
            <p className="line-clamp-2 pt-2 text-sm leading-6">
              {business.description}
            </p>
          )}
        </div>

        <Button className="mt-6 w-full">
          <Link href={`/business/${business._id}`}>
            Open dashboard
            <ArrowRight className="ml-2 size-4" />
          </Link>
        </Button>
      </CardContent>
    </Card>
  );
}

function BusinessCardSkeleton() {
  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-3">
          <Skeleton className="size-12 rounded-xl" />

          <div className="space-y-2">
            <Skeleton className="h-5 w-40" />
            <Skeleton className="h-4 w-24" />
          </div>
        </div>
      </CardHeader>

      <CardContent>
        <div className="space-y-2">
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-3/4" />
          <Skeleton className="h-10 w-full" />
        </div>
      </CardContent>
    </Card>
  );
}

export default function BusinessHub() {
  const businesses = useQuery(api.businesses.getMyBusinesses);

  const loading = businesses === undefined;

  return (
    <main className="min-h-[calc(100vh-4rem)] bg-muted/20">
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <div className="mb-2 flex items-center gap-2 text-sm text-muted-foreground">
              <Store className="size-4" />
              Business workspace
            </div>

            <h1 className="text-3xl font-bold tracking-tight">
              Your businesses
            </h1>

            <p className="mt-2 max-w-2xl text-muted-foreground">
              Manage your queues, appointments, services, staff, and business
              settings from one place.
            </p>
          </div>

          <Button size="lg">
            <Link href="/business/new">
              <Plus className="mr-2 size-4" />
              Add new business
            </Link>
          </Button>
        </div>

        {/* Businesses */}
        <section className="mt-10">
          {loading ? (
            <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
              <BusinessCardSkeleton />
              <BusinessCardSkeleton />
              <BusinessCardSkeleton />
            </div>
          ) : businesses.length === 0 ? (
            <Card className="border-dashed">
              <CardContent className="flex flex-col items-center justify-center px-6 py-16 text-center">
                <div className="mb-5 flex size-14 items-center justify-center rounded-2xl bg-primary/10">
                  <Building2 className="size-7 text-primary" />
                </div>

                <h2 className="text-xl font-semibold">
                  You don't have a business yet
                </h2>

                <p className="mt-2 max-w-md text-sm leading-6 text-muted-foreground">
                  Create your first business to start managing queues,
                  appointments, services, staff, and customers with Quiskip.
                </p>

                <Button className="mt-6">
                  <Link href="/business/new">
                    <Plus className="mr-2 size-4" />
                    Create your first business
                  </Link>
                </Button>
              </CardContent>
            </Card>
          ) : (
            <>
              <div className="mb-5 flex items-center justify-between">
                <div>
                  <h2 className="font-semibold">
                    {businesses.length === 1
                      ? "Your business"
                      : "Your businesses"}
                  </h2>

                  <p className="text-sm text-muted-foreground">
                    {businesses.length}{" "}
                    {businesses.length === 1 ? "business" : "businesses"}
                  </p>
                </div>
              </div>

              <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
                {businesses.map((business) => (
                  <BusinessCard key={business._id} business={business} />
                ))}

                {/* Add another business card */}
                <Link href="/business/new" className="group block">
                  <Card className="flex h-full min-h-[280px] items-center justify-center border-dashed transition-colors group-hover:border-primary group-hover:bg-primary/[0.02]">
                    <CardContent className="flex flex-col items-center text-center">
                      <div className="mb-4 flex size-12 items-center justify-center rounded-xl bg-muted transition-colors group-hover:bg-primary/10">
                        <Plus className="size-6 text-muted-foreground group-hover:text-primary" />
                      </div>

                      <h3 className="font-semibold">Add another business</h3>

                      <p className="mt-1 text-sm text-muted-foreground">
                        Create and manage another location or business.
                      </p>
                    </CardContent>
                  </Card>
                </Link>
              </div>
            </>
          )}
        </section>
      </div>
    </main>
  );
}
