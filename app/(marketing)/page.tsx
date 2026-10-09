import Link from "next/link";
import {
  ArrowRight,
  CalendarCheck,
  Clock3,
  ListChecks,
  Search,
  Smartphone,
  Users,
} from "lucide-react";

import { Button } from "@/components/ui/button";

const features = [
  {
    icon: Clock3,
    title: "Join a queue remotely",
    description:
      "See the current queue and join before you arrive. Spend your time where you actually want to be.",
  },
  {
    icon: CalendarCheck,
    title: "Book appointments",
    description:
      "Choose a service, find an available slot, and keep your appointment in one place.",
  },
  {
    icon: Smartphone,
    title: "Know when to arrive",
    description:
      "Track your queue position and estimated wait so you don't have to stand around waiting.",
  },
];

const businessFeatures = [
  {
    icon: ListChecks,
    title: "One place for your queue",
  },
  {
    icon: CalendarCheck,
    title: "Appointments and availability",
  },
  {
    icon: Users,
    title: "Customers and staff",
  },
];

export default function HomePage() {
  return (
    <main>
      {/* Hero */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 -z-10 bg-[radial-gradient(circle_at_top,rgba(0,0,0,0.07),transparent_55%)]" />

        <div className="mx-auto max-w-7xl px-4 pb-24 pt-20 sm:px-6 sm:pt-28 lg:px-8 lg:pb-32">
          <div className="mx-auto max-w-4xl text-center">
            <div className="mb-6 inline-flex items-center gap-2 rounded-full border bg-muted/50 px-3 py-1.5 text-sm text-muted-foreground">
              <span className="size-1.5 rounded-full bg-foreground" />
              Queue less. Live more.
            </div>

            <h1 className="text-balance text-5xl font-bold tracking-tight sm:text-6xl lg:text-7xl">
              Your time is worth more than waiting.
            </h1>

            <p className="mx-auto mt-6 max-w-2xl text-pretty text-lg leading-8 text-muted-foreground sm:text-xl">
              Join queues remotely, book appointments, and know exactly when
              it's your turn. Quiskip makes everyday waiting simpler.
            </p>

            <div className="mt-9 flex flex-col justify-center gap-3 sm:flex-row">
              <Button size="lg">
                <Link href="/discover">
                  Find a business
                  <ArrowRight className="ml-2 size-4" />
                </Link>
              </Button>

              <Button size="lg" variant="outline">
                <Link href="/auth/sign-up">For businesses</Link>
              </Button>
            </div>
          </div>

          {/* Product preview */}
          <div className="mx-auto mt-20 max-w-5xl">
            <div className="rounded-2xl border bg-card p-2 shadow-2xl shadow-black/5">
              <div className="rounded-xl border bg-muted/30 p-5 sm:p-8">
                <div className="mb-6 flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">
                      Your current queue
                    </p>
                    <h2 className="mt-1 text-xl font-semibold">Urban Cuts</h2>
                  </div>

                  <span className="rounded-full bg-foreground px-3 py-1 text-xs font-medium text-background">
                    Open
                  </span>
                </div>

                <div className="grid gap-4 sm:grid-cols-3">
                  <div className="rounded-xl border bg-background p-5">
                    <p className="text-sm text-muted-foreground">
                      Your position
                    </p>
                    <p className="mt-2 text-4xl font-bold">#12</p>
                  </div>

                  <div className="rounded-xl border bg-background p-5">
                    <p className="text-sm text-muted-foreground">
                      People ahead
                    </p>
                    <p className="mt-2 text-4xl font-bold">4</p>
                  </div>

                  <div className="rounded-xl border bg-background p-5">
                    <p className="text-sm text-muted-foreground">
                      Estimated wait
                    </p>
                    <p className="mt-2 text-4xl font-bold">~28m</p>
                  </div>
                </div>

                <div className="mt-4 flex items-center gap-3 rounded-xl border bg-background p-4">
                  <div className="flex size-10 items-center justify-center rounded-full bg-muted">
                    <Clock3 className="size-5" />
                  </div>

                  <div>
                    <p className="text-sm font-medium">Now serving #8</p>
                    <p className="text-sm text-muted-foreground">
                      We'll let you know when you're getting close.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Customer features */}
      <section className="border-t py-24">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="max-w-2xl">
            <p className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">
              For customers
            </p>

            <h2 className="mt-3 text-3xl font-bold tracking-tight sm:text-4xl">
              Waiting shouldn't be part of the experience.
            </h2>

            <p className="mt-4 text-lg text-muted-foreground">
              Quiskip gives you visibility before and during your visit.
            </p>
          </div>

          <div className="mt-12 grid gap-6 md:grid-cols-3">
            {features.map((feature) => {
              const Icon = feature.icon;

              return (
                <div
                  key={feature.title}
                  className="rounded-2xl border bg-card p-6"
                >
                  <div className="flex size-11 items-center justify-center rounded-xl bg-muted">
                    <Icon className="size-5" />
                  </div>

                  <h3 className="mt-5 text-lg font-semibold">
                    {feature.title}
                  </h3>

                  <p className="mt-2 leading-7 text-muted-foreground">
                    {feature.description}
                  </p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Business section */}
      <section id="businesses" className="border-t bg-muted/30 py-24">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid gap-12 lg:grid-cols-2 lg:items-center">
            <div>
              <p className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">
                For businesses
              </p>

              <h2 className="mt-3 text-3xl font-bold tracking-tight sm:text-4xl">
                Turn waiting into a better customer experience.
              </h2>

              <p className="mt-5 max-w-xl text-lg leading-8 text-muted-foreground">
                Manage queues, appointments, services, staff, and customers from
                one operational workspace.
              </p>

              <Button className="mt-8">
                <Link href="/auth/sign-up">
                  Start your business
                  <ArrowRight className="ml-2 size-4" />
                </Link>
              </Button>
            </div>

            <div className="grid gap-4">
              {businessFeatures.map((feature) => {
                const Icon = feature.icon;

                return (
                  <div
                    key={feature.title}
                    className="flex items-center gap-4 rounded-xl border bg-background p-5"
                  >
                    <div className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-muted">
                      <Icon className="size-5" />
                    </div>

                    <p className="font-medium">{feature.title}</p>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </section>

      {/* How it works */}
      <section id="how-it-works" className="border-t py-24">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-2xl text-center">
            <p className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">
              How it works
            </p>

            <h2 className="mt-3 text-3xl font-bold tracking-tight sm:text-4xl">
              Three steps. Less waiting.
            </h2>
          </div>

          <div className="mt-14 grid gap-8 md:grid-cols-3">
            {[
              {
                number: "01",
                title: "Find a business",
                description: "Search for the business and service you need.",
              },
              {
                number: "02",
                title: "Join or book",
                description:
                  "Join the live queue or reserve an available appointment.",
              },
              {
                number: "03",
                title: "Show up at the right time",
                description:
                  "Track your status and arrive when it actually matters.",
              },
            ].map((step) => (
              <div key={step.number}>
                <p className="text-sm font-semibold text-muted-foreground">
                  {step.number}
                </p>

                <h3 className="mt-3 text-xl font-semibold">{step.title}</h3>

                <p className="mt-2 leading-7 text-muted-foreground">
                  {step.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="border-t py-24">
        <div className="mx-auto max-w-3xl px-4 text-center sm:px-6 lg:px-8">
          <Search className="mx-auto size-8" />

          <h2 className="mt-6 text-3xl font-bold tracking-tight sm:text-4xl">
            Ready to skip the wait?
          </h2>

          <p className="mt-4 text-lg text-muted-foreground">
            Find your next appointment or queue up before you arrive.
          </p>

          <Button size="lg" className="mt-8">
            <Link href="/discover">
              Discover businesses
              <ArrowRight className="ml-2 size-4" />
            </Link>
          </Button>
        </div>
      </section>
    </main>
  );
}
