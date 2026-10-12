"use client";

import { use, useState, type FormEvent } from "react";
import Link from "next/link";
import { useMutation, useQuery } from "convex/react";
import { api } from "@/../convex/_generated/api";
import type { Id } from "@/../convex/_generated/dataModel";

export default function BusinessServicesPage({
  params,
}: {
  params: Promise<{ businessId: string }>;
}) {
  const { businessId } = use(params);
  const businessDbId = businessId as Id<"businesses">;
  const services = useQuery(api.services.getByBusiness, {
    businessId: businessDbId,
  });
  const createService = useMutation(api.services.create);
  const updateService = useMutation(api.services.update);
  const removeService = useMutation(api.services.remove);

  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [durationMinutes, setDurationMinutes] = useState("20");
  const [queueEnabled, setQueueEnabled] = useState(true);
  const [appointmentsEnabled, setAppointmentsEnabled] = useState(true);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");

  async function create(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setNotice("");
    const duration = Number(durationMinutes);
    if (!name.trim()) return setError("Service name is required.");
    if (!Number.isInteger(duration) || duration < 1 || duration > 480) {
      return setError("Duration must be between 1 and 480 minutes.");
    }
    if (!queueEnabled && !appointmentsEnabled) {
      return setError("Enable queues, appointments, or both.");
    }

    setBusy(true);
    try {
      await createService({
        businessId: businessDbId,
        name: name.trim(),
        description: description.trim() || undefined,
        durationMinutes: duration,
        queueEnabled,
        appointmentsEnabled,
      });
      setName("");
      setDescription("");
      setDurationMinutes("20");
      setQueueEnabled(true);
      setAppointmentsEnabled(true);
      setShowCreateForm(false);
      setNotice(
        "Service created. Open it to configure its queues and appointments.",
      );
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not create service.");
    } finally {
      setBusy(false);
    }
  }

  async function toggleActive(serviceId: Id<"services">, isActive: boolean) {
    setError("");
    setNotice("");
    try {
      await updateService({ serviceId, isActive: !isActive });
      setNotice(isActive ? "Service deactivated." : "Service activated.");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not update service.");
    }
  }

  async function deleteService(serviceId: Id<"services">, serviceName: string) {
    if (
      !window.confirm(
        `Delete "${serviceName}"? This may be blocked if the service has dependent records.`,
      )
    )
      return;
    setError("");
    setNotice("");
    try {
      await removeService({ serviceId });
      setNotice("Service deleted.");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not delete service.");
    }
  }

  if (services === undefined) {
    return (
      <main className="min-h-screen bg-gray-50 p-6">
        <div className="mx-auto max-w-6xl animate-pulse space-y-4">
          <div className="h-8 w-48 rounded bg-gray-200" />
          <div className="h-40 rounded-2xl bg-gray-200" />
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-gray-50 text-gray-950">
      <div className="mx-auto max-w-6xl space-y-6 p-4 sm:p-6 lg:p-8">
        <Link
          href={`/business/${businessId}`}
          className="text-sm text-gray-500 hover:text-gray-950"
        >
          ← Business dashboard
        </Link>
        <header className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
          <div>
            <p className="text-sm font-medium text-gray-500">
              BUSINESS WORKSPACE
            </p>
            <h1 className="mt-1 text-3xl font-semibold tracking-tight">
              Services
            </h1>
            <p className="mt-2 text-sm text-gray-600">
              Each service has its own workspace for queues, appointments, and
              availability.
            </p>
          </div>
          <button
            onClick={() => setShowCreateForm((v) => !v)}
            className="rounded-lg bg-gray-950 px-4 py-2.5 text-sm font-medium text-white hover:bg-gray-800"
          >
            {showCreateForm ? "Close form" : "+ New service"}
          </button>
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

        {showCreateForm && (
          <form
            onSubmit={create}
            className="grid gap-4 rounded-2xl border bg-white p-5 md:grid-cols-2"
          >
            <div className="space-y-1.5">
              <label className="text-sm font-medium">Service name</label>
              <input
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                maxLength={100}
                placeholder="General consultation"
                className={inputClass}
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-sm font-medium">Duration (minutes)</label>
              <input
                type="number"
                value={durationMinutes}
                onChange={(e) => setDurationMinutes(e.target.value)}
                min={1}
                max={480}
                required
                className={inputClass}
              />
            </div>
            <div className="space-y-1.5 md:col-span-2">
              <label className="text-sm font-medium">Description</label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={2}
                className={inputClass}
                placeholder="Describe the service."
              />
            </div>
            <div className="flex flex-wrap gap-5 md:col-span-2">
              <label className="flex items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  checked={queueEnabled}
                  onChange={(e) => setQueueEnabled(e.target.checked)}
                />{" "}
                Live queue enabled
              </label>
              <label className="flex items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  checked={appointmentsEnabled}
                  onChange={(e) => setAppointmentsEnabled(e.target.checked)}
                />{" "}
                Appointments enabled
              </label>
            </div>
            <div className="flex gap-2 md:col-span-2">
              <button
                disabled={busy}
                className="rounded-lg bg-gray-950 px-4 py-2 text-sm font-medium text-white disabled:opacity-50"
              >
                {busy ? "Creating…" : "Create service"}
              </button>
              <button
                type="button"
                onClick={() => setShowCreateForm(false)}
                className="rounded-lg border px-4 py-2 text-sm"
              >
                Cancel
              </button>
            </div>
          </form>
        )}

        {services.length === 0 ? (
          <div className="rounded-2xl border border-dashed bg-white px-6 py-16 text-center">
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-gray-100 text-xl">
              ＋
            </div>
            <h2 className="mt-4 font-semibold">Create your first service</h2>
            <p className="mx-auto mt-2 max-w-md text-sm text-gray-500">
              Services are the organizing unit for queues, appointment handling,
              and capacity planning.
            </p>
            <button
              onClick={() => setShowCreateForm(true)}
              className="mt-5 rounded-lg bg-gray-950 px-4 py-2.5 text-sm font-medium text-white"
            >
              Create a service
            </button>
          </div>
        ) : (
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {services.map((service) => (
              <article
                key={service._id}
                className="flex flex-col rounded-2xl border bg-white p-5 transition hover:border-gray-300 hover:shadow-sm"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <h2 className="truncate text-lg font-semibold">
                      {service.name}
                    </h2>
                    <p className="mt-1 text-sm text-gray-500">
                      {service.durationMinutes} min per customer
                    </p>
                  </div>
                  <span
                    className={`shrink-0 rounded-full border px-2.5 py-1 text-xs ${service.isActive ? "border-emerald-200 bg-emerald-50 text-emerald-700" : "border-gray-200 bg-gray-100 text-gray-600"}`}
                  >
                    {service.isActive ? "Active" : "Inactive"}
                  </span>
                </div>
                <p className="mt-4 min-h-10 text-sm text-gray-600">
                  {service.description || "No description added."}
                </p>
                <div className="mt-4 flex flex-wrap gap-2">
                  {service.queueEnabled && (
                    <span className="rounded-full bg-gray-100 px-2.5 py-1 text-xs">
                      Live queue
                    </span>
                  )}
                  {service.appointmentsEnabled && (
                    <span className="rounded-full bg-gray-100 px-2.5 py-1 text-xs">
                      Appointments
                    </span>
                  )}
                </div>
                <div className="mt-6 flex flex-wrap gap-2">
                  <Link
                    href={`/business/${businessId}/services/${service._id}`}
                    className="inline-flex flex-1 items-center justify-center rounded-lg bg-gray-950 px-3 py-2.5 text-sm font-medium text-white hover:bg-gray-800"
                  >
                    Open service workspace →
                  </Link>
                  <button
                    onClick={() =>
                      void toggleActive(service._id, service.isActive)
                    }
                    className="rounded-lg border px-3 py-2.5 text-sm"
                  >
                    {service.isActive ? "Deactivate" : "Activate"}
                  </button>
                  <button
                    onClick={() =>
                      void deleteService(service._id, service.name)
                    }
                    className="rounded-lg border border-red-200 px-3 py-2.5 text-sm text-red-700 hover:bg-red-50"
                  >
                    Delete
                  </button>
                </div>
              </article>
            ))}
          </div>
        )}
      </div>
    </main>
  );
}

const inputClass =
  "w-full rounded-lg border border-gray-200 bg-white px-3 py-2.5 text-sm outline-none focus:border-gray-500 focus:ring-2 focus:ring-gray-100";
