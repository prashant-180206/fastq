"use client";

import Link from "next/link";
import { useQuery, useMutation } from "convex/react";
import { useState } from "react";
import { api } from "@/convex/_generated/api";
import { AppShell } from "@/components/AppShell";
import { Badge, Button, Card, Spinner } from "@/components/ui";

function formatDate(value: number) {
  return new Intl.DateTimeFormat("en", {
    weekday: "long",
    month: "long",
    day: "numeric",
  }).format(new Date(value));
}

export default function DashboardPage() {
  const businesses = useQuery(api.businesses.getMyBusinesses);
  const business = businesses?.[0];
  const queues = useQuery(
    api.queues.list,
    business ? { businessId: business._id, activeOnly: true } : "skip",
  );
  const counters = useQuery(
    api.counters.list,
    business ? { businessId: business._id } : "skip",
  );
  const appointments = useQuery(
    api.appointments.listForBusiness,
    business ? { businessId: business._id } : "skip",
  );
  const [now] = useState(() => Date.now());
  const toggleQueue = useMutation(api.queues.pause);
  const resumeQueue = useMutation(api.queues.resume);

  if (businesses === undefined)
    return (
      <AppShell>
        <div className="grid min-h-[60vh] place-items-center">
          <Spinner />
        </div>
      </AppShell>
    );
  if (!business)
    return (
      <AppShell>
        <EmptyWorkspace />
      </AppShell>
    );

  const totalWaiting =
    queues?.reduce((total, queue) => total + queue.currentNumber, 0) ?? 0;
  const today = new Date().toISOString().slice(0, 10);
  const todayAppointments =
    appointments?.filter(
      (item) =>
        new Date(item.scheduledStart).toISOString().slice(0, 10) === today,
    ).length ?? 0;

  return (
    <AppShell>
      <div className="mx-auto max-w-7xl">
        <div className="flex flex-col justify-between gap-5 sm:flex-row sm:items-end">
          <div>
            <p className="text-sm font-semibold text-[#789095]">
              {formatDate(now)}
            </p>
            <h1 className="mt-2 text-3xl font-bold tracking-[-.04em]">
              Good morning, Prashant <span>👋</span>
            </h1>
            <p className="mt-2 text-[#789095]">
              Here&apos;s what&apos;s happening at{" "}
              <strong className="text-[#31545b]">{business.name}</strong>.
            </p>
          </div>
          <Link href={`/business/${business._id}`}>
            <Button variant="secondary">
              View customer page <span>↗</span>
            </Button>
          </Link>
        </div>
        <div className="mt-8 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <Stat
            label="Customers waiting"
            value={String(totalWaiting)}
            detail="Across all queues"
            icon="♧"
            tone="orange"
          />
          <Stat
            label="Live queues"
            value={String(queues?.length ?? 0)}
            detail="Ready to serve"
            icon="≡"
            tone="green"
          />
          <Stat
            label="Today's appointments"
            value={String(todayAppointments)}
            detail="Scheduled for today"
            icon="◷"
            tone="blue"
          />
          <Stat
            label="Available counters"
            value={String(
              counters?.filter((counter) => counter.status === "AVAILABLE")
                .length ?? 0,
            )}
            detail={`${counters?.length ?? 0} counters total`}
            icon="⌁"
            tone="purple"
          />
        </div>
        <div className="mt-8 grid gap-6 xl:grid-cols-[1.4fr_1fr]">
          <Card>
            <div className="flex items-center justify-between border-b border-[#edf2ef] p-5">
              <div>
                <h2 className="font-bold">Live queues</h2>
                <p className="mt-1 text-sm text-[#789095]">
                  Manage your queues in real time.
                </p>
              </div>
              <Link
                href="/dashboard/queues"
                className="text-sm font-bold text-[#e85d3f]"
              >
                Manage queues →
              </Link>
            </div>
            <div className="divide-y divide-[#edf2ef]">
              {queues === undefined ? (
                <div className="grid place-items-center p-12">
                  <Spinner />
                </div>
              ) : queues.length === 0 ? (
                <div className="p-10 text-center text-sm text-[#789095]">
                  No active queues yet.
                </div>
              ) : (
                queues.map((queue) => (
                  <div
                    key={queue._id}
                    className="flex flex-col gap-4 p-5 sm:flex-row sm:items-center sm:justify-between"
                  >
                    <div className="flex items-center gap-3">
                      <div className="grid h-11 w-11 place-items-center rounded-xl bg-[#fff0e8] text-lg text-[#e85d3f]">
                        ≡
                      </div>
                      <div>
                        <p className="font-bold">{queue.name}</p>
                        <p className="mt-1 text-sm text-[#789095]">
                          {queue.type} queue · #{queue.currentNumber} last
                          served
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="mr-3 text-right">
                        <p className="text-xl font-bold">
                          {queue.currentNumber}
                        </p>
                        <p className="text-xs text-[#789095]">current number</p>
                      </div>
                      <Badge
                        tone={queue.status === "ACTIVE" ? "green" : "orange"}
                      >
                        {queue.status === "ACTIVE" ? "● Live" : "Paused"}
                      </Badge>
                      <Button
                        variant="ghost"
                        className="px-2"
                        aria-label="Toggle queue"
                        onClick={() =>
                          void (queue.status === "ACTIVE"
                            ? toggleQueue({ queueId: queue._id })
                            : resumeQueue({ queueId: queue._id }))
                        }
                      >
                        {queue.status === "ACTIVE" ? "Ⅱ" : "▶"}
                      </Button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </Card>
          <Card>
            <div className="border-b border-[#edf2ef] p-5">
              <h2 className="font-bold">Today&apos;s appointments</h2>
              <p className="mt-1 text-sm text-[#789095]">
                Your upcoming schedule at a glance.
              </p>
            </div>
            <div className="p-5">
              {appointments === undefined ? (
                <div className="grid place-items-center p-10">
                  <Spinner />
                </div>
              ) : (
                appointments
                  .filter(
                    (item) =>
                      new Date(item.scheduledStart)
                        .toISOString()
                        .slice(0, 10) === today,
                  )
                  .slice(0, 4)
                  .map((appointment) => (
                    <div
                      key={appointment._id}
                      className="flex items-center gap-3 border-b border-[#edf2ef] py-3 last:border-0"
                    >
                      <div className="w-14 text-sm font-bold">
                        {new Date(
                          appointment.scheduledStart,
                        ).toLocaleTimeString([], {
                          hour: "numeric",
                          minute: "2-digit",
                        })}
                      </div>
                      <div className="h-9 w-1 rounded-full bg-[#e85d3f]" />
                      <div className="flex-1">
                        <p className="text-sm font-bold">
                          Customer appointment
                        </p>
                        <p className="text-xs text-[#789095]">
                          {appointment.status.replace("_", " ").toLowerCase()}
                        </p>
                      </div>
                      <Badge
                        tone={
                          appointment.status === "BOOKED" ? "orange" : "gray"
                        }
                      >
                        {appointment.status}
                      </Badge>
                    </div>
                  ))
              )}
            </div>
          </Card>
        </div>
      </div>
    </AppShell>
  );
}

function Stat({
  label,
  value,
  detail,
  icon,
  tone,
}: {
  label: string;
  value: string;
  detail: string;
  icon: string;
  tone: "orange" | "green" | "blue" | "purple";
}) {
  const colors = {
    orange: "bg-[#fff0e8] text-[#e85d3f]",
    green: "bg-[#eaf5f0] text-[#257554]",
    blue: "bg-[#edf4fb] text-[#4e80b2]",
    purple: "bg-[#f3eefb] text-[#7d62a5]",
  };
  return (
    <Card className="p-5">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm font-semibold text-[#789095]">{label}</p>
          <p className="mt-3 text-3xl font-bold tracking-[-.04em]">{value}</p>
        </div>
        <span
          className={`grid h-10 w-10 place-items-center rounded-xl text-lg ${colors[tone]}`}
        >
          {icon}
        </span>
      </div>
      <p className="mt-3 text-xs text-[#86a09d]">{detail}</p>
    </Card>
  );
}

function EmptyWorkspace() {
  const createBusiness = useMutation(api.businesses.create);
  return (
    <div className="mx-auto max-w-xl py-20 text-center">
      <div className="mx-auto grid h-16 w-16 place-items-center rounded-2xl bg-[#fff0e8] text-3xl text-[#e85d3f]">
        ✦
      </div>
      <h1 className="mt-6 text-3xl font-bold">Set up your workspace</h1>
      <p className="mx-auto mt-3 max-w-md leading-7 text-[#789095]">
        Create your first business to start managing queues, appointments, and
        customers with QuiLess.
      </p>
      <Button
        className="mt-7"
        onClick={() =>
          void createBusiness({
            name: "My Business",
            type: "GENERAL",
            city: "Your city",
            address: "Your address",
            latitude: 0,
            longitude: 0,
          })
        }
      >
        Create a demo workspace <span>→</span>
      </Button>
    </div>
  );
}
