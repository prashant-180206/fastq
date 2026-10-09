"use client";

import Link from "next/link";
import { useQuery } from "convex/react";

import {
  ArrowRight,
  CalendarDays,
  Clock3,
  ExternalLink,
  Globe,
  MapPin,
  Settings,
  Users,
  Wrench,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import type { Metadata } from "next";
import { api } from "@/convex/_generated/api";

export const metadata: Metadata = {
  title: "Business Dashboard | Quiskip",
  description: "Manage your business on Quiskip.",
};

function DashboardSkeleton() {
  return (
    <main className="min-h-[calc(100vh-4rem)] bg-muted/20">
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="space-y-3">
          <Skeleton className="h-9 w-64" />
          <Skeleton className="h-5 w-96" />
        </div>

        <div className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {Array.from({ length: 4 }).map((_, index) => (
            <Card key={index}>
              <CardContent className="p-6">
                <Skeleton className="h-10 w-10 rounded-lg" />
                <Skeleton className="mt-4 h-5 w-32" />
                <Skeleton className="mt-2 h-4 w-48" />
              </CardContent>
            </Card>
          ))}
        </div>

        <div className="mt-8 grid gap-6 lg:grid-cols-3">
          <Card className="lg:col-span-2">
            <CardHeader>
              <Skeleton className="h-6 w-40" />
            </CardHeader>
            <CardContent className="space-y-4">
              <Skeleton className="h-20 w-full" />
              <Skeleton className="h-20 w-full" />
              <Skeleton className="h-20 w-full" />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <Skeleton className="h-6 w-32" />
            </CardHeader>
            <CardContent>
              <Skeleton className="h-32 w-full" />
            </CardContent>
          </Card>
        </div>
      </div>
    </main>
  );
}

function DashboardCard({
  href,
  icon: Icon,
  title,
  description,
}: {
  href: string;
  icon: typeof Settings;
  title: string;
  description: string;
}) {
  return (
    <Link href={href} className="group">
      <Card className="h-full transition-all group-hover:-translate-y-0.5 group-hover:shadow-md">
        <CardContent className="p-6">
          <div className="flex size-11 items-center justify-center rounded-xl bg-primary/10">
            <Icon className="size-5 text-primary" />
          </div>

          <div className="mt-4 flex items-center justify-between gap-3">
            <div>
              <h3 className="font-semibold">{title}</h3>
              <p className="mt-1 text-sm leading-5 text-muted-foreground">
                {description}
              </p>
            </div>

            <ArrowRight className="size-4 shrink-0 text-muted-foreground transition-transform group-hover:translate-x-1 group-hover:text-foreground" />
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}

export function BusinessDashboard({ businessId }: { businessId: string }) {
  /*
   * The Convex generated API expects an actual businesses ID.
   *
   * Because this route is dynamic, we cast the route value here.
   * Convex performs the actual ID validation on the query.
   */
  const business = useQuery(api.businesses.getForMember, {
    businessId: businessId as never,
  });

  const settings = useQuery(api.businessSettings.get, {
    businessId: businessId as never,
  });

  const hours = useQuery(api.businessHours.list, {
    businessId: businessId as never,
  });

  if (business === undefined || settings === undefined || hours === undefined) {
    return <DashboardSkeleton />;
  }

  if (!business) {
    return (
      <main className="min-h-[calc(100vh-4rem)] bg-muted/20">
        <div className="mx-auto flex min-h-[60vh] max-w-2xl items-center justify-center px-4">
          <Card className="w-full">
            <CardContent className="flex flex-col items-center px-6 py-12 text-center">
              <div className="flex size-14 items-center justify-center rounded-2xl bg-destructive/10">
                <Users className="size-7 text-destructive" />
              </div>

              <h1 className="mt-5 text-xl font-semibold">Business not found</h1>

              <p className="mt-2 text-sm text-muted-foreground">
                This business doesn't exist, is inactive, or you don't have
                access to it.
              </p>

              <Button className="mt-6">
                <Link href="/business">Back to businesses</Link>
              </Button>
            </CardContent>
          </Card>
        </div>
      </main>
    );
  }

  const activeDays = hours.filter((day: any) => day.isOpen).length;

  return (
    <main className="min-h-[calc(100vh-4rem)] bg-muted/20">
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
          <div className="flex items-start gap-4">
            <div className="flex size-14 shrink-0 items-center justify-center overflow-hidden rounded-2xl bg-muted">
              {business.logoUrl ? (
                <img
                  src={business.logoUrl}
                  alt={`${business.name} logo`}
                  className="size-full object-cover"
                />
              ) : (
                <span className="text-xl font-bold text-muted-foreground">
                  {business.name.charAt(0).toUpperCase()}
                </span>
              )}
            </div>

            <div>
              <p className="text-sm font-medium text-primary">
                Business dashboard
              </p>

              <h1 className="mt-1 text-3xl font-bold tracking-tight">
                {business.name}
              </h1>

              <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-muted-foreground">
                <span>{business.type}</span>

                <span className="flex items-center gap-1.5">
                  <MapPin className="size-3.5" />
                  {business.city}
                </span>
              </div>
            </div>
          </div>

          <div className="flex flex-wrap gap-2">
            <Button variant="outline">
              <Link href={`/b/${business._id}`}>
                <ExternalLink className="mr-2 size-4" />
                Public page
              </Link>
            </Button>

            <Button>
              <Link href={`/business/${business._id}/settings`}>
                <Settings className="mr-2 size-4" />
                Settings
              </Link>
            </Button>
          </div>
        </div>

        {/* Business status */}
        <div className="mt-8 flex flex-col gap-4 rounded-xl border bg-background p-5 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <div className="flex items-center gap-2">
              <span
                className={`size-2.5 rounded-full ${
                  business.isActive ? "bg-emerald-500" : "bg-destructive"
                }`}
              />

              <span className="font-medium">
                {business.isActive ? "Business active" : "Business inactive"}
              </span>
            </div>

            <p className="mt-1 text-sm text-muted-foreground">
              {settings?.queueEnabled
                ? "Queue management is enabled."
                : "Queue management is currently disabled."}
            </p>
          </div>

          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Clock3 className="size-4" />
            {activeDays} days configured
          </div>
        </div>

        {/* Quick actions */}
        <section className="mt-8">
          <div className="mb-4">
            <h2 className="text-lg font-semibold">Manage your business</h2>

            <p className="text-sm text-muted-foreground">
              Everything you need to operate your Quiskip business.
            </p>
          </div>

          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
            <DashboardCard
              href={`/business/${business._id}/queue`}
              icon={Users}
              title="Queue"
              description="Manage your live customer queue."
            />

            <DashboardCard
              href={`/business/${business._id}/appointments`}
              icon={CalendarDays}
              title="Appointments"
              description="View and manage appointments."
            />

            <DashboardCard
              href={`/business/${business._id}/services`}
              icon={Wrench}
              title="Services"
              description="Manage services offered by your business."
            />

            <DashboardCard
              href={`/business/${business._id}/staff`}
              icon={Users}
              title="Staff"
              description="Manage your business team and roles."
            />
          </div>
        </section>

        {/* Main information */}
        <section className="mt-8 grid gap-6 lg:grid-cols-3">
          {/* Business information */}
          <Card className="lg:col-span-2">
            <CardHeader>
              <CardTitle>Business information</CardTitle>
            </CardHeader>

            <CardContent>
              <div className="grid gap-6 sm:grid-cols-2">
                <div>
                  <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                    Business name
                  </p>
                  <p className="mt-1 font-medium">{business.name}</p>
                </div>

                <div>
                  <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                    Type
                  </p>
                  <p className="mt-1 font-medium">{business.type}</p>
                </div>

                <div className="sm:col-span-2">
                  <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                    Address
                  </p>
                  <p className="mt-1 font-medium">{business.address}</p>
                  <p className="text-sm text-muted-foreground">
                    {business.city}
                  </p>
                </div>

                {business.phone && (
                  <div>
                    <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                      Phone
                    </p>
                    <p className="mt-1 font-medium">{business.phone}</p>
                  </div>
                )}

                {business.website && (
                  <div>
                    <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                      Website
                    </p>
                    <a
                      href={business.website}
                      target="_blank"
                      rel="noreferrer"
                      className="mt-1 flex items-center gap-1 text-sm font-medium text-primary hover:underline"
                    >
                      <Globe className="size-3.5" />
                      Visit website
                    </a>
                  </div>
                )}

                {business.description && (
                  <div className="sm:col-span-2">
                    <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                      Description
                    </p>
                    <p className="mt-1 text-sm leading-6 text-muted-foreground">
                      {business.description}
                    </p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Configuration */}
          <Card>
            <CardHeader>
              <CardTitle>Configuration</CardTitle>
            </CardHeader>

            <CardContent className="space-y-5">
              <div className="flex items-center justify-between gap-4">
                <div>
                  <p className="font-medium">Queue</p>
                  <p className="text-xs text-muted-foreground">
                    Customer walk-ins
                  </p>
                </div>

                <span
                  className={`rounded-full px-2.5 py-1 text-xs font-medium ${
                    settings?.queueEnabled
                      ? "bg-emerald-500/10 text-emerald-700"
                      : "bg-muted text-muted-foreground"
                  }`}
                >
                  {settings?.queueEnabled ? "Enabled" : "Disabled"}
                </span>
              </div>

              <div className="flex items-center justify-between gap-4">
                <div>
                  <p className="font-medium">Appointments</p>
                  <p className="text-xs text-muted-foreground">
                    Scheduled bookings
                  </p>
                </div>

                <span
                  className={`rounded-full px-2.5 py-1 text-xs font-medium ${
                    settings?.appointmentsEnabled
                      ? "bg-emerald-500/10 text-emerald-700"
                      : "bg-muted text-muted-foreground"
                  }`}
                >
                  {settings?.appointmentsEnabled ? "Enabled" : "Disabled"}
                </span>
              </div>

              <div className="flex items-center justify-between gap-4">
                <div>
                  <p className="font-medium">Hours</p>
                  <p className="text-xs text-muted-foreground">
                    Weekly operating schedule
                  </p>
                </div>

                <span className="font-medium">{activeDays}/7</span>
              </div>

              <Button variant="outline" className="w-full">
                <Link href={`/business/${business._id}/settings`}>
                  Manage settings
                  <ArrowRight className="ml-2 size-4" />
                </Link>
              </Button>
            </CardContent>
          </Card>
        </section>

        {/* Bottom navigation */}
        <section className="mt-8 grid gap-5 md:grid-cols-3">
          <DashboardCard
            href={`/business/${business._id}/hours`}
            icon={Clock3}
            title="Business hours"
            description="Configure your weekly operating hours."
          />

          <DashboardCard
            href={`/business/${business._id}/customers`}
            icon={Users}
            title="Customers"
            description="View customers associated with your business."
          />

          <DashboardCard
            href={`/business/${business._id}/settings`}
            icon={Settings}
            title="Business settings"
            description="Configure queue and appointment behavior."
          />
        </section>
      </div>
    </main>
  );
}
