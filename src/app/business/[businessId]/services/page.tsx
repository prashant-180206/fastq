"use client";

import { use, useState, type FormEvent } from "react";
import Link from "next/link";
import { useMutation, useQuery } from "convex/react";
import { api } from "@/../convex/_generated/api";
import type { Id } from "@/../convex/_generated/dataModel";
import {
  Alert,
  AlertDescription,
  AlertTitle,
} from "@/components/ui/alert";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogMedia,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Badge } from "@/components/ui/badge";
import { Button, buttonVariants } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty";
import { Field, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { Spinner } from "@/components/ui/spinner";
import { Textarea } from "@/components/ui/textarea";
import { notifyError, notifySuccess } from "@/lib/toast";
import {
  ArrowUpRight01Icon,
  Clock01Icon,
  PlusIcon,
  ServiceIcon,
  Ticket01Icon,
  TrashIcon,
  UserSwitchIcon,
} from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import { cn } from "cn";

export default function BusinessServicesPage({
  params,
}: {
  params: Promise<{ businessId: string }>;
}) {
  const { businessId } = use(params);
  const businessDbId = businessId as Id<"businesses">;

  const services = useQuery(api.business.services.getByBusiness, {
    businessId: businessDbId,
  });
  const createService = useMutation(api.business.services.create);
  const updateService = useMutation(api.business.services.update);
  const removeService = useMutation(api.business.services.remove);

  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [durationMinutes, setDurationMinutes] = useState("20");
  const [queueEnabled, setQueueEnabled] = useState(true);
  const [appointmentsEnabled, setAppointmentsEnabled] = useState(true);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [busy, setBusy] = useState(false);
  const [workingId, setWorkingId] = useState<Id<"services"> | null>(null);
  const [formError, setFormError] = useState("");
  const [deleteTarget, setDeleteTarget] = useState<{
    id: Id<"services">;
    name: string;
  } | null>(null);

  async function handleCreate(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const duration = Number(durationMinutes);
    if (!name.trim()) {
      setFormError("Service name is required.");
      return;
    }
    if (!Number.isInteger(duration) || duration < 1 || duration > 480) {
      setFormError("Duration must be between 1 and 480 minutes.");
      return;
    }
    if (!queueEnabled && !appointmentsEnabled) {
      setFormError("Enable queues, appointments, or both.");
      return;
    }

    setFormError("");
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
      notifySuccess(
        "Service created",
        "Open it to configure its queues and appointments.",
      );
    } catch (err) {
      notifyError(
        "Could not create service",
        err instanceof Error ? err.message : "Please try again.",
      );
    } finally {
      setBusy(false);
    }
  }

  async function handleToggleActive(
    serviceId: Id<"services">,
    isActive: boolean,
  ) {
    setWorkingId(serviceId);
    try {
      await updateService({ serviceId, isActive: !isActive });
      notifySuccess(isActive ? "Service deactivated" : "Service activated");
    } catch (err) {
      notifyError(
        "Could not update service",
        err instanceof Error ? err.message : "Please try again.",
      );
    } finally {
      setWorkingId(null);
    }
  }

  async function handleDelete() {
    if (!deleteTarget) {
      return;
    }
    try {
      await removeService({ serviceId: deleteTarget.id });
      notifySuccess("Service deleted");
      setDeleteTarget(null);
    } catch (err) {
      notifyError(
        "Could not delete service",
        err instanceof Error ? err.message : "Please try again.",
      );
    }
  }

  if (services === undefined) {
    return (
      <div className="flex flex-col gap-6">
        <div className="space-y-2">
          <Skeleton className="h-9 w-48" />
          <Skeleton className="h-4 w-full max-w-md" />
        </div>
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {Array.from({ length: 3 }).map((_, index) => (
            <Skeleton key={index} className="h-56 rounded-3xl" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
        <div>
          <p className="text-sm font-medium text-muted-foreground">
            Business workspace
          </p>
          <h1 className="mt-1 font-heading text-3xl font-bold tracking-tight">
            Services
          </h1>
          <p className="mt-2 max-w-xl text-sm text-muted-foreground">
            Each service has its own workspace for queues, appointments, and
            availability.
          </p>
        </div>

        <Button
          variant={showCreateForm ? "outline" : "default"}
          onClick={() => {
            setShowCreateForm((value) => !value);
            setFormError("");
          }}
        >
          <HugeiconsIcon icon={PlusIcon} strokeWidth={2} data-icon="inline-start" />
          {showCreateForm ? "Close form" : "New service"}
        </Button>
      </div>

      {showCreateForm ? (
        <Card>
          <CardHeader>
            <CardTitle>New service</CardTitle>
            <CardDescription>
              Services organize queues, appointment handling, and capacity
              planning.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleCreate} className="flex flex-col gap-5">
              <div className="grid gap-5 md:grid-cols-2">
                <Field>
                  <FieldLabel htmlFor="service-name">Service name</FieldLabel>
                  <Input
                    id="service-name"
                    value={name}
                    onChange={(event) => setName(event.target.value)}
                    required
                    maxLength={100}
                    placeholder="General consultation"
                  />
                </Field>

                <Field>
                  <FieldLabel htmlFor="service-duration">
                    Duration (minutes)
                  </FieldLabel>
                  <Input
                    id="service-duration"
                    type="number"
                    value={durationMinutes}
                    onChange={(event) =>
                      setDurationMinutes(event.target.value)
                    }
                    min={1}
                    max={480}
                    required
                  />
                </Field>
              </div>

              <Field>
                <FieldLabel htmlFor="service-description">Description</FieldLabel>
                <Textarea
                  id="service-description"
                  value={description}
                  onChange={(event) => setDescription(event.target.value)}
                  rows={2}
                  placeholder="Describe the service."
                />
              </Field>

              <div className="grid gap-3 sm:grid-cols-2">
                <label className="flex cursor-pointer items-center gap-3 rounded-2xl border p-3.5 transition-colors hover:bg-muted/40">
                  <Checkbox
                    checked={queueEnabled}
                    onCheckedChange={(checked) => setQueueEnabled(checked === true)}
                  />
                  <span className="text-sm font-medium">Live queue enabled</span>
                </label>
                <label className="flex cursor-pointer items-center gap-3 rounded-2xl border p-3.5 transition-colors hover:bg-muted/40">
                  <Checkbox
                    checked={appointmentsEnabled}
                    onCheckedChange={(checked) =>
                      setAppointmentsEnabled(checked === true)
                    }
                  />
                  <span className="text-sm font-medium">
                    Appointments enabled
                  </span>
                </label>
              </div>

              {formError ? (
                <Alert variant="destructive">
                  <AlertTitle>Cannot create service</AlertTitle>
                  <AlertDescription>{formError}</AlertDescription>
                </Alert>
              ) : null}

              <div className="flex gap-2">
                <Button type="submit" disabled={busy}>
                  {busy ? <Spinner data-icon="inline-start" /> : null}
                  {busy ? "Creating…" : "Create service"}
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setShowCreateForm(false)}
                >
                  Cancel
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      ) : null}

      {services.length === 0 ? (
        <Empty>
          <EmptyContent>
            <EmptyMedia variant="icon">
              <HugeiconsIcon icon={ServiceIcon} strokeWidth={2} />
            </EmptyMedia>
            <EmptyTitle>Create your first service</EmptyTitle>
            <EmptyDescription>
              Services are the organizing unit for queues, appointment
              handling, and capacity planning.
            </EmptyDescription>
          </EmptyContent>
          <div className="flex justify-center">
            <Button
              onClick={() => {
                setShowCreateForm(true);
                setFormError("");
              }}
            >
              <HugeiconsIcon icon={PlusIcon} strokeWidth={2} data-icon="inline-start" />
              Create a service
            </Button>
          </div>
        </Empty>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {services.map((service) => {
            const isWorking = workingId === service._id;

            return (
              <Card key={service._id} className="flex h-full flex-col">
                <CardContent className="flex flex-1 flex-col p-5">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <h2 className="truncate font-heading text-lg font-semibold">
                        {service.name}
                      </h2>
                      <p className="mt-1 flex items-center gap-1.5 text-sm text-muted-foreground">
                        <HugeiconsIcon
                          icon={Clock01Icon}
                          strokeWidth={2}
                          className="size-3.5"
                        />
                        {service.durationMinutes} min per customer
                      </p>
                    </div>
                    <Badge
                      className="h-5 shrink-0 rounded-full"
                      variant={service.isActive ? "default" : "outline"}
                    >
                      {service.isActive ? "Active" : "Inactive"}
                    </Badge>
                  </div>

                  <p className="mt-4 line-clamp-2 text-sm text-muted-foreground">
                    {service.description || "No description added."}
                  </p>

                  <div className="mt-4 flex flex-wrap gap-1.5">
                    {service.queueEnabled ? (
                      <Badge
                        variant="secondary"
                        className="h-5 gap-1 rounded-full"
                      >
                        <HugeiconsIcon
                          icon={Ticket01Icon}
                          strokeWidth={2}
                          className="size-3"
                        />
                        Live queue
                      </Badge>
                    ) : null}
                    {service.appointmentsEnabled ? (
                      <Badge
                        variant="secondary"
                        className="h-5 rounded-full"
                      >
                        Appointments
                      </Badge>
                    ) : null}
                  </div>

                  <div className="mt-6 flex flex-wrap gap-2 border-t pt-4">
                    <Link
                      href={`/business/${businessId}/services/${service._id}`}
                      className={cn(
                        buttonVariants({ size: "sm" }),
                        "flex-1",
                      )}
                    >
                      Manage workspace
                      <HugeiconsIcon
                        icon={ArrowUpRight01Icon}
                        strokeWidth={2}
                        data-icon="inline-end"
                      />
                    </Link>
                    <Button
                      variant="outline"
                      size="sm"
                      disabled={isWorking || workingId !== null}
                      onClick={() =>
                        void handleToggleActive(service._id, service.isActive)
                      }
                    >
                      {isWorking ? (
                        <Spinner data-icon="inline-start" />
                      ) : (
                        <HugeiconsIcon
                          icon={UserSwitchIcon}
                          strokeWidth={2}
                          data-icon="inline-start"
                        />
                      )}
                      {service.isActive ? "Deactivate" : "Activate"}
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      className="text-destructive hover:bg-destructive/10 hover:text-destructive"
                      disabled={workingId !== null}
                      onClick={() =>
                        setDeleteTarget({
                          id: service._id,
                          name: service.name,
                        })
                      }
                    >
                      <HugeiconsIcon
                        icon={TrashIcon}
                        strokeWidth={2}
                        data-icon="inline-start"
                      />
                      Delete
                    </Button>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      <AlertDialog
        open={deleteTarget !== null}
        onOpenChange={(open) => {
          if (!open) {
            setDeleteTarget(null);
          }
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogMedia>
              <HugeiconsIcon icon={TrashIcon} strokeWidth={2} />
            </AlertDialogMedia>
            <AlertDialogTitle>Delete {deleteTarget?.name}?</AlertDialogTitle>
            <AlertDialogDescription>
              This is permanent. Deletion is blocked if the service has
              dependent queues or appointments.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction variant="destructive" onClick={handleDelete}>
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}