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
} from "@/components/ui/empty";
import { Field, FieldDescription, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { Spinner } from "@/components/ui/spinner";
import { Textarea } from "@/components/ui/textarea";
import { notifyError, notifySuccess } from "@/lib/toast";
import {
  PlusIcon,
  Queue02Icon,
  TrashIcon,
} from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import { cn } from "cn";

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

function statusVariant(status: string): "default" | "secondary" | "outline" {
  if (status === "active") {
    return "default";
  }
  if (status === "paused") {
    return "secondary";
  }
  return "outline";
}

export default function BusinessQueuesPage({
  params,
}: {
  params: Promise<{ businessId: string }>;
}) {
  const { businessId } = use(params);
  const id = businessId as Id<"businesses">;

  const queues = useQuery(api.business.queue.getByBusiness, {
    businessId: id,
  });
  const services = useQuery(api.business.services.getByBusiness, {
    businessId: id,
  });

  const createQueue = useMutation(api.business.queue.create);
  const updateQueue = useMutation(api.business.queue.update);
  const removeQueue = useMutation(api.business.queue.remove);

  const [editingId, setEditingId] = useState<string | null>(null);
  const [serviceId, setServiceId] = useState("");
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [prerequisites, setPrerequisites] = useState<Prerequisite[]>([]);
  const [formError, setFormError] = useState("");
  const [saving, setSaving] = useState(false);
  const [workingId, setWorkingId] = useState<Id<"queues"> | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<{
    id: Id<"queues">;
    name: string;
  } | null>(null);

  const activeServices = services?.filter((service) => service.isActive) ?? [];

  const getService = (serviceDbId: Id<"services">) =>
    services?.find((service) => service._id === serviceDbId);

  function resetForm() {
    setEditingId(null);
    setServiceId("");
    setName("");
    setDescription("");
    setPrerequisites([]);
    setFormError("");
  }

  function startEditing(queue: NonNullable<NonNullable<typeof queues>[number]>) {
    setEditingId(queue._id);
    setServiceId(queue.serviceId);
    setName(queue.name);
    setDescription(queue.description);
    setPrerequisites(queue.prerequisites.map((item) => ({ ...item })));
    setFormError("");
  }

  function updatePrerequisite(index: number, patch: Partial<Prerequisite>) {
    setPrerequisites((current) =>
      current.map((item, i) => (i === index ? { ...item, ...patch } : item)),
    );
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setFormError("");

    if (!serviceId) {
      setFormError("Select a service for this queue.");
      return;
    }

    const cleanedPrerequisites = prerequisites.map((item) => ({
      ...item,
      id: item.id.trim(),
      label: item.label.trim(),
      description: item.description?.trim() || undefined,
    }));

    if (cleanedPrerequisites.some((item) => !item.label)) {
      setFormError("Every prerequisite needs a label.");
      return;
    }

    if (!name.trim() || !description.trim()) {
      setFormError("Queue name and description are required.");
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
        notifySuccess("Queue updated");
      } else {
        await createQueue({
          businessId: id,
          serviceId: serviceId as Id<"services">,
          name: name.trim(),
          description: description.trim(),
          prerequisites: cleanedPrerequisites,
        });
        notifySuccess("Queue created");
      }

      resetForm();
    } catch (err) {
      setFormError(
        err instanceof Error ? err.message : "Could not save queue.",
      );
    } finally {
      setSaving(false);
    }
  }

  async function changeStatus(queueId: Id<"queues">, status: QueueStatus) {
    setWorkingId(queueId);
    try {
      await updateQueue({ queueId, status });
      notifySuccess(`Queue ${status === "closed" ? "closed" : status}`);
    } catch (err) {
      notifyError(
        "Could not update status",
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
      await removeQueue({ queueId: deleteTarget.id });
      notifySuccess("Queue deleted");
      if (editingId === deleteTarget.id) {
        resetForm();
      }
      setDeleteTarget(null);
    } catch (err) {
      notifyError(
        "Could not delete queue",
        err instanceof Error ? err.message : "Please try again.",
      );
    }
  }

  if (queues === undefined || services === undefined) {
    return (
      <div className="flex flex-col gap-6">
        <div className="space-y-2">
          <Skeleton className="h-9 w-56" />
          <Skeleton className="h-4 w-full max-w-md" />
        </div>
        <Skeleton className="h-64 rounded-3xl" />
        <Skeleton className="h-72 rounded-3xl" />
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="font-heading text-3xl font-bold tracking-tight">
          Queue management
        </h1>
        <p className="mt-1 max-w-2xl text-muted-foreground">
          Assign each queue to a service and configure customer prerequisites.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>
            Existing queues
            <Badge variant="secondary" className="ml-2 rounded-full">
              {queues.length}
            </Badge>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {queues.length === 0 ? (
            <Empty className="border-dashed">
              <EmptyContent>
                <EmptyDescription>
                  No queues yet. Create a service first, then create a queue
                  for it.
                </EmptyDescription>
              </EmptyContent>
            </Empty>
          ) : (
            <div className="flex flex-col gap-3">
              {queues.map((queue) => {
                const service = getService(queue.serviceId);
                const isWorking = workingId === queue._id;

                return (
                  <Card key={queue._id} size="sm">
                    <CardContent>
                      <div className="flex flex-wrap items-start justify-between gap-3">
                        <div className="min-w-0 flex-1">
                          <div className="flex flex-wrap items-center gap-2">
                            <h3 className="font-semibold">{queue.name}</h3>
                            <Badge
                              variant={statusVariant(queue.status)}
                              className="h-5 rounded-full capitalize"
                            >
                              {queue.status}
                            </Badge>
                          </div>

                          <p className="mt-1 text-sm text-muted-foreground">
                            {queue.description}
                          </p>

                          <div className="mt-3 grid gap-1.5 rounded-2xl bg-muted/60 p-3 text-sm">
                            <p className="font-medium">
                              Service:{" "}
                              {service?.name ?? "Service unavailable"}
                            </p>
                            <p className="text-muted-foreground">
                              {service
                                ? `${service.durationMinutes} minutes per customer`
                                : "The assigned service may have been removed."}
                            </p>
                            {service && !service.isActive ? (
                              <p className="text-amber-600 dark:text-amber-500">
                                This service is inactive.
                              </p>
                            ) : null}
                          </div>

                          <p className="mt-3 text-xs text-muted-foreground">
                            {queue.prerequisites.length} prerequisites
                          </p>

                          {queue.prerequisites.length > 0 ? (
                            <ul className="mt-2 grid gap-1 text-sm text-muted-foreground">
                              {queue.prerequisites.map((item) => (
                                <li key={item.id} className="flex gap-2">
                                  <span className="text-primary">•</span>
                                  <span>
                                    {item.label}
                                    {item.isRequired
                                      ? " (required)"
                                      : " (optional)"}
                                  </span>
                                </li>
                              ))}
                            </ul>
                          ) : null}
                        </div>
                      </div>

                      <div className="flex flex-wrap items-center gap-2 border-t pt-4">
                        <Link
                          href={`/business/${businessId}/queues/${queue._id}`}
                          className={cn(buttonVariants({ size: "sm" }))}
                        >
                          <HugeiconsIcon
                            icon={Queue02Icon}
                            strokeWidth={2}
                            data-icon="inline-start"
                          />
                          Live operations
                        </Link>

                        <Button
                          variant="outline"
                          size="sm"
                          disabled={isWorking || workingId !== null}
                          onClick={() => startEditing(queue)}
                        >
                          Edit
                        </Button>

                        {queue.status !== "active" ? (
                          <Button
                            variant="outline"
                            size="sm"
                            disabled={isWorking || workingId !== null}
                            onClick={() => changeStatus(queue._id, "active")}
                          >
                            Activate
                          </Button>
                        ) : null}

                        {queue.status === "active" ? (
                          <Button
                            variant="outline"
                            size="sm"
                            disabled={isWorking || workingId !== null}
                            onClick={() => changeStatus(queue._id, "paused")}
                          >
                            Pause
                          </Button>
                        ) : null}

                        {queue.status !== "closed" ? (
                          <Button
                            variant="outline"
                            size="sm"
                            disabled={isWorking || workingId !== null}
                            onClick={() => changeStatus(queue._id, "closed")}
                          >
                            Close
                          </Button>
                        ) : null}

                        <Button
                          variant="outline"
                          size="sm"
                          className="ml-auto text-destructive hover:bg-destructive/10 hover:text-destructive"
                          disabled={workingId !== null}
                          onClick={() =>
                            setDeleteTarget({
                              id: queue._id,
                              name: queue.name,
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
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>{editingId ? "Edit queue" : "Create queue"}</CardTitle>
          <CardDescription>
            The assigned service determines the duration used for queue
            estimates.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {activeServices.length === 0 && !editingId ? (
            <div className="flex flex-col gap-3">
              <p className="text-sm text-muted-foreground">
                You need at least one active service before creating a queue.
              </p>
              <Link
                href={`/business/${businessId}/services`}
                className={cn(buttonVariants({ size: "sm" }), "w-fit")}
              >
                Manage services
              </Link>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="flex flex-col gap-5">
              <Field>
                <FieldLabel htmlFor="queue-service">Assigned service</FieldLabel>
                <Select
                  value={serviceId}
                  onValueChange={(value) => setServiceId(value ?? "")}
                >
                  <SelectTrigger id="queue-service" className="w-full">
                    <SelectValue placeholder="Select a service" />
                  </SelectTrigger>
                  <SelectContent>
                    {services
                      .filter(
                        (service) =>
                          service.isActive || service._id === serviceId,
                      )
                      .map((service) => (
                        <SelectItem key={service._id} value={service._id}>
                          {service.name} — {service.durationMinutes} min
                          {!service.isActive ? " (inactive)" : ""}
                        </SelectItem>
                      ))}
                  </SelectContent>
                </Select>
                <FieldDescription>
                  Inactive services cannot be newly assigned.
                </FieldDescription>
              </Field>

              <Field>
                <FieldLabel htmlFor="queue-name">Queue name</FieldLabel>
                <Input
                  id="queue-name"
                  required
                  maxLength={100}
                  value={name}
                  onChange={(event) => setName(event.target.value)}
                  placeholder="General consultation queue"
                />
              </Field>

              <Field>
                <FieldLabel htmlFor="queue-description">Description</FieldLabel>
                <Textarea
                  id="queue-description"
                  required
                  rows={3}
                  value={description}
                  onChange={(event) => setDescription(event.target.value)}
                  placeholder="Explain what this queue is for."
                />
              </Field>

              <div className="grid gap-3">
                <div className="flex items-center justify-between gap-3">
                  <h3 className="text-sm font-medium">
                    Customer prerequisites
                  </h3>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() =>
                      setPrerequisites((current) => [
                        ...current,
                        emptyPrerequisite(),
                      ])
                    }
                  >
                    <HugeiconsIcon
                      icon={PlusIcon}
                      strokeWidth={2}
                      data-icon="inline-start"
                    />
                    Add prerequisite
                  </Button>
                </div>

                {prerequisites.length === 0 ? (
                  <p className="text-sm text-muted-foreground">
                    No prerequisites. Customers can join without checklist
                    items.
                  </p>
                ) : null}

                {prerequisites.map((item, index) => (
                  <div
                    key={item.id}
                    className="grid gap-3 rounded-2xl border p-3"
                  >
                    <div className="grid gap-3">
                      <div className="grid gap-1.5">
                        <FieldLabel>Checklist label</FieldLabel>
                        <Input
                          required
                          value={item.label}
                          onChange={(event) =>
                            updatePrerequisite(index, {
                              label: event.target.value,
                            })
                          }
                          placeholder="Bring a valid ID"
                        />
                      </div>

                      <div className="grid gap-1.5">
                        <FieldLabel>
                          Additional instructions (optional)
                        </FieldLabel>
                        <Input
                          value={item.description ?? ""}
                          onChange={(event) =>
                            updatePrerequisite(index, {
                              description: event.target.value,
                            })
                          }
                          placeholder="Accepted identification documents..."
                        />
                      </div>
                    </div>

                    <div className="flex flex-wrap items-center justify-between gap-3">
                      <label className="flex cursor-pointer items-center gap-2.5 text-sm">
                        <Checkbox
                          checked={item.isRequired}
                          onCheckedChange={(checked) =>
                            updatePrerequisite(index, {
                              isRequired: checked === true,
                            })
                          }
                        />
                        Required before joining
                      </label>

                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="text-destructive hover:bg-destructive/10 hover:text-destructive"
                        onClick={() =>
                          setPrerequisites((current) =>
                            current.filter((_, i) => i !== index),
                          )
                        }
                      >
                        Remove
                      </Button>
                    </div>
                  </div>
                ))}
              </div>

              {formError ? (
                <Alert variant="destructive">
                  <AlertTitle>Cannot save queue</AlertTitle>
                  <AlertDescription>{formError}</AlertDescription>
                </Alert>
              ) : null}

              <div className="flex flex-wrap gap-2">
                <Button type="submit" disabled={saving || !serviceId}>
                  {saving ? <Spinner data-icon="inline-start" /> : null}
                  {saving
                    ? "Saving…"
                    : editingId
                      ? "Save changes"
                      : "Create queue"}
                </Button>

                {editingId ? (
                  <Button type="button" variant="outline" onClick={resetForm}>
                    Cancel editing
                  </Button>
                ) : null}
              </div>
            </form>
          )}
        </CardContent>
      </Card>

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
              This permanently removes the queue and any of its active tokens.
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