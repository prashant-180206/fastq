
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
  const id = businessId as Id<"businesses">;

  const services = useQuery(api.services.getByBusiness, {
    businessId: id,
  });

  const createService = useMutation(api.services.create);
  const updateService = useMutation(api.services.update);
  const deleteService = useMutation(api.services.remove);

  const [editingId, setEditingId] = useState<string | null>(null);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [durationMinutes, setDurationMinutes] = useState("20");
  const [queueEnabled, setQueueEnabled] = useState(true);
  const [appointmentsEnabled, setAppointmentsEnabled] = useState(true);
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  function resetForm() {
    setEditingId(null);
    setName("");
    setDescription("");
    setDurationMinutes("20");
    setQueueEnabled(true);
    setAppointmentsEnabled(true);
    setError("");
  }

  function startEditing(service: NonNullable<typeof services>[number]) {
    setEditingId(service._id);
    setName(service.name);
    setDescription(service.description ?? "");
    setDurationMinutes(String(service.durationMinutes));
    setQueueEnabled(service.queueEnabled);
    setAppointmentsEnabled(service.appointmentsEnabled);
    setError("");
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");

    const duration = Number(durationMinutes);

    if (!name.trim()) {
      setError("Service name is required.");
      return;
    }

    if (
      !Number.isInteger(duration) ||
      duration < 1 ||
      duration > 480
    ) {
      setError("Duration must be a whole number between 1 and 480 minutes.");
      return;
    }

    if (!queueEnabled && !appointmentsEnabled) {
      setError("Enable queues, appointments, or both.");
      return;
    }

    setSaving(true);

    try {
      if (editingId) {
        await updateService({
          serviceId: editingId as Id<"services">,
          name: name.trim(),
          description: description.trim(),
          durationMinutes: duration,
          queueEnabled,
          appointmentsEnabled,
        });
      } else {
        await createService({
          businessId: id,
          name: name.trim(),
          description: description.trim() || undefined,
          durationMinutes: duration,
          queueEnabled,
          appointmentsEnabled,
        });
      }

      resetForm();
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Could not save service."
      );
    } finally {
      setSaving(false);
    }
  }

  async function toggleActive(
    serviceId: Id<"services">,
    isActive: boolean
  ) {
    setError("");

    try {
      await updateService({ serviceId, isActive: !isActive });
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Could not update service."
      );
    }
  }

  async function handleDelete(
    serviceId: Id<"services">,
    serviceName: string
  ) {
    if (!window.confirm(`Delete "${serviceName}" permanently?`)) {
      return;
    }

    setError("");

    try {
      await deleteService({ serviceId });

      if (editingId === serviceId) {
        resetForm();
      }
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Could not delete service."
      );
    }
  }

  if (services === undefined) {
    return <main className="p-6">Loading services...</main>;
  }

  return (
    <main className="mx-auto max-w-4xl space-y-6 p-6">
      <Link
        href={`/business/${businessId}`}
        className="text-sm text-gray-500 hover:underline"
      >
        ← Back to business
      </Link>

      <header>
        <h1 className="text-2xl font-semibold">Services</h1>
        <p className="mt-1 text-sm text-gray-500">
          Configure what your business offers and how long each service takes.
        </p>
      </header>

      {error && (
        <p
          role="alert"
          className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700"
        >
          {error}
        </p>
      )}

      {/* Service list */}
      <section className="space-y-4">
        <h2 className="font-semibold">
          Existing services ({services.length})
        </h2>

        {services.length === 0 ? (
          <p className="rounded-xl border border-dashed p-6 text-sm text-gray-500">
            No services yet. Create your first service below.
          </p>
        ) : (
          <div className="space-y-3">
            {services.map((service) => (
              <article
                key={service._id}
                className="rounded-xl border p-4"
              >
                <div className="flex flex-wrap items-start justify-between gap-4">
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <h3 className="font-semibold">{service.name}</h3>
                      <span className="rounded-full border px-2 py-1 text-xs">
                        {service.isActive ? "Active" : "Inactive"}
                      </span>
                    </div>

                    <p className="mt-2 text-sm text-gray-500">
                      {service.description || "No description"}
                    </p>

                    <p className="mt-2 text-sm">
                      {service.durationMinutes} minutes per customer
                    </p>

                    <div className="mt-2 flex flex-wrap gap-2 text-xs">
                      {service.queueEnabled && (
                        <span className="rounded-full border px-2 py-1">
                          Queue
                        </span>
                      )}
                      {service.appointmentsEnabled && (
                        <span className="rounded-full border px-2 py-1">
                          Appointments
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="flex flex-wrap gap-2">
                    <button
                      type="button"
                      onClick={() => startEditing(service)}
                      className="rounded-lg border px-3 py-1.5 text-sm"
                    >
                      Edit
                    </button>

                    <button
                      type="button"
                      onClick={() =>
                        toggleActive(service._id, service.isActive)
                      }
                      className="rounded-lg border px-3 py-1.5 text-sm"
                    >
                      {service.isActive ? "Deactivate" : "Activate"}
                    </button>

                    <button
                      type="button"
                      onClick={() =>
                        handleDelete(service._id, service.name)
                      }
                      className="rounded-lg border border-red-200 px-3 py-1.5 text-sm text-red-600"
                    >
                      Delete
                    </button>
                  </div>
                </div>
              </article>
            ))}
          </div>
        )}
      </section>

      {/* Create / edit form */}
      <section className="rounded-xl border p-5">
        <h2 className="font-semibold">
          {editingId ? "Edit service" : "Create service"}
        </h2>

        <form onSubmit={handleSubmit} className="mt-4 space-y-4">
          <div className="space-y-1">
            <label htmlFor="service-name" className="text-sm font-medium">
              Service name
            </label>
            <input
              id="service-name"
              required
              maxLength={100}
              value={name}
              onChange={(event) => setName(event.target.value)}
              placeholder="General consultation"
              className="w-full rounded-lg border px-3 py-2"
            />
          </div>

          <div className="space-y-1">
            <label
              htmlFor="service-description"
              className="text-sm font-medium"
            >
              Description
            </label>
            <textarea
              id="service-description"
              rows={3}
              value={description}
              onChange={(event) => setDescription(event.target.value)}
              placeholder="Describe the service."
              className="w-full rounded-lg border px-3 py-2"
            />
          </div>

          <div className="space-y-1">
            <label
              htmlFor="service-duration"
              className="text-sm font-medium"
            >
              Estimated duration per customer (minutes)
            </label>
            <input
              id="service-duration"
              type="number"
              min={1}
              max={480}
              step={1}
              required
              value={durationMinutes}
              onChange={(event) => setDurationMinutes(event.target.value)}
              className="w-full rounded-lg border px-3 py-2"
            />
            <p className="text-xs text-gray-500">
              Used for queue wait estimates and appointment availability.
            </p>
          </div>

          <div className="space-y-3">
            <p className="text-sm font-medium">Booking methods</p>

            <label className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={queueEnabled}
                onChange={(event) => setQueueEnabled(event.target.checked)}
              />
              Allow customers to join a queue
            </label>

            <label className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={appointmentsEnabled}
                onChange={(event) =>
                  setAppointmentsEnabled(event.target.checked)
                }
              />
              Allow customers to book appointments
            </label>
          </div>

          <div className="flex flex-wrap gap-3">
            <button
              type="submit"
              disabled={saving}
              className="rounded-lg bg-black px-4 py-2.5 text-sm text-white disabled:opacity-50"
            >
              {saving
                ? "Saving..."
                : editingId
                  ? "Save changes"
                  : "Create service"}
            </button>

            {editingId && (
              <button
                type="button"
                onClick={resetForm}
                className="rounded-lg border px-4 py-2.5 text-sm"
              >
                Cancel editing
              </button>
            )}
          </div>
        </form>
      </section>
    </main>
  );
}
