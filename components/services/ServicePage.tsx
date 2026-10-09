"use client";

import { useState } from "react";
import Link from "next/link";
import { useMutation, useQuery } from "convex/react";
import {
  ArrowLeft,
  CalendarDays,
  Check,
  Clock3,
  Loader2,
  Pencil,
  Plus,
  Users,
  X,
  XCircle,
} from "lucide-react";

import { api } from "@/convex/_generated/api";
import type { Id } from "@/convex/_generated/dataModel";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

type Service = {
  _id: Id<"services">;
  _creationTime: number;
  businessId: Id<"businesses">;
  name: string;
  description?: string;
  type: string;
  queueEnabled: boolean;
  appointmentsEnabled: boolean;
  appointmentDuration?: number;
  isActive: boolean;
  createdAt: number;
  updatedAt: number;
};

type ServiceFormData = {
  name: string;
  description: string;
  type: string;
  queueEnabled: boolean;
  appointmentsEnabled: boolean;
  appointmentDuration: string;
};

const emptyForm: ServiceFormData = {
  name: "",
  description: "",
  type: "",
  queueEnabled: false,
  appointmentsEnabled: false,
  appointmentDuration: "30",
};

function ServicesSkeleton() {
  return (
    <main className="min-h-[calc(100vh-4rem)] bg-muted/20">
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <Skeleton className="h-5 w-32" />
        <Skeleton className="mt-3 h-9 w-64" />
        <Skeleton className="mt-2 h-5 w-96" />

        <div className="mt-8 grid gap-5 lg:grid-cols-3">
          <Skeleton className="h-96 lg:col-span-1" />
          <div className="space-y-4 lg:col-span-2">
            <Skeleton className="h-32" />
            <Skeleton className="h-32" />
            <Skeleton className="h-32" />
          </div>
        </div>
      </div>
    </main>
  );
}

function StatusBadge({
  enabled,
  children,
}: {
  enabled: boolean;
  children: React.ReactNode;
}) {
  return (
    <span
      className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-medium ${
        enabled
          ? "bg-emerald-500/10 text-emerald-700"
          : "bg-muted text-muted-foreground"
      }`}
    >
      {enabled ? (
        <Check className="mr-1 size-3" />
      ) : (
        <X className="mr-1 size-3" />
      )}
      {children}
    </span>
  );
}

function ServiceCard({
  service,
  onEdit,
  onToggleQueue,
  onToggleAppointments,
  onDeactivate,
  busy,
}: {
  service: Service;
  onEdit: (service: Service) => void;
  onToggleQueue: (service: Service) => void;
  onToggleAppointments: (service: Service) => void;
  onDeactivate: (service: Service) => void;
  busy: string | null;
}) {
  const queueBusy = busy === `queue:${service._id}`;

  const appointmentBusy = busy === `appointments:${service._id}`;

  const deactivateBusy = busy === `deactivate:${service._id}`;

  return (
    <Card className={service.isActive ? "" : "opacity-70"}>
      <CardContent className="p-5">
        <div className="flex flex-col gap-5 sm:flex-row sm:items-start sm:justify-between">
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <h3 className="text-lg font-semibold">{service.name}</h3>

              {!service.isActive && (
                <span className="rounded-full bg-destructive/10 px-2.5 py-1 text-xs font-medium text-destructive">
                  Inactive
                </span>
              )}
            </div>

            <p className="mt-1 text-sm text-muted-foreground">{service.type}</p>

            {service.description && (
              <p className="mt-3 max-w-2xl text-sm leading-6 text-muted-foreground">
                {service.description}
              </p>
            )}
          </div>

          {service.isActive && (
            <Button variant="outline" size="sm" onClick={() => onEdit(service)}>
              <Pencil className="mr-2 size-3.5" />
              Edit
            </Button>
          )}
        </div>

        <div className="mt-5 flex flex-wrap gap-2">
          <StatusBadge enabled={service.queueEnabled}>Queue</StatusBadge>

          <StatusBadge enabled={service.appointmentsEnabled}>
            Appointments
          </StatusBadge>

          {service.appointmentsEnabled && service.appointmentDuration && (
            <span className="inline-flex items-center rounded-full bg-muted px-2.5 py-1 text-xs font-medium text-muted-foreground">
              <Clock3 className="mr-1 size-3" />
              {service.appointmentDuration} min
            </span>
          )}
        </div>

        {service.isActive && (
          <div className="mt-5 flex flex-wrap gap-2 border-t pt-4">
            <Button
              variant="outline"
              size="sm"
              onClick={() => onToggleQueue(service)}
              disabled={queueBusy}
            >
              {queueBusy ? (
                <Loader2 className="mr-2 size-3.5 animate-spin" />
              ) : (
                <Users className="mr-2 size-3.5" />
              )}

              {service.queueEnabled ? "Disable queue" : "Enable queue"}
            </Button>

            <Button
              variant="outline"
              size="sm"
              onClick={() => onToggleAppointments(service)}
              disabled={appointmentBusy}
            >
              {appointmentBusy ? (
                <Loader2 className="mr-2 size-3.5 animate-spin" />
              ) : (
                <CalendarDays className="mr-2 size-3.5" />
              )}

              {service.appointmentsEnabled
                ? "Disable appointments"
                : "Enable appointments"}
            </Button>

            <Button
              variant="ghost"
              size="sm"
              className="text-destructive hover:text-destructive"
              onClick={() => onDeactivate(service)}
              disabled={deactivateBusy}
            >
              {deactivateBusy ? (
                <Loader2 className="mr-2 size-3.5 animate-spin" />
              ) : (
                <XCircle className="mr-2 size-3.5" />
              )}
              Deactivate
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function ServiceForm({
  businessId,
  service,
  onClose,
}: {
  businessId: Id<"businesses">;
  service: Service | null;
  onClose: () => void;
}) {
  const isEditing = Boolean(service);

  const [form, setForm] = useState<ServiceFormData>(() =>
    service
      ? {
          name: service.name,
          description: service.description ?? "",
          type: service.type,
          queueEnabled: service.queueEnabled,
          appointmentsEnabled: service.appointmentsEnabled,
          appointmentDuration: service.appointmentDuration?.toString() ?? "30",
        }
      : emptyForm,
  );

  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const createService = useMutation(api.services.create);
  const updateService = useMutation(api.services.update);

  function updateField<K extends keyof ServiceFormData>(
    field: K,
    value: ServiceFormData[K],
  ) {
    setForm((current) => ({
      ...current,
      [field]: value,
    }));
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    setError(null);

    const name = form.name.trim();
    const type = form.type.trim();
    const description = form.description.trim();

    if (!name) {
      setError("Service name is required.");
      return;
    }

    if (!type) {
      setError("Service type is required.");
      return;
    }

    let appointmentDuration: number | undefined;

    if (form.appointmentsEnabled) {
      appointmentDuration = Number(form.appointmentDuration);

      if (!Number.isFinite(appointmentDuration) || appointmentDuration <= 0) {
        setError("Appointment duration must be greater than zero.");
        return;
      }
    }

    setSaving(true);

    try {
      if (isEditing && service) {
        await updateService({
          serviceId: service._id,
          name,
          description: description || undefined,
          type,
          queueEnabled: form.queueEnabled,
          appointmentsEnabled: form.appointmentsEnabled,
          appointmentDuration,
        });
      } else {
        await createService({
          businessId,
          name,
          description: description || undefined,
          type,
          queueEnabled: form.queueEnabled,
          appointmentsEnabled: form.appointmentsEnabled,
          appointmentDuration,
        });
      }

      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to save service.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <div>
          <CardTitle>{isEditing ? "Edit service" : "Create service"}</CardTitle>

          <p className="mt-1 text-sm text-muted-foreground">
            Configure how customers can use this service.
          </p>
        </div>

        <Button variant="ghost" size="icon" onClick={onClose} disabled={saving}>
          <X className="size-4" />
        </Button>
      </CardHeader>

      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-5">
          {error && (
            <div className="rounded-lg border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive">
              {error}
            </div>
          )}

          <div>
            <label htmlFor="service-name" className="text-sm font-medium">
              Service name
            </label>

            <input
              id="service-name"
              value={form.name}
              onChange={(event) => updateField("name", event.target.value)}
              placeholder="e.g. General Consultation"
              className="mt-2 h-10 w-full rounded-md border border-input bg-background px-3 text-sm outline-none focus:ring-2 focus:ring-ring"
              disabled={saving}
            />
          </div>

          <div>
            <label htmlFor="service-type" className="text-sm font-medium">
              Service type
            </label>

            <input
              id="service-type"
              value={form.type}
              onChange={(event) => updateField("type", event.target.value)}
              placeholder="e.g. Consultation"
              className="mt-2 h-10 w-full rounded-md border border-input bg-background px-3 text-sm outline-none focus:ring-2 focus:ring-ring"
              disabled={saving}
            />
          </div>

          <div>
            <label
              htmlFor="service-description"
              className="text-sm font-medium"
            >
              Description
            </label>

            <textarea
              id="service-description"
              value={form.description}
              onChange={(event) =>
                updateField("description", event.target.value)
              }
              placeholder="Describe what customers receive..."
              rows={4}
              className="mt-2 w-full resize-none rounded-md border border-input bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-ring"
              disabled={saving}
            />
          </div>

          <div className="space-y-3">
            <p className="text-sm font-medium">Customer access</p>

            <label className="flex cursor-pointer items-start gap-3 rounded-xl border p-4">
              <input
                type="checkbox"
                checked={form.queueEnabled}
                onChange={(event) =>
                  updateField("queueEnabled", event.target.checked)
                }
                disabled={saving}
                className="mt-0.5 size-4"
              />

              <span>
                <span className="block text-sm font-medium">Queue</span>
                <span className="mt-1 block text-xs leading-5 text-muted-foreground">
                  Allow customers to join a live queue for this service.
                </span>
              </span>
            </label>

            <label className="flex cursor-pointer items-start gap-3 rounded-xl border p-4">
              <input
                type="checkbox"
                checked={form.appointmentsEnabled}
                onChange={(event) =>
                  updateField("appointmentsEnabled", event.target.checked)
                }
                disabled={saving}
                className="mt-0.5 size-4"
              />

              <span className="flex-1">
                <span className="block text-sm font-medium">Appointments</span>

                <span className="mt-1 block text-xs leading-5 text-muted-foreground">
                  Allow customers to schedule an appointment for this service.
                </span>
              </span>
            </label>
          </div>

          {form.appointmentsEnabled && (
            <div>
              <label
                htmlFor="appointment-duration"
                className="text-sm font-medium"
              >
                Appointment duration
              </label>

              <div className="relative mt-2">
                <input
                  id="appointment-duration"
                  type="number"
                  min="1"
                  step="1"
                  value={form.appointmentDuration}
                  onChange={(event) =>
                    updateField("appointmentDuration", event.target.value)
                  }
                  className="h-10 w-full rounded-md border border-input bg-background px-3 pr-16 text-sm outline-none focus:ring-2 focus:ring-ring"
                  disabled={saving}
                />

                <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">
                  minutes
                </span>
              </div>
            </div>
          )}

          <div className="flex justify-end gap-2 border-t pt-5">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              disabled={saving}
            >
              Cancel
            </Button>

            <Button type="submit" disabled={saving}>
              {saving && <Loader2 className="mr-2 size-4 animate-spin" />}

              {isEditing ? "Save changes" : "Create service"}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}

export function BusinessServices({ businessId }: { businessId: string }) {
  const id = businessId as Id<"businesses">;

  const services = useQuery(api.services.list, {
    businessId: id,
    activeOnly: false,
  });

  const settings = useQuery(api.businessSettings.get, {
    businessId: id,
  });

  const enableQueue = useMutation(api.services.enableQueue);

  const disableQueue = useMutation(api.services.disableQueue);

  const enableAppointments = useMutation(api.services.enableAppointments);

  const disableAppointments = useMutation(api.services.disableAppointments);

  const deactivate = useMutation(api.services.deactivate);

  const [showForm, setShowForm] = useState(false);
  const [editingService, setEditingService] = useState<Service | null>(null);

  const [busy, setBusy] = useState<string | null>(null);

  const [error, setError] = useState<string | null>(null);

  if (services === undefined || settings === undefined) {
    return <ServicesSkeleton />;
  }

  const activeServices = services.filter((service) => service.isActive);

  const inactiveServices = services.filter((service) => !service.isActive);

  function openCreate() {
    setEditingService(null);
    setShowForm(true);
    setError(null);
  }

  function openEdit(service: Service) {
    setEditingService(service);
    setShowForm(true);
    setError(null);
  }

  function closeForm() {
    setShowForm(false);
    setEditingService(null);
  }

  async function handleToggleQueue(service: Service) {
    setError(null);

    const key = `queue:${service._id}`;
    setBusy(key);

    try {
      if (service.queueEnabled) {
        await disableQueue({
          serviceId: service._id,
        });
      } else {
        await enableQueue({
          serviceId: service._id,
        });
      }
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Unable to update queue configuration.",
      );
    } finally {
      setBusy(null);
    }
  }

  async function handleToggleAppointments(service: Service) {
    setError(null);

    const key = `appointments:${service._id}`;
    setBusy(key);

    try {
      if (service.appointmentsEnabled) {
        await disableAppointments({
          serviceId: service._id,
        });
      } else {
        const duration = service.appointmentDuration ?? 30;

        await enableAppointments({
          serviceId: service._id,
          appointmentDuration: duration,
        });
      }
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Unable to update appointment configuration.",
      );
    } finally {
      setBusy(null);
    }
  }

  async function handleDeactivate(service: Service) {
    const confirmed = window.confirm(
      `Deactivate "${service.name}"? This service will no longer be available to customers.`,
    );

    if (!confirmed) {
      return;
    }

    setError(null);

    const key = `deactivate:${service._id}`;
    setBusy(key);

    try {
      await deactivate({
        serviceId: service._id,
      });
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Unable to deactivate service.",
      );
    } finally {
      setBusy(null);
    }
  }

  return (
    <main className="min-h-[calc(100vh-4rem)] bg-muted/20">
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <Button variant="ghost" className="-ml-3 mb-3">
              <Link href={`/business/${businessId}`}>
                <ArrowLeft className="mr-2 size-4" />
                Business dashboard
              </Link>
            </Button>

            <p className="text-sm font-medium text-primary">
              Business configuration
            </p>

            <h1 className="mt-1 text-3xl font-bold tracking-tight">Services</h1>

            <p className="mt-2 max-w-2xl text-muted-foreground">
              Configure the services your customers can book or join a queue
              for.
            </p>
          </div>

          {!showForm && (
            <Button onClick={openCreate}>
              <Plus className="mr-2 size-4" />
              Add service
            </Button>
          )}
        </div>

        {/* Business-level restrictions */}
        {(!settings.queueEnabled || !settings.appointmentsEnabled) && (
          <div className="mt-6 rounded-xl border bg-background p-4">
            <p className="text-sm font-medium">Business-level configuration</p>

            <div className="mt-2 flex flex-wrap gap-x-5 gap-y-1 text-sm text-muted-foreground">
              {!settings.queueEnabled && (
                <span className="flex items-center gap-1.5">
                  <X className="size-3.5" />
                  Queues are disabled
                </span>
              )}

              {!settings.appointmentsEnabled && (
                <span className="flex items-center gap-1.5">
                  <X className="size-3.5" />
                  Appointments are disabled
                </span>
              )}
            </div>

            <p className="mt-2 text-xs text-muted-foreground">
              Services cannot enable a feature that is disabled at the business
              level.
            </p>
          </div>
        )}

        {error && (
          <div className="mt-5 rounded-lg border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive">
            {error}
          </div>
        )}

        {/* Main layout */}
        <div className="mt-8 grid gap-6 lg:grid-cols-3">
          {/* Form */}
          {showForm && (
            <div className="lg:col-span-1">
              <ServiceForm
                businessId={id}
                service={editingService}
                onClose={closeForm}
              />
            </div>
          )}

          {/* Services */}
          <div
            className={
              showForm ? "space-y-6 lg:col-span-2" : "space-y-6 lg:col-span-3"
            }
          >
            {activeServices.length === 0 ? (
              <Card>
                <CardContent className="flex flex-col items-center px-6 py-16 text-center">
                  <div className="flex size-14 items-center justify-center rounded-2xl bg-primary/10">
                    <WrenchIcon />
                  </div>

                  <h2 className="mt-5 text-lg font-semibold">
                    No services yet
                  </h2>

                  <p className="mt-2 max-w-md text-sm leading-6 text-muted-foreground">
                    Create your first service so customers know what your
                    business offers.
                  </p>

                  {!showForm && (
                    <Button className="mt-6" onClick={openCreate}>
                      <Plus className="mr-2 size-4" />
                      Create your first service
                    </Button>
                  )}
                </CardContent>
              </Card>
            ) : (
              <>
                <div>
                  <div className="mb-4">
                    <h2 className="text-lg font-semibold">Active services</h2>

                    <p className="mt-1 text-sm text-muted-foreground">
                      {activeServices.length} active{" "}
                      {activeServices.length === 1 ? "service" : "services"}
                    </p>
                  </div>

                  <div className="space-y-4">
                    {activeServices.map((service) => (
                      <ServiceCard
                        key={service._id}
                        service={service}
                        onEdit={openEdit}
                        onToggleQueue={handleToggleQueue}
                        onToggleAppointments={handleToggleAppointments}
                        onDeactivate={handleDeactivate}
                        busy={busy}
                      />
                    ))}
                  </div>
                </div>

                {inactiveServices.length > 0 && (
                  <div>
                    <div className="mb-4">
                      <h2 className="text-lg font-semibold">
                        Inactive services
                      </h2>

                      <p className="mt-1 text-sm text-muted-foreground">
                        Deactivated services are kept for historical records.
                      </p>
                    </div>

                    <div className="space-y-4">
                      {inactiveServices.map((service) => (
                        <ServiceCard
                          key={service._id}
                          service={service}
                          onEdit={openEdit}
                          onToggleQueue={handleToggleQueue}
                          onToggleAppointments={handleToggleAppointments}
                          onDeactivate={handleDeactivate}
                          busy={busy}
                        />
                      ))}
                    </div>
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </div>
    </main>
  );
}

function WrenchIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      className="size-7 text-primary"
      aria-hidden="true"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M14.7 6.3a5 5 0 0 0-6.4 6.4L3.5 17.5a2.12 2.12 0 1 0 3 3l4.8-4.8a5 5 0 0 0 6.4-6.4l-3.2 3.2-3-3 3.2-3.2Z"
      />
    </svg>
  );
}
