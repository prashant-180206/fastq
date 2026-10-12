"use client";

import { use, useState, type FormEvent } from "react";
import Link from "next/link";
import { useMutation, useQuery } from "convex/react";
import { api } from "@/../convex/_generated/api";
import type { Id } from "@/../convex/_generated/dataModel";

type Prerequisite = {
  id: string;
  label: string;
  description?: string;
  isRequired: boolean;
};

type QueueStatus = "active" | "paused" | "closed";

const emptyPrerequisite = (): Prerequisite => ({
  id: `requirement-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
  label: "",
  description: "",
  isRequired: true,
});

export default function BusinessQueuesPage({
  params,
}: {
  params: Promise<{ businessId: string }>;
}) {
  const { businessId } = use(params);
  const id = businessId as Id<"businesses">;

  const queues = useQuery(api.queue.getByBusiness, {
    businessId: id,
  });

  const services = useQuery(api.services.getByBusiness, {
    businessId: id,
  });

  const createQueue = useMutation(api.queue.create);
  const updateQueue = useMutation(api.queue.update);
  const removeQueue = useMutation(api.queue.remove);

  const [editingId, setEditingId] = useState<string | null>(null);
  const [serviceId, setServiceId] = useState("");
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [prerequisites, setPrerequisites] = useState<Prerequisite[]>([]);
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  const activeServices = services?.filter((service) => service.isActive) ?? [];

  function resetForm() {
    setEditingId(null);
    setServiceId("");
    setName("");
    setDescription("");
    setPrerequisites([]);
    setError("");
  }

  function startEditing(queue: NonNullable<typeof queues>[number]) {
    setEditingId(queue._id);
    setServiceId(queue.serviceId);
    setName(queue.name);
    setDescription(queue.description);
    setPrerequisites(queue.prerequisites.map((item) => ({ ...item })));
    setError("");
  }

  function updatePrerequisite(index: number, patch: Partial<Prerequisite>) {
    setPrerequisites((current) =>
      current.map((item, i) => (i === index ? { ...item, ...patch } : item)),
    );
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");

    if (!serviceId) {
      setError("Select a service for this queue.");
      return;
    }

    const cleanedPrerequisites = prerequisites.map((item) => ({
      ...item,
      id: item.id.trim(),
      label: item.label.trim(),
      description: item.description?.trim() || undefined,
    }));

    if (cleanedPrerequisites.some((item) => !item.label)) {
      setError("Every prerequisite needs a label.");
      return;
    }

    if (!name.trim() || !description.trim()) {
      setError("Queue name and description are required.");
      return;
    }

    setSaving(true);

    try {
      if (editingId) {
        await updateQueue({
          queueId: editingId as Id<"queues">,
          serviceId: serviceId as Id<"services">,
          name: name.trim(),
          description: description.trim(),
          prerequisites: cleanedPrerequisites,
        });
      } else {
        await createQueue({
          businessId: id,
          serviceId: serviceId as Id<"services">,
          name: name.trim(),
          description: description.trim(),
          prerequisites: cleanedPrerequisites,
        });
      }

      resetForm();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not save queue.");
    } finally {
      setSaving(false);
    }
  }

  async function changeStatus(queueId: Id<"queues">, status: QueueStatus) {
    setError("");

    try {
      await updateQueue({ queueId, status });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not update status.");
    }
  }

  async function deleteQueue(queueId: Id<"queues">, queueName: string) {
    if (!window.confirm(`Delete "${queueName}" permanently?`)) return;

    setError("");

    try {
      await removeQueue({ queueId });

      if (editingId === queueId) {
        resetForm();
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not delete queue.");
    }
  }

  if (queues === undefined || services === undefined) {
    return <main className="p-6">Loading queues and services...</main>;
  }

  function getService(serviceId: Id<"services">) {
    return services?.find((service) => service._id === serviceId);
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
        <h1 className="text-2xl font-semibold">Queue management</h1>
        <p className="mt-1 text-sm text-gray-500">
          Assign each queue to a service and configure customer prerequisites.
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

      <section className="space-y-4">
        <h2 className="font-semibold">Existing queues ({queues.length})</h2>

        {queues.length === 0 ? (
          <p className="rounded-xl border border-dashed p-6 text-sm text-gray-500">
            No queues yet. Create a service first, then create a queue for it.
          </p>
        ) : (
          <div className="space-y-3">
            {queues.map((queue) => {
              const service = getService(queue.serviceId);

              return (
                <article key={queue._id} className="rounded-xl border p-4">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <h3 className="font-semibold">{queue.name}</h3>
                        <span className="rounded-full border px-2 py-1 text-xs capitalize">
                          {queue.status}
                        </span>
                      </div>

                      <p className="mt-2 text-sm text-gray-600">
                        {queue.description}
                      </p>

                      <div className="mt-3 rounded-lg bg-gray-50 p-3 text-sm">
                        <p className="font-medium">
                          Service: {service?.name ?? "Service unavailable"}
                        </p>
                        <p className="mt-1 text-gray-500">
                          {service
                            ? `${service.durationMinutes} minutes per customer`
                            : "The assigned service may have been removed."}
                        </p>
                        {service && !service.isActive && (
                          <p className="mt-1 text-amber-700">
                            This service is inactive.
                          </p>
                        )}
                      </div>

                      <p className="mt-3 text-xs text-gray-500">
                        {queue.prerequisites.length} prerequisites
                      </p>

                      {queue.prerequisites.length > 0 && (
                        <ul className="mt-2 list-inside list-disc space-y-1 text-sm text-gray-500">
                          {queue.prerequisites.map((item) => (
                            <li key={item.id}>
                              {item.label}
                              {item.isRequired ? " (required)" : " (optional)"}
                            </li>
                          ))}
                        </ul>
                      )}
                    </div>

                    <Link
                      href={`/business/${businessId}/queues/${queue._id}`}
                      className="rounded-lg bg-black px-3 py-1.5 text-sm text-white"
                    >
                      Live operations
                    </Link>

                    <div className="flex flex-wrap gap-2">
                      <button
                        type="button"
                        onClick={() => startEditing(queue)}
                        className="rounded-lg border px-3 py-1.5 text-sm"
                      >
                        Edit
                      </button>

                      {queue.status !== "active" && (
                        <button
                          type="button"
                          onClick={() => changeStatus(queue._id, "active")}
                          className="rounded-lg border px-3 py-1.5 text-sm"
                        >
                          Activate
                        </button>
                      )}

                      {queue.status === "active" && (
                        <button
                          type="button"
                          onClick={() => changeStatus(queue._id, "paused")}
                          className="rounded-lg border px-3 py-1.5 text-sm"
                        >
                          Pause
                        </button>
                      )}

                      {queue.status !== "closed" && (
                        <button
                          type="button"
                          onClick={() => changeStatus(queue._id, "closed")}
                          className="rounded-lg border px-3 py-1.5 text-sm"
                        >
                          Close
                        </button>
                      )}

                      <button
                        type="button"
                        onClick={() => deleteQueue(queue._id, queue.name)}
                        className="rounded-lg border border-red-200 px-3 py-1.5 text-sm text-red-600"
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </section>

      <section className="rounded-xl border p-5">
        <h2 className="font-semibold">
          {editingId ? "Edit queue" : "Create queue"}
        </h2>

        {activeServices.length === 0 && !editingId ? (
          <div className="mt-4 space-y-3">
            <p className="text-sm text-gray-500">
              You need at least one active service before creating a queue.
            </p>
            <Link
              href={`/business/${businessId}/services`}
              className="inline-block rounded-lg bg-black px-4 py-2 text-sm text-white"
            >
              Manage services
            </Link>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="mt-4 space-y-4">
            <div className="space-y-1">
              <label htmlFor="queue-service" className="text-sm font-medium">
                Assigned service
              </label>
              <select
                id="queue-service"
                required
                value={serviceId}
                onChange={(event) => setServiceId(event.target.value)}
                className="w-full rounded-lg border px-3 py-2"
              >
                <option value="">Select a service</option>
                {services
                  .filter(
                    (service) => service.isActive || service._id === serviceId,
                  )
                  .map((service) => (
                    <option key={service._id} value={service._id}>
                      {service.name} — {service.durationMinutes} min
                      {!service.isActive ? " (inactive)" : ""}
                    </option>
                  ))}
              </select>
              <p className="text-xs text-gray-500">
                The assigned service determines the duration used for queue
                estimates. Inactive services cannot be newly assigned.
              </p>
            </div>

            <div className="space-y-1">
              <label htmlFor="queue-name" className="text-sm font-medium">
                Queue name
              </label>
              <input
                id="queue-name"
                required
                maxLength={100}
                value={name}
                onChange={(event) => setName(event.target.value)}
                placeholder="General consultation queue"
                className="w-full rounded-lg border px-3 py-2"
              />
            </div>

            <div className="space-y-1">
              <label
                htmlFor="queue-description"
                className="text-sm font-medium"
              >
                Description
              </label>
              <textarea
                id="queue-description"
                required
                rows={3}
                value={description}
                onChange={(event) => setDescription(event.target.value)}
                placeholder="Explain what this queue is for."
                className="w-full rounded-lg border px-3 py-2"
              />
            </div>

            <div className="space-y-3">
              <div className="flex items-center justify-between gap-3">
                <h3 className="text-sm font-medium">Customer prerequisites</h3>
                <button
                  type="button"
                  onClick={() =>
                    setPrerequisites((current) => [
                      ...current,
                      emptyPrerequisite(),
                    ])
                  }
                  className="text-sm underline"
                >
                  + Add prerequisite
                </button>
              </div>

              {prerequisites.length === 0 && (
                <p className="text-sm text-gray-500">
                  No prerequisites. Customers can join without checklist items.
                </p>
              )}

              {prerequisites.map((item, index) => (
                <div key={item.id} className="space-y-3 rounded-lg border p-3">
                  <div className="space-y-1">
                    <label className="text-xs text-gray-500">
                      Checklist label
                    </label>
                    <input
                      required
                      value={item.label}
                      onChange={(event) =>
                        updatePrerequisite(index, {
                          label: event.target.value,
                        })
                      }
                      placeholder="Bring a valid ID"
                      className="w-full rounded-lg border px-3 py-2 text-sm"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs text-gray-500">
                      Additional instructions (optional)
                    </label>
                    <input
                      value={item.description ?? ""}
                      onChange={(event) =>
                        updatePrerequisite(index, {
                          description: event.target.value,
                        })
                      }
                      placeholder="Accepted identification documents..."
                      className="w-full rounded-lg border px-3 py-2 text-sm"
                    />
                  </div>

                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <label className="flex items-center gap-2 text-sm">
                      <input
                        type="checkbox"
                        checked={item.isRequired}
                        onChange={(event) =>
                          updatePrerequisite(index, {
                            isRequired: event.target.checked,
                          })
                        }
                      />
                      Required before joining
                    </label>

                    <button
                      type="button"
                      onClick={() =>
                        setPrerequisites((current) =>
                          current.filter((_, i) => i !== index),
                        )
                      }
                      className="text-sm text-red-600 underline"
                    >
                      Remove
                    </button>
                  </div>
                </div>
              ))}
            </div>

            <div className="flex flex-wrap gap-3">
              <button
                type="submit"
                disabled={saving || !serviceId}
                className="rounded-lg bg-black px-4 py-2.5 text-sm text-white disabled:opacity-50"
              >
                {saving
                  ? "Saving..."
                  : editingId
                    ? "Save changes"
                    : "Create queue"}
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
        )}
      </section>
    </main>
  );
}
