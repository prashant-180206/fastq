"use client";

import { useParams } from "next/navigation";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { AppShell } from "@/components/AppShell";
import { Badge, Card, Spinner } from "@/components/ui";

const content = {
  queues: {
    title: "Queues",
    description: "Monitor every active line and keep service moving.",
    icon: "≡",
  },
  appointments: {
    title: "Appointments",
    description: "Keep track of upcoming bookings and check-ins.",
    icon: "◷",
  },
  settings: {
    title: "Settings",
    description: "Configure how your business works with QuiLess.",
    icon: "⚙",
  },
} as const;

export default function DashboardSectionPage() {
  const { section } = useParams<{ section: keyof typeof content }>();
  const page = content[section] ?? content.queues;
  const businesses = useQuery(api.businesses.getMyBusinesses);
  const business = businesses?.[0];
  const queues = useQuery(
    api.queues.list,
    business ? { businessId: business._id, activeOnly: false } : "skip",
  );
  const appointments = useQuery(
    api.appointments.listForBusiness,
    business ? { businessId: business._id } : "skip",
  );

  return (
    <AppShell>
      <div className="mx-auto max-w-7xl">
        <div>
          <p className="text-3xl">{page.icon}</p>
          <h1 className="mt-4 text-3xl font-bold tracking-[-.04em]">
            {page.title}
          </h1>
          <p className="mt-2 text-[#789095]">{page.description}</p>
        </div>
        {businesses === undefined ? (
          <div className="grid min-h-[40vh] place-items-center">
            <Spinner />
          </div>
        ) : section === "queues" ? (
          <QueueList queues={queues} />
        ) : section === "appointments" ? (
          <AppointmentList appointments={appointments} />
        ) : (
          <SettingsPanel />
        )}
      </div>
    </AppShell>
  );
}

function QueueList({
  queues,
}: {
  queues:
    | NonNullable<ReturnType<typeof useQuery<typeof api.queues.list>>>
    | undefined;
}) {
  if (queues === undefined)
    return (
      <div className="grid min-h-[30vh] place-items-center">
        <Spinner />
      </div>
    );
  return (
    <Card className="mt-8 divide-y divide-[#edf2ef]">
      {queues.length === 0 ? (
        <p className="p-10 text-center text-[#789095]">
          No queues configured yet.
        </p>
      ) : (
        queues.map((queue) => (
          <div
            key={queue._id}
            className="flex items-center justify-between gap-4 p-5"
          >
            <div>
              <p className="font-bold">{queue.name}</p>
              <p className="mt-1 text-sm text-[#789095]">
                {queue.type} · Last number {queue.currentNumber}
              </p>
            </div>
            <Badge
              tone={
                queue.status === "ACTIVE"
                  ? "green"
                  : queue.status === "PAUSED"
                    ? "orange"
                    : "gray"
              }
            >
              {queue.status}
            </Badge>
          </div>
        ))
      )}
    </Card>
  );
}

function AppointmentList({
  appointments,
}: {
  appointments:
    | NonNullable<
        ReturnType<typeof useQuery<typeof api.appointments.listForBusiness>>
      >
    | undefined;
}) {
  if (appointments === undefined)
    return (
      <div className="grid min-h-[30vh] place-items-center">
        <Spinner />
      </div>
    );
  return (
    <Card className="mt-8 divide-y divide-[#edf2ef]">
      {appointments.length === 0 ? (
        <p className="p-10 text-center text-[#789095]">No appointments yet.</p>
      ) : (
        appointments.map((appointment) => (
          <div
            key={appointment._id}
            className="flex items-center justify-between gap-4 p-5"
          >
            <div>
              <p className="font-bold">
                {new Date(appointment.scheduledStart).toLocaleString([], {
                  dateStyle: "medium",
                  timeStyle: "short",
                })}
              </p>
              <p className="mt-1 text-sm text-[#789095]">
                Appointment ·{" "}
                {appointment.status.replace("_", " ").toLowerCase()}
              </p>
            </div>
            <Badge tone={appointment.status === "BOOKED" ? "orange" : "gray"}>
              {appointment.status}
            </Badge>
          </div>
        ))
      )}
    </Card>
  );
}

function SettingsPanel() {
  return (
    <div className="mt-8 grid gap-4 md:grid-cols-2">
      <Card className="p-6">
        <h2 className="font-bold">Business profile</h2>
        <p className="mt-2 text-sm leading-6 text-[#789095]">
          Update your business details, location, and contact information from
          the Convex workspace.
        </p>
        <div className="mt-5 rounded-xl bg-[#f6faf8] p-4 text-sm text-[#567076]">
          Settings are safely managed by your business owner account.
        </div>
      </Card>
      <Card className="p-6">
        <h2 className="font-bold">Queue preferences</h2>
        <p className="mt-2 text-sm leading-6 text-[#789095]">
          Control customer notifications and appointment availability for each
          service.
        </p>
        <div className="mt-5 space-y-3 text-sm">
          <div className="flex justify-between border-b border-[#edf2ef] pb-3">
            <span>Realtime updates</span>
            <Badge>Enabled</Badge>
          </div>
          <div className="flex justify-between">
            <span>Customer notifications</span>
            <Badge>Enabled</Badge>
          </div>
        </div>
      </Card>
    </div>
  );
}
