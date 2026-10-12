"use client";

import { use, useMemo, useState, type FormEvent } from "react";
import Link from "next/link";
import { useMutation, useQuery } from "convex/react";
import { api } from "@/../convex/_generated/api";
import type { Id } from "@/../convex/_generated/dataModel";

type Tab = "overview" | "queues" | "live" | "appointments" | "availability";
type QueueStatus = "active" | "paused" | "closed";
type AppointmentStatus =
  | "booked"
  | "checked_in"
  | "completed"
  | "cancelled"
  | "no_show";
type Prerequisite = {
  id: string;
  label: string;
  description?: string;
  isRequired: boolean;
};

const inputClass =
  "w-full rounded-lg border border-gray-200 bg-white px-3 py-2.5 text-sm outline-none focus:border-gray-500 focus:ring-2 focus:ring-gray-100";
const tabs: { id: Tab; label: string }[] = [
  { id: "overview", label: "Overview" },
  { id: "queues", label: "Queues" },
  { id: "live", label: "Live queue" },
  { id: "appointments", label: "Appointments" },
  { id: "availability", label: "Availability" },
];

function localToday() {
  const now = new Date();
  return new Date(now.getTime() - now.getTimezoneOffset() * 60_000)
    .toISOString()
    .slice(0, 10);
}
function time(value: number) {
  return new Intl.DateTimeFormat("en-IN", {
    hour: "numeric",
    minute: "2-digit",
    timeZone: "Asia/Kolkata",
  }).format(value);
}
function dateTime(value: number) {
  return new Intl.DateTimeFormat("en-IN", {
    dateStyle: "medium",
    timeStyle: "short",
    timeZone: "Asia/Kolkata",
  }).format(value);
}
function label(value: string) {
  return value.replaceAll("_", " ").replace(/\b\w/g, (c) => c.toUpperCase());
}
function Pill({ value }: { value: string }) {
  const green = ["active", "completed", "serving", "checked_in"].includes(
    value,
  );
  const amber = ["waiting", "called", "booked", "paused"].includes(value);
  return (
    <span
      className={`inline-flex rounded-full border px-2.5 py-1 text-xs font-medium ${green ? "border-emerald-200 bg-emerald-50 text-emerald-700" : amber ? "border-amber-200 bg-amber-50 text-amber-700" : "border-gray-200 bg-gray-100 text-gray-600"}`}
    >
      {label(value)}
    </span>
  );
}
function ActionButton({
  children,
  onClick,
  disabled,
  danger = false,
  primary = false,
}: {
  children: React.ReactNode;
  onClick?: () => void;
  disabled?: boolean;
  danger?: boolean;
  primary?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className={`rounded-lg border px-3 py-2 text-sm font-medium disabled:opacity-50 ${primary ? "border-gray-950 bg-gray-950 text-white hover:bg-gray-800" : danger ? "border-red-200 text-red-700 hover:bg-red-50" : "border-gray-200 bg-white hover:bg-gray-50"}`}
    >
      {children}
    </button>
  );
}

export default function ServiceWorkspacePage({
  params,
}: {
  params: Promise<{ businessId: string; serviceId: string }>;
}) {
  const { businessId, serviceId } = use(params);
  const businessDbId = businessId as Id<"businesses">;
  const serviceDbId = serviceId as Id<"services">;

  const services = useQuery(api.services.getByBusiness, {
    businessId: businessDbId,
  });
  const allQueues = useQuery(api.queue.getByBusiness, {
    businessId: businessDbId,
  });
  const allAppointments = useQuery(api.appointments.getByBusiness, {
    businessId: businessDbId,
  });
  const service = services?.find((item) => item._id === serviceDbId);
  const queues =
    allQueues?.filter((queue) => queue.serviceId === serviceDbId) ?? [];
  const appointments =
    allAppointments?.filter(
      (appointment) => appointment.serviceId === serviceDbId,
    ) ?? [];

  const updateService = useMutation(api.services.update);
  const createQueue = useMutation(api.queue.create);
  const updateQueue = useMutation(api.queue.update);
  const removeQueue = useMutation(api.queue.remove);
  const callNext = useMutation(api.queueCapacity.callNext);
  const startServing = useMutation(api.queueCapacity.startServing);
  const completeToken = useMutation(api.queueCapacity.completeToken);
  const skipToken = useMutation(api.queueCapacity.skipToken);
  const checkInAppointment = useMutation(api.appointments.checkIn);
  const completeAppointment = useMutation(api.appointments.complete);
  const markNoShow = useMutation(api.appointments.markNoShow);

  const [tab, setTab] = useState<Tab>("overview");
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [busy, setBusy] = useState(false);
  const [date, setDate] = useState(localToday());
  const [appointmentFilter, setAppointmentFilter] = useState<
    "all" | AppointmentStatus
  >("all");

  // Service settings
  const [editingSettings, setEditingSettings] = useState(false);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [duration, setDuration] = useState("20");
  const [queueEnabled, setQueueEnabled] = useState(true);
  const [appointmentsEnabled, setAppointmentsEnabled] = useState(true);

  // Queue form is scoped to this service; users cannot accidentally assign a different service.
  const [editingQueueId, setEditingQueueId] = useState<string | null>(null);
  const [queueName, setQueueName] = useState("");
  const [queueDescription, setQueueDescription] = useState("");
  const [prerequisites, setPrerequisites] = useState<Prerequisite[]>([]);
  const [showQueueForm, setShowQueueForm] = useState(false);
  const [selectedQueueId, setSelectedQueueId] = useState("");
  const selectedQueue =
    queues.find((queue) => queue._id === selectedQueueId) ?? queues[0];
  const tokens = useQuery(
    api.queueCapacity.getActiveTokensByQueue,
    selectedQueue ? { queueId: selectedQueue._id as Id<"queues"> } : "skip",
  );

  const availability = useQuery(
    api.appointments.getAvailableSlots,
    service?.appointmentsEnabled
      ? { businessId: businessDbId, serviceId: serviceDbId, date }
      : "skip",
  );

  const filteredAppointments = useMemo(
    () =>
      appointments
        .filter((item) => {
          const start = new Date(`${date}T00:00:00+05:30`).getTime();
          const end = start + 24 * 60 * 60 * 1000;
          return item.scheduledStart >= start && item.scheduledStart < end;
        })
        .filter(
          (item) =>
            appointmentFilter === "all" || item.status === appointmentFilter,
        )
        .sort((a, b) => a.scheduledStart - b.scheduledStart),
    [appointments, date, appointmentFilter],
  );

  function startSettingsEdit() {
    if (!service) return;
    setName(service.name);
    setDescription(service.description ?? "");
    setDuration(String(service.durationMinutes));
    setQueueEnabled(service.queueEnabled);
    setAppointmentsEnabled(service.appointmentsEnabled);
    setEditingSettings(true);
  }

  async function saveSettings(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!service) return;
    setError("");
    setNotice("");
    const durationMinutes = Number(duration);
    if (!name.trim()) return setError("Service name is required.");
    if (
      !Number.isInteger(durationMinutes) ||
      durationMinutes < 1 ||
      durationMinutes > 480
    )
      return setError("Duration must be between 1 and 480 minutes.");
    if (!queueEnabled && !appointmentsEnabled)
      return setError("Enable queues, appointments, or both.");
    setBusy(true);
    try {
      await updateService({
        serviceId: serviceDbId,
        name: name.trim(),
        description: description.trim(),
        durationMinutes,
        queueEnabled,
        appointmentsEnabled,
      });
      setEditingSettings(false);
      setNotice("Service settings saved.");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not save settings.");
    } finally {
      setBusy(false);
    }
  }

  function resetQueueForm() {
    setEditingQueueId(null);
    setQueueName("");
    setQueueDescription("");
    setPrerequisites([]);
    setShowQueueForm(false);
  }
  function beginQueueEdit(queue: (typeof queues)[number]) {
    setEditingQueueId(queue._id);
    setQueueName(queue.name);
    setQueueDescription(queue.description ?? "");
    setPrerequisites(queue.prerequisites.map((item) => ({ ...item })));
    setShowQueueForm(true);
    setTab("queues");
  }
  function addPrerequisite() {
    setPrerequisites((items) => [
      ...items,
      {
        id: `requirement-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
        label: "",
        description: "",
        isRequired: true,
      },
    ]);
  }
  function patchPrerequisite(index: number, patch: Partial<Prerequisite>) {
    setPrerequisites((items) =>
      items.map((item, i) => (i === index ? { ...item, ...patch } : item)),
    );
  }

  async function saveQueue(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!service) return;
    setError("");
    setNotice("");
    if (!queueName.trim()) return setError("Queue name is required.");
    if (!service.queueEnabled)
      return setError("Enable live queues in service settings first.");
    const cleaned = prerequisites.map((item) => ({
      ...item,
      id: item.id.trim(),
      label: item.label.trim(),
      description: item.description?.trim() || undefined,
    }));
    if (cleaned.some((item) => !item.label))
      return setError("Every prerequisite needs a label.");
    setBusy(true);
    try {
      if (editingQueueId) {
        await updateQueue({
          queueId: editingQueueId as Id<"queues">,
          serviceId: serviceDbId,
          name: queueName.trim(),
          description: queueDescription.trim(),
          prerequisites: cleaned,
        });
        setNotice("Queue updated.");
      } else {
        await createQueue({
          businessId: businessDbId,
          serviceId: serviceDbId,
          name: queueName.trim(),
          description: queueDescription.trim(),
          prerequisites: cleaned,
        });
        setNotice("Queue created.");
      }
      resetQueueForm();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not save queue.");
    } finally {
      setBusy(false);
    }
  }

  async function queueStatus(queueId: Id<"queues">, status: QueueStatus) {
    setError("");
    setNotice("");
    try {
      await updateQueue({ queueId, status });
      setNotice(`Queue ${label(status).toLowerCase()}.`);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not update queue.");
    }
  }
  async function deleteQueue(queueId: Id<"queues">, queueLabel: string) {
    if (!window.confirm(`Delete queue "${queueLabel}"?`)) return;
    setError("");
    setNotice("");
    try {
      await removeQueue({ queueId });
      if (selectedQueueId === queueId) setSelectedQueueId("");
      if (editingQueueId === queueId) resetQueueForm();
      setNotice("Queue deleted.");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not delete queue.");
    }
  }

  async function queueAction(
    action: "call" | "start" | "complete" | "skip",
    tokenId?: Id<"queueTokens">,
  ) {
    if (!selectedQueue) return;
    setError("");
    setNotice("");
    setBusy(true);
    try {
      if (action === "call") {
        const result = await callNext({ queueId: selectedQueue._id });
        setNotice(
          result
            ? `Called token #${result.tokenNumber}.`
            : "No customers are waiting.",
        );
      } else if (tokenId && action === "start") {
        await startServing({ tokenId });
        setNotice("Service started.");
      } else if (tokenId && action === "complete") {
        await completeToken({ tokenId });
        setNotice("Service completed.");
      } else if (tokenId && action === "skip") {
        await skipToken({ tokenId });
        setNotice("Token skipped.");
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : "Queue operation failed.");
    } finally {
      setBusy(false);
    }
  }

  async function appointmentAction(
    action: "checkIn" | "complete" | "noShow",
    appointmentId: Id<"appointments">,
  ) {
    setError("");
    setNotice("");
    setBusy(true);
    try {
      if (action === "checkIn") {
        await checkInAppointment({ appointmentId });
        setNotice("Appointment checked in.");
      } else if (action === "complete") {
        await completeAppointment({ appointmentId });
        setNotice("Appointment completed.");
      } else {
        await markNoShow({ appointmentId });
        setNotice("Appointment marked no-show.");
      }
    } catch (e) {
      setError(
        e instanceof Error ? e.message : "Appointment operation failed.",
      );
    } finally {
      setBusy(false);
    }
  }

  if (
    services === undefined ||
    allQueues === undefined ||
    allAppointments === undefined
  ) {
    return (
      <main className="min-h-screen bg-gray-50 p-6">
        <div className="mx-auto max-w-7xl animate-pulse space-y-4">
          <div className="h-8 w-56 rounded bg-gray-200" />
          <div className="h-40 rounded-2xl bg-gray-200" />
        </div>
      </main>
    );
  }
  if (!service) {
    return (
      <main className="mx-auto max-w-3xl space-y-4 p-8">
        <h1 className="text-2xl font-semibold">Service not found</h1>
        <p className="text-sm text-gray-600">
          This service does not belong to this business or may have been
          deleted.
        </p>
        <Link
          className="text-sm underline"
          href={`/business/${businessId}/services`}
        >
          Back to services
        </Link>
      </main>
    );
  }

  const waiting =
    tokens?.filter((item) => item.status === "waiting").length ?? 0;
  const called = tokens?.filter((item) => item.status === "called").length ?? 0;
  const checkedIn =
    tokens?.filter((item) => item.status === "checked_in").length ?? 0;
  const serving =
    tokens?.filter((item) => item.status === "serving").length ?? 0;
  const activeAppointments = appointments.filter((item) =>
    ["booked", "checked_in"].includes(item.status),
  ).length;

  return (
    <main className="min-h-screen bg-gray-50 text-gray-950">
      <div className="mx-auto max-w-7xl space-y-6 p-4 sm:p-6 lg:p-8">
        <Link
          href={`/business/${businessId}/services`}
          className="text-sm text-gray-500 hover:text-gray-950"
        >
          ← All services
        </Link>
        <header className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
          <div>
            <p className="text-sm font-medium text-gray-500">
              SERVICE WORKSPACE
            </p>
            <div className="mt-1 flex flex-wrap items-center gap-3">
              <h1 className="text-3xl font-semibold tracking-tight">
                {service.name}
              </h1>
              <Pill value={service.isActive ? "active" : "inactive"} />
            </div>
            <p className="mt-2 max-w-2xl text-sm text-gray-600">
              {service.description ||
                "Manage this service's queues, appointments, and capacity from here."}
            </p>
            <div className="mt-3 flex flex-wrap gap-2">
              <span className="rounded-full border bg-white px-3 py-1 text-xs">
                {service.durationMinutes} min duration
              </span>
              {service.queueEnabled && (
                <span className="rounded-full border bg-white px-3 py-1 text-xs">
                  Queues enabled
                </span>
              )}
              {service.appointmentsEnabled && (
                <span className="rounded-full border bg-white px-3 py-1 text-xs">
                  Appointments enabled
                </span>
              )}
            </div>
          </div>
          <ActionButton onClick={startSettingsEdit}>
            Edit service settings
          </ActionButton>
        </header>

        {error && (
          <div
            role="alert"
            className="rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-800"
          >
            {error}
          </div>
        )}
        {notice && (
          <div
            role="status"
            className="rounded-xl border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-800"
          >
            {notice}
          </div>
        )}

        {editingSettings && (
          <form
            onSubmit={saveSettings}
            className="grid gap-4 rounded-2xl border bg-white p-5 md:grid-cols-2"
          >
            <h2 className="text-lg font-semibold md:col-span-2">
              Service settings
            </h2>
            <div className="space-y-1.5">
              <label className="text-sm font-medium">Name</label>
              <input
                className={inputClass}
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-sm font-medium">Duration in minutes</label>
              <input
                className={inputClass}
                type="number"
                min={1}
                max={480}
                value={duration}
                onChange={(e) => setDuration(e.target.value)}
                required
              />
            </div>
            <div className="space-y-1.5 md:col-span-2">
              <label className="text-sm font-medium">Description</label>
              <textarea
                className={inputClass}
                rows={2}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
              />
            </div>
            <div className="flex flex-wrap gap-5 md:col-span-2">
              <label className="flex items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  checked={queueEnabled}
                  onChange={(e) => setQueueEnabled(e.target.checked)}
                />{" "}
                Enable live queue
              </label>
              <label className="flex items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  checked={appointmentsEnabled}
                  onChange={(e) => setAppointmentsEnabled(e.target.checked)}
                />{" "}
                Enable appointments
              </label>
            </div>
            <div className="flex gap-2 md:col-span-2">
              <button
                disabled={busy}
                className="rounded-lg bg-gray-950 px-4 py-2 text-sm text-white"
              >
                {busy ? "Saving…" : "Save settings"}
              </button>
              <ActionButton onClick={() => setEditingSettings(false)}>
                Cancel
              </ActionButton>
            </div>
          </form>
        )}

        <nav className="flex gap-1 overflow-x-auto rounded-xl border bg-white p-1">
          {tabs.map((item) => (
            <button
              key={item.id}
              onClick={() => setTab(item.id)}
              className={`shrink-0 rounded-lg px-3 py-2.5 text-sm font-medium ${tab === item.id ? "bg-gray-950 text-white" : "text-gray-600 hover:bg-gray-100"}`}
            >
              {item.label}
            </button>
          ))}
        </nav>

        {tab === "overview" && (
          <section className="space-y-5">
            <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
              {[
                {
                  label: "Queues",
                  value: queues.length,
                  hint: "Configured for this service",
                },
                {
                  label: "Active queues",
                  value: queues.filter((q) => q.status === "active").length,
                  hint: "Accepting customers",
                },
                {
                  label: "Active appointments",
                  value: activeAppointments,
                  hint: "Booked or checked in",
                },
                {
                  label: "Appointment records",
                  value: appointments.length,
                  hint: "All recorded statuses",
                },
              ].map((metric) => (
                <article
                  key={metric.label}
                  className="rounded-2xl border bg-white p-5"
                >
                  <p className="text-sm text-gray-500">{metric.label}</p>
                  <p className="mt-2 text-3xl font-semibold">{metric.value}</p>
                  <p className="mt-1 text-xs text-gray-500">{metric.hint}</p>
                </article>
              ))}
            </div>
            <div className="grid gap-4 lg:grid-cols-3">
              <button
                onClick={() => setTab("queues")}
                className="rounded-2xl border bg-white p-5 text-left hover:border-gray-400"
              >
                <h2 className="font-semibold">Configure queues</h2>
                <p className="mt-2 text-sm text-gray-500">
                  Create queues linked specifically to {service.name} and manage
                  prerequisites.
                </p>
                <span className="mt-4 inline-block text-sm font-medium">
                  Manage queues →
                </span>
              </button>
              <button
                onClick={() => setTab("live")}
                className="rounded-2xl border bg-white p-5 text-left hover:border-gray-400"
              >
                <h2 className="font-semibold">Run live queue</h2>
                <p className="mt-2 text-sm text-gray-500">
                  Call tokens, start service, and complete or skip customers.
                </p>
                <span className="mt-4 inline-block text-sm font-medium">
                  Open live queue →
                </span>
              </button>
              <button
                onClick={() => setTab("appointments")}
                className="rounded-2xl border bg-white p-5 text-left hover:border-gray-400"
              >
                <h2 className="font-semibold">Appointment desk</h2>
                <p className="mt-2 text-sm text-gray-500">
                  View bookings for this service, check in customers, and
                  complete visits.
                </p>
                <span className="mt-4 inline-block text-sm font-medium">
                  Manage appointments →
                </span>
              </button>
            </div>
          </section>
        )}

        {tab === "queues" && (
          <section className="grid items-start gap-5 xl:grid-cols-[1.1fr_0.9fr]">
            <div className="space-y-3">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <h2 className="text-xl font-semibold">
                    Queues for {service.name}
                  </h2>
                  <p className="mt-1 text-sm text-gray-500">
                    Only queues linked to this service are shown.
                  </p>
                </div>
                <ActionButton
                  onClick={() => {
                    resetQueueForm();
                    setShowQueueForm(true);
                  }}
                  disabled={!service.queueEnabled}
                >
                  + New queue
                </ActionButton>
              </div>
              {!service.queueEnabled && (
                <p className="rounded-xl border border-amber-200 bg-amber-50 p-3 text-sm text-amber-800">
                  Live queues are disabled for this service. Enable them in
                  service settings to create queues.
                </p>
              )}
              {queues.length === 0 ? (
                <div className="rounded-2xl border border-dashed bg-white p-8 text-center">
                  <h3 className="font-semibold">No queues yet</h3>
                  <p className="mt-2 text-sm text-gray-500">
                    Create a queue for this service to start managing walk-in
                    customers.
                  </p>
                </div>
              ) : (
                queues.map((queue) => (
                  <article
                    key={queue._id}
                    className="rounded-2xl border bg-white p-4"
                  >
                    <div className="flex flex-col justify-between gap-3 sm:flex-row">
                      <div>
                        <div className="flex flex-wrap items-center gap-2">
                          <h3 className="font-semibold">{queue.name}</h3>
                          <Pill value={queue.status} />
                        </div>
                        <p className="mt-1 text-sm text-gray-500">
                          {queue.description || "No description"}
                        </p>
                        <p className="mt-2 text-xs text-gray-500">
                          {queue.prerequisites.length} prerequisite(s)
                        </p>
                      </div>
                      <div className="flex flex-wrap content-start gap-2">
                        <ActionButton
                          onClick={() => {
                            setSelectedQueueId(queue._id);
                            setTab("live");
                          }}
                        >
                          Live operations
                        </ActionButton>
                        <ActionButton onClick={() => beginQueueEdit(queue)}>
                          Edit
                        </ActionButton>
                        {queue.status !== "active" && (
                          <ActionButton
                            onClick={() =>
                              void queueStatus(queue._id, "active")
                            }
                          >
                            Activate
                          </ActionButton>
                        )}
                        {queue.status === "active" && (
                          <ActionButton
                            onClick={() =>
                              void queueStatus(queue._id, "paused")
                            }
                          >
                            Pause
                          </ActionButton>
                        )}
                        {queue.status !== "closed" && (
                          <ActionButton
                            onClick={() =>
                              void queueStatus(queue._id, "closed")
                            }
                          >
                            Close
                          </ActionButton>
                        )}
                        {queue.status === "closed" && (
                          <ActionButton
                            onClick={() =>
                              void queueStatus(queue._id, "paused")
                            }
                          >
                            Reopen
                          </ActionButton>
                        )}
                        <ActionButton
                          danger
                          onClick={() =>
                            void deleteQueue(queue._id, queue.name)
                          }
                        >
                          Delete
                        </ActionButton>
                      </div>
                    </div>
                  </article>
                ))
              )}
            </div>
            {showQueueForm && (
              <form
                onSubmit={saveQueue}
                className="space-y-4 rounded-2xl border bg-white p-5"
              >
                <h2 className="text-lg font-semibold">
                  {editingQueueId ? "Edit queue" : "Create queue"}
                </h2>
                <p className="text-sm text-gray-500">
                  Service: <strong>{service.name}</strong> (fixed)
                </p>
                <div className="space-y-1.5">
                  <label className="text-sm font-medium">Queue name</label>
                  <input
                    className={inputClass}
                    value={queueName}
                    onChange={(e) => setQueueName(e.target.value)}
                    required
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-sm font-medium">Description</label>
                  <textarea
                    className={inputClass}
                    rows={2}
                    value={queueDescription}
                    onChange={(e) => setQueueDescription(e.target.value)}
                  />
                </div>
                <div className="space-y-3">
                  <div className="flex items-center justify-between gap-2">
                    <h3 className="text-sm font-semibold">Prerequisites</h3>
                    <ActionButton onClick={addPrerequisite}>
                      Add requirement
                    </ActionButton>
                  </div>
                  {prerequisites.length === 0 && (
                    <p className="text-sm text-gray-500">
                      No prerequisites configured.
                    </p>
                  )}
                  {prerequisites.map((item, index) => (
                    <div
                      key={item.id}
                      className="space-y-2 rounded-xl border p-3"
                    >
                      <input
                        className={inputClass}
                        placeholder="Requirement label"
                        value={item.label}
                        onChange={(e) =>
                          patchPrerequisite(index, { label: e.target.value })
                        }
                        required
                      />
                      <input
                        className={inputClass}
                        placeholder="Optional explanation"
                        value={item.description ?? ""}
                        onChange={(e) =>
                          patchPrerequisite(index, {
                            description: e.target.value,
                          })
                        }
                      />
                      <div className="flex items-center justify-between">
                        <label className="flex items-center gap-2 text-sm">
                          <input
                            type="checkbox"
                            checked={item.isRequired}
                            onChange={(e) =>
                              patchPrerequisite(index, {
                                isRequired: e.target.checked,
                              })
                            }
                          />{" "}
                          Required acknowledgement
                        </label>
                        <ActionButton
                          danger
                          onClick={() =>
                            setPrerequisites((items) =>
                              items.filter((_, i) => i !== index),
                            )
                          }
                        >
                          Remove
                        </ActionButton>
                      </div>
                    </div>
                  ))}
                </div>
                <div className="flex gap-2">
                  <button
                    disabled={busy}
                    className="rounded-lg bg-gray-950 px-4 py-2 text-sm text-white"
                  >
                    {busy ? "Saving…" : "Save queue"}
                  </button>
                  <ActionButton onClick={resetQueueForm}>Cancel</ActionButton>
                </div>
              </form>
            )}
          </section>
        )}

        {tab === "live" && (
          <section className="space-y-5">
            <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-end">
              <div>
                <h2 className="text-xl font-semibold">Live queue</h2>
                <p className="mt-1 text-sm text-gray-500">
                  Live token controls for {service.name}.
                </p>
              </div>
              <div className="sm:w-80">
                <label className="mb-1 block text-sm font-medium">Queue</label>
                <select
                  className={inputClass}
                  value={selectedQueue?._id ?? ""}
                  onChange={(e) => setSelectedQueueId(e.target.value)}
                >
                  <option value="">Choose a queue</option>
                  {queues.map((q) => (
                    <option key={q._id} value={q._id}>
                      {q.name} · {label(q.status)}
                    </option>
                  ))}
                </select>
              </div>
            </div>
            {!selectedQueue ? (
              <div className="rounded-2xl border border-dashed bg-white p-10 text-center">
                <p className="font-semibold">No queue selected</p>
                <p className="mt-2 text-sm text-gray-500">
                  Create a queue in the Queues tab first.
                </p>
                <ActionButton onClick={() => setTab("queues")}>
                  Configure queues
                </ActionButton>
              </div>
            ) : (
              <>
                <div className="flex flex-col justify-between gap-3 rounded-2xl border bg-white p-5 sm:flex-row sm:items-center">
                  <div>
                    <div className="flex flex-wrap items-center gap-2">
                      <h3 className="text-lg font-semibold">
                        {selectedQueue.name}
                      </h3>
                      <Pill value={selectedQueue.status} />
                    </div>
                    <p className="mt-1 text-sm text-gray-500">
                      {selectedQueue.description}
                    </p>
                  </div>
                  <ActionButton
                    primary
                    disabled={busy || selectedQueue.status !== "active"}
                    onClick={() => void queueAction("call")}
                  >
                    Call next customer
                  </ActionButton>
                </div>
                <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
                  {[
                    { label: "Waiting", count: waiting },
                    { label: "Called", count: called },
                    { label: "Checked in", count: checkedIn },
                    { label: "In service", count: serving },
                  ].map((item) => (
                    <article
                      key={item.label}
                      className="rounded-2xl border bg-white p-4"
                    >
                      <p className="text-sm text-gray-500">{item.label}</p>
                      <p className="mt-2 text-3xl font-semibold">
                        {item.count}
                      </p>
                    </article>
                  ))}
                </div>
                <div className="overflow-hidden rounded-2xl border bg-white">
                  <div className="border-b p-4">
                    <h3 className="font-semibold">Active tokens</h3>
                    <p className="mt-1 text-xs text-gray-500">
                      Realtime status updates from Convex.
                    </p>
                  </div>
                  {tokens === undefined ? (
                    <p className="p-5 text-sm text-gray-500">Loading tokens…</p>
                  ) : tokens.length === 0 ? (
                    <p className="p-8 text-center text-sm text-gray-500">
                      No active tokens.
                    </p>
                  ) : (
                    <div className="divide-y">
                      {tokens.map((token) => (
                        <article
                          key={token._id}
                          className="flex flex-col justify-between gap-3 p-4 sm:flex-row sm:items-center"
                        >
                          <div className="flex items-start gap-3">
                            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gray-100 font-semibold">
                              #{token.tokenNumber}
                            </div>
                            <div>
                              <div className="flex flex-wrap items-center gap-2">
                                <p className="font-semibold">
                                  Token #{token.tokenNumber}
                                </p>
                                <Pill value={token.status} />
                              </div>
                              <p className="mt-1 text-sm text-gray-500">
                                Joined {dateTime(token.joinedAt)}
                              </p>
                              {token.customerNote && (
                                <p className="mt-1 text-sm">
                                  {token.customerNote}
                                </p>
                              )}
                              {token.status === "called" &&
                                token.graceDeadlineAt && (
                                  <p className="mt-1 text-xs text-amber-700">
                                    Check-in deadline{" "}
                                    {time(token.graceDeadlineAt)}
                                  </p>
                                )}
                            </div>
                          </div>
                          <div className="flex flex-wrap gap-2">
                            {token.status === "checked_in" && (
                              <ActionButton
                                primary
                                disabled={busy}
                                onClick={() =>
                                  void queueAction("start", token._id)
                                }
                              >
                                Start service
                              </ActionButton>
                            )}
                            {token.status === "serving" && (
                              <ActionButton
                                primary
                                disabled={busy}
                                onClick={() =>
                                  void queueAction("complete", token._id)
                                }
                              >
                                Complete
                              </ActionButton>
                            )}
                            {["waiting", "called", "checked_in"].includes(
                              token.status,
                            ) && (
                              <ActionButton
                                danger
                                disabled={busy}
                                onClick={() =>
                                  void queueAction("skip", token._id)
                                }
                              >
                                Skip
                              </ActionButton>
                            )}
                          </div>
                        </article>
                      ))}
                    </div>
                  )}
                </div>
              </>
            )}
          </section>
        )}

        {tab === "appointments" && (
          <section className="space-y-5">
            {!service.appointmentsEnabled && (
              <p className="rounded-xl border border-amber-200 bg-amber-50 p-3 text-sm text-amber-800">
                Appointments are disabled for this service. Enable them in
                service settings to accept new bookings.
              </p>
            )}
            <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-end">
              <div>
                <h2 className="text-xl font-semibold">Appointments</h2>
                <p className="mt-1 text-sm text-gray-500">
                  Only appointments for {service.name} are displayed.
                </p>
              </div>
              <div className="grid gap-3 sm:grid-cols-2">
                <div>
                  <label className="mb-1 block text-sm font-medium">Date</label>
                  <input
                    type="date"
                    value={date}
                    onChange={(e) => setDate(e.target.value)}
                    className={inputClass}
                  />
                </div>
                <div>
                  <label className="mb-1 block text-sm font-medium">
                    Status
                  </label>
                  <select
                    className={inputClass}
                    value={appointmentFilter}
                    onChange={(e) =>
                      setAppointmentFilter(
                        e.target.value as "all" | AppointmentStatus,
                      )
                    }
                  >
                    <option value="all">All statuses</option>
                    <option value="booked">Booked</option>
                    <option value="checked_in">Checked in</option>
                    <option value="completed">Completed</option>
                    <option value="cancelled">Cancelled</option>
                    <option value="no_show">No-show</option>
                  </select>
                </div>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
              {[
                {
                  label: "Booked",
                  count: appointments.filter((a) => a.status === "booked")
                    .length,
                },
                {
                  label: "Checked in",
                  count: appointments.filter((a) => a.status === "checked_in")
                    .length,
                },
                {
                  label: "Completed",
                  count: appointments.filter((a) => a.status === "completed")
                    .length,
                },
                {
                  label: "No-shows",
                  count: appointments.filter((a) => a.status === "no_show")
                    .length,
                },
              ].map((item) => (
                <article
                  key={item.label}
                  className="rounded-2xl border bg-white p-4"
                >
                  <p className="text-sm text-gray-500">{item.label}</p>
                  <p className="mt-2 text-2xl font-semibold">{item.count}</p>
                </article>
              ))}
            </div>
            <div className="overflow-hidden rounded-2xl border bg-white">
              {filteredAppointments.length === 0 ? (
                <p className="p-10 text-center text-sm text-gray-500">
                  No matching appointments for this date.
                </p>
              ) : (
                <div className="divide-y">
                  {filteredAppointments.map((item) => (
                    <article
                      key={item._id}
                      className="flex flex-col justify-between gap-3 p-4 sm:flex-row sm:items-center"
                    >
                      <div className="flex items-start gap-4">
                        <div className="rounded-xl bg-gray-50 p-3 text-center">
                          <p className="font-semibold">
                            {time(item.scheduledStart)}
                          </p>
                          <p className="mt-1 text-xs text-gray-500">
                            {time(item.scheduledEnd)}
                          </p>
                        </div>
                        <div>
                          <p className="font-semibold">{service.name}</p>
                          <p className="mt-1 text-sm text-gray-500">
                            {dateTime(item.scheduledStart)}
                          </p>
                          {item.notes && (
                            <p className="mt-2 text-sm">{item.notes}</p>
                          )}
                          <div className="mt-2">
                            <Pill value={item.status} />
                          </div>
                        </div>
                      </div>
                      <div className="flex flex-wrap gap-2">
                        {item.status === "booked" && (
                          <ActionButton
                            primary
                            disabled={busy}
                            onClick={() =>
                              void appointmentAction("checkIn", item._id)
                            }
                          >
                            Check in
                          </ActionButton>
                        )}
                        {item.status === "checked_in" && (
                          <ActionButton
                            primary
                            disabled={busy}
                            onClick={() =>
                              void appointmentAction("complete", item._id)
                            }
                          >
                            Complete visit
                          </ActionButton>
                        )}
                        {item.status === "booked" &&
                          Date.now() >= item.scheduledEnd && (
                            <ActionButton
                              danger
                              disabled={busy}
                              onClick={() =>
                                void appointmentAction("noShow", item._id)
                              }
                            >
                              Mark no-show
                            </ActionButton>
                          )}
                      </div>
                    </article>
                  ))}
                </div>
              )}
            </div>
          </section>
        )}

        {tab === "availability" && (
          <section className="space-y-5">
            <div>
              <h2 className="text-xl font-semibold">Availability</h2>
              <p className="mt-1 text-sm text-gray-500">
                Calculated from the existing business hours and Convex capacity
                rules.
              </p>
            </div>
            {!service.appointmentsEnabled ? (
              <div className="rounded-2xl border bg-white p-8 text-sm text-gray-500">
                Appointments are disabled for this service.
              </div>
            ) : (
              <>
                <div className="flex flex-wrap gap-4 rounded-2xl border bg-white p-5">
                  <div>
                    <label className="mb-1 block text-sm font-medium">
                      Date
                    </label>
                    <input
                      type="date"
                      value={date}
                      onChange={(e) => setDate(e.target.value)}
                      className={inputClass}
                    />
                  </div>
                  <div className="self-end text-sm text-gray-500">
                    Timezone: Asia/Kolkata (IST)
                  </div>
                </div>
                {availability === undefined ? (
                  <p className="text-sm text-gray-500">
                    Calculating availability…
                  </p>
                ) : (
                  <>
                    <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
                      {[
                        {
                          label: "Daily capacity",
                          value:
                            "dailyCapacity" in availability
                              ? availability.dailyCapacity
                              : 0,
                        },
                        {
                          label: "Booked appointments",
                          value:
                            "bookedAppointments" in availability
                              ? availability.bookedAppointments
                              : 0,
                        },
                        {
                          label: "Active queue tokens",
                          value:
                            "activeQueueTokens" in availability
                              ? availability.activeQueueTokens
                              : 0,
                        },
                        {
                          label: "Remaining capacity",
                          value: availability.remainingCapacity,
                        },
                      ].map((item) => (
                        <article
                          key={item.label}
                          className="rounded-2xl border bg-white p-4"
                        >
                          <p className="text-sm text-gray-500">{item.label}</p>
                          <p className="mt-2 text-2xl font-semibold">
                            {item.value}
                          </p>
                        </article>
                      ))}
                    </div>
                    <div className="rounded-2xl border bg-white p-5">
                      <div className="flex items-center justify-between gap-3">
                        <h3 className="font-semibold">Generated time slots</h3>
                        <span className="text-sm text-gray-500">
                          {availability.slots.length} slots
                        </span>
                      </div>
                      {availability.slots.length === 0 ? (
                        <p className="mt-5 text-sm text-gray-500">
                          No slots generated. Check business opening hours and
                          closures.
                        </p>
                      ) : (
                        <div className="mt-4 grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-4">
                          {availability.slots.map((slot) => (
                            <div
                              key={slot.scheduledStart}
                              className={`rounded-xl border p-3 ${slot.available ? "border-emerald-200 bg-emerald-50" : "bg-gray-50"}`}
                            >
                              <p className="font-medium">
                                {time(slot.scheduledStart)}–
                                {time(slot.scheduledEnd)}
                              </p>
                              <p
                                className={`mt-2 text-xs ${slot.available ? "text-emerald-700" : "text-gray-500"}`}
                              >
                                {slot.available ? "Available" : "Unavailable"}
                              </p>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </>
                )}
              </>
            )}
          </section>
        )}
      </div>
    </main>
  );
}
