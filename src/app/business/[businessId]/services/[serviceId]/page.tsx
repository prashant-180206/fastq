"use client";

import { use, useEffect, useMemo, useState, type FormEvent } from "react";
import Link from "next/link";
import { useMutation, useQuery } from "convex/react";
import { api } from "@/../convex/_generated/api";
import type { Id } from "@/../convex/_generated/dataModel";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { Spinner } from "@/components/ui/spinner";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { formatTimeIST, todayInIST } from "@/lib/format";
import { notifyError, notifyInfo, notifySuccess } from "@/lib/toast";
import {
  ArrowLeft01Icon,
  Calendar02Icon,
  Clock01Icon,
  PlusIcon,
  Queue02Icon,
  ServiceIcon,
  Ticket01Icon,
  TimeScheduleIcon,
  TrashIcon,
} from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import { cn } from "cn";

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

const tabs: { id: Tab; label: string }[] = [
  { id: "overview", label: "Overview" },
  { id: "queues", label: "Queues" },
  { id: "live", label: "Live queue" },
  { id: "appointments", label: "Appointments" },
  { id: "availability", label: "Availability" },
];

function titleCase(value: string) {
  return value.replaceAll("_", " ").replace(/\b\w/g, (c) => c.toUpperCase());
}

function dateTime(value: number) {
  return new Intl.DateTimeFormat("en-IN", {
    dateStyle: "medium",
    timeStyle: "short",
    timeZone: "Asia/Kolkata",
  }).format(value);
}

function statusVariant(status: string): "default" | "secondary" | "outline" {
  if (["active", "completed", "serving", "checked_in"].includes(status)) {
    return "default";
  }
  if (["waiting", "called", "booked", "paused"].includes(status)) {
    return "secondary";
  }
  return "outline";
}

function StatCard({
  label,
  value,
  hint,
}: {
  label: string;
  value: number;
  hint?: string;
}) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-sm font-normal text-muted-foreground">
          {label}
        </CardTitle>
      </CardHeader>
      <CardContent className="grid gap-1">
        <p className="font-heading text-3xl font-bold tracking-tight">
          {value}
        </p>
        {hint ? (
          <p className="text-xs text-muted-foreground">{hint}</p>
        ) : null}
      </CardContent>
    </Card>
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

  const services = useQuery(api.business.services.getByBusiness, {
    businessId: businessDbId,
  });
  const allQueues = useQuery(api.business.queue.getByBusiness, {
    businessId: businessDbId,
  });
  const allAppointments = useQuery(api.business.appointments.getByBusiness, {
    businessId: businessDbId,
  });
  const service = services?.find((item) => item._id === serviceDbId);

  const queues = useMemo(
    () =>
      allQueues?.filter((queue) => queue.serviceId === serviceDbId) ?? [],
    [allQueues, serviceDbId],
  );
  const appointments = useMemo(
    () =>
      allAppointments?.filter(
        (appointment) => appointment.serviceId === serviceDbId,
      ) ?? [],
    [allAppointments, serviceDbId],
  );

  const updateService = useMutation(api.business.services.update);
  const createQueue = useMutation(api.business.queue.create);
  const updateQueue = useMutation(api.business.queue.update);
  const removeQueue = useMutation(api.business.queue.remove);
  const callNext = useMutation(api.business.queueCapacity.callNext);
  const startServing = useMutation(api.business.queueCapacity.startServing);
  const completeToken = useMutation(api.business.queueCapacity.completeToken);
  const skipToken = useMutation(api.business.queueCapacity.skipToken);
  const checkInAppointment = useMutation(api.business.appointments.checkIn);
  const completeAppointment = useMutation(api.business.appointments.complete);
  const markNoShow = useMutation(api.business.appointments.markNoShow);

  const [tab, setTab] = useState<Tab>("overview");
  const [busy, setBusy] = useState(false);
  const [date, setDate] = useState(todayInIST());
  const [appointmentFilter, setAppointmentFilter] = useState<
    "all" | AppointmentStatus
  >("all");
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    const id = window.setInterval(() => setNow(Date.now()), 60_000);
    return () => window.clearInterval(id);
  }, []);

  // Service settings
  const [editingSettings, setEditingSettings] = useState(false);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [duration, setDuration] = useState("20");
  const [queueEnabled, setQueueEnabled] = useState(true);
  const [appointmentsEnabled, setAppointmentsEnabled] = useState(true);

  // Queue form is scoped to this service; users cannot assign a different service.
  const [editingQueueId, setEditingQueueId] = useState<string | null>(null);
  const [queueName, setQueueName] = useState("");
  const [queueDescription, setQueueDescription] = useState("");
  const [prerequisites, setPrerequisites] = useState<Prerequisite[]>([]);
  const [showQueueForm, setShowQueueForm] = useState(false);
  const [selectedQueueId, setSelectedQueueId] = useState("");
  const [deleteTarget, setDeleteTarget] = useState<{
    queueId: Id<"queues">;
    name: string;
  } | null>(null);

  const selectedQueue =
    queues.find((queue) => queue._id === selectedQueueId) ?? queues[0];
  const tokens = useQuery(
    api.business.queueCapacity.getActiveTokensByQueue,
    selectedQueue ? { queueId: selectedQueue._id as Id<"queues"> } : "skip",
  );

  const availability = useQuery(
    api.business.appointments.getAvailableSlots,
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
    if (!service) {
      return;
    }
    setName(service.name);
    setDescription(service.description ?? "");
    setDuration(String(service.durationMinutes));
    setQueueEnabled(service.queueEnabled);
    setAppointmentsEnabled(service.appointmentsEnabled);
    setEditingSettings(true);
  }

  async function saveSettings(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!service) {
      return;
    }
    const durationMinutes = Number(duration);
    if (!name.trim()) {
      notifyError("Cannot save settings", "Service name is required.");
      return;
    }
    if (
      !Number.isInteger(durationMinutes) ||
      durationMinutes < 1 ||
      durationMinutes > 480
    ) {
      notifyError(
        "Cannot save settings",
        "Duration must be between 1 and 480 minutes.",
      );
      return;
    }
    if (!queueEnabled && !appointmentsEnabled) {
      notifyError(
        "Cannot save settings",
        "Enable queues, appointments, or both.",
      );
      return;
    }
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
      notifySuccess("Service settings saved");
    } catch (error) {
      notifyError(
        "Could not save settings",
        error instanceof Error ? error.message : "Please try again.",
      );
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

  function beginQueueEdit(queue: NonNullable<typeof queues[number]>) {
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
    if (!service) {
      return;
    }
    if (!queueName.trim()) {
      notifyError("Cannot save queue", "Queue name is required.");
      return;
    }
    if (!service.queueEnabled) {
      notifyError(
        "Cannot save queue",
        "Enable live queues in service settings first.",
      );
      return;
    }
    const cleaned = prerequisites.map((item) => ({
      ...item,
      id: item.id.trim(),
      label: item.label.trim(),
      description: item.description?.trim() || undefined,
    }));
    if (cleaned.some((item) => !item.label)) {
      notifyError("Cannot save queue", "Every prerequisite needs a label.");
      return;
    }
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
        notifySuccess("Queue updated");
      } else {
        await createQueue({
          businessId: businessDbId,
          serviceId: serviceDbId,
          name: queueName.trim(),
          description: queueDescription.trim(),
          prerequisites: cleaned,
        });
        notifySuccess("Queue created");
      }
      resetQueueForm();
    } catch (error) {
      notifyError(
        "Could not save queue",
        error instanceof Error ? error.message : "Please try again.",
      );
    } finally {
      setBusy(false);
    }
  }

  async function queueStatus(queueId: Id<"queues">, status: QueueStatus) {
    try {
      await updateQueue({ queueId, status });
      notifySuccess(`Queue ${titleCase(status)}`);
    } catch (error) {
      notifyError(
        "Could not update queue",
        error instanceof Error ? error.message : "Please try again.",
      );
    }
  }

  async function handleDeleteQueue() {
    if (!deleteTarget) {
      return;
    }
    try {
      await removeQueue({ queueId: deleteTarget.queueId });
      if (selectedQueueId === deleteTarget.queueId) {
        setSelectedQueueId("");
      }
      if (editingQueueId === deleteTarget.queueId) {
        resetQueueForm();
      }
      notifySuccess("Queue deleted");
      setDeleteTarget(null);
    } catch (error) {
      notifyError(
        "Could not delete queue",
        error instanceof Error ? error.message : "Please try again.",
      );
    }
  }

  async function queueAction(
    action: "call" | "start" | "complete" | "skip",
    tokenId?: Id<"queueTokens">,
  ) {
    if (!selectedQueue) {
      return;
    }
    setBusy(true);
    try {
      if (action === "call") {
        const result = await callNext({ queueId: selectedQueue._id });
        if (result) {
          notifySuccess(`Called token #${result.tokenNumber}`);
        } else {
          notifyInfo("No waiting customers", "No customers are waiting.");
        }
      } else if (tokenId && action === "start") {
        await startServing({ tokenId });
        notifySuccess("Service started");
      } else if (tokenId && action === "complete") {
        await completeToken({ tokenId });
        notifySuccess("Service completed");
      } else if (tokenId && action === "skip") {
        await skipToken({ tokenId });
        notifySuccess("Token skipped");
      }
    } catch (error) {
      notifyError(
        "Queue operation failed",
        error instanceof Error ? error.message : "Please try again.",
      );
    } finally {
      setBusy(false);
    }
  }

  async function appointmentAction(
    action: "checkIn" | "complete" | "noShow",
    appointmentId: Id<"appointments">,
  ) {
    setBusy(true);
    try {
      if (action === "checkIn") {
        await checkInAppointment({ appointmentId });
        notifySuccess("Appointment checked in");
      } else if (action === "complete") {
        await completeAppointment({ appointmentId });
        notifySuccess("Appointment completed");
      } else {
        await markNoShow({ appointmentId });
        notifySuccess("Appointment marked no-show");
      }
    } catch (error) {
      notifyError(
        "Appointment operation failed",
        error instanceof Error ? error.message : "Please try again.",
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
      <div className="flex flex-col gap-6">
        <div className="space-y-2">
          <Skeleton className="h-9 w-64" />
          <Skeleton className="h-4 w-full max-w-md" />
        </div>
        <Skeleton className="h-10 w-96 rounded-4xl" />
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          <Skeleton className="h-28 rounded-3xl" />
          <Skeleton className="h-28 rounded-3xl" />
          <Skeleton className="h-28 rounded-3xl" />
          <Skeleton className="h-28 rounded-3xl" />
        </div>
      </div>
    );
  }

  if (!service) {
    return (
      <div className="flex flex-col gap-6">
        <Empty className="justify-center py-24">
          <EmptyContent>
            <EmptyMedia variant="icon">
              <HugeiconsIcon icon={ServiceIcon} strokeWidth={2} />
            </EmptyMedia>
            <EmptyTitle>Service not found</EmptyTitle>
            <EmptyDescription>
              This service does not belong to this business or may have been
              deleted.
            </EmptyDescription>
          </EmptyContent>
          <Link
            href={`/business/${businessId}/services`}
            className={cn(buttonVariants({ size: "sm" }))}
          >
            <HugeiconsIcon
              icon={ArrowLeft01Icon}
              strokeWidth={2}
              data-icon="inline-start"
            />
            Back to services
          </Link>
        </Empty>
      </div>
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
    <div className="flex flex-col gap-6">
      <div>
        <Link
          href={`/business/${businessId}/services`}
          className="inline-flex items-center gap-1.5 text-sm text-muted-foreground transition-colors hover:text-foreground"
        >
          <HugeiconsIcon
            icon={ArrowLeft01Icon}
            strokeWidth={2}
            data-icon="inline-start"
          />
          All services
        </Link>

        <div className="mt-2 flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
          <div className="min-w-0">
            <p className="text-xs font-semibold tracking-wide text-muted-foreground uppercase">
              Service workspace
            </p>
            <div className="mt-1 flex flex-wrap items-center gap-3">
              <h1 className="font-heading text-3xl font-bold tracking-tight">
                {service.name}
              </h1>
              <Badge
                variant={statusVariant(service.isActive ? "active" : "inactive")}
                className="h-5 rounded-full capitalize"
              >
                {service.isActive ? "active" : "inactive"}
              </Badge>
            </div>
            <p className="mt-1 max-w-2xl text-muted-foreground">
              {service.description ||
                "Manage this service's queues, appointments, and capacity from here."}
            </p>
            <div className="mt-3 flex flex-wrap gap-2">
              <Badge variant="outline" className="h-6 rounded-xl">
                {service.durationMinutes} min duration
              </Badge>
              {service.queueEnabled ? (
                <Badge variant="outline" className="h-6 rounded-xl">
                  Queues enabled
                </Badge>
              ) : null}
              {service.appointmentsEnabled ? (
                <Badge variant="outline" className="h-6 rounded-xl">
                  Appointments enabled
                </Badge>
              ) : null}
            </div>
          </div>

          <Button
            variant="outline"
            onClick={startSettingsEdit}
            disabled={busy}
          >
            Edit service settings
          </Button>
        </div>
      </div>

      {editingSettings ? (
        <Card>
          <CardHeader>
            <CardTitle>Service settings</CardTitle>
            <CardDescription>
              Toggle how customers can engage with {service.name}.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={saveSettings} className="grid gap-5 md:grid-cols-2">
              <Field>
                <FieldLabel>Name</FieldLabel>
                <Input
                  value={name}
                  onChange={(event) => setName(event.target.value)}
                  required
                />
              </Field>

              <Field>
                <FieldLabel>Duration in minutes</FieldLabel>
                <Input
                  type="number"
                  min={1}
                  max={480}
                  value={duration}
                  onChange={(event) => setDuration(event.target.value)}
                  required
                />
              </Field>

              <Field className="md:col-span-2">
                <FieldLabel>Description</FieldLabel>
                <Textarea
                  rows={2}
                  value={description}
                  onChange={(event) => setDescription(event.target.value)}
                />
              </Field>

              <div className="flex flex-wrap gap-6 md:col-span-2">
                <label className="flex cursor-pointer items-center gap-2.5 text-sm">
                  <Checkbox
                    checked={queueEnabled}
                    onCheckedChange={(checked) =>
                      setQueueEnabled(checked === true)
                    }
                  />
                  Enable live queue
                </label>
                <label className="flex cursor-pointer items-center gap-2.5 text-sm">
                  <Checkbox
                    checked={appointmentsEnabled}
                    onCheckedChange={(checked) =>
                      setAppointmentsEnabled(checked === true)
                    }
                  />
                  Enable appointments
                </label>
              </div>

              <div className="flex gap-2 md:col-span-2">
                <Button type="submit" disabled={busy}>
                  {busy ? <Spinner data-icon="inline-start" /> : null}
                  {busy ? "Saving…" : "Save settings"}
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setEditingSettings(false)}
                  disabled={busy}
                >
                  Cancel
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      ) : null}

      <Tabs value={tab} onValueChange={(value) => setTab(value as Tab)}>
        <TabsList className="w-fit max-w-full overflow-x-auto">
          {tabs.map((item) => (
            <TabsTrigger key={item.id} value={item.id}>
              {item.label}
            </TabsTrigger>
          ))}
        </TabsList>

        <TabsContent value="overview" className="flex flex-col gap-5 pt-2">
          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
            <StatCard
              label="Queues"
              value={queues.length}
              hint="Configured for this service"
            />
            <StatCard
              label="Active queues"
              value={queues.filter((queue) => queue.status === "active").length}
              hint="Accepting customers"
            />
            <StatCard
              label="Active appointments"
              value={activeAppointments}
              hint="Booked or checked in"
            />
            <StatCard
              label="Appointment records"
              value={appointments.length}
              hint="All recorded statuses"
            />
          </div>

          <div className="grid gap-3 lg:grid-cols-3">
            <Button
              variant="outline"
              className="h-auto flex-col items-start justify-start gap-2 p-5 text-left"
              onClick={() => setTab("queues")}
            >
              <HugeiconsIcon icon={Queue02Icon} strokeWidth={2} data-icon="inline-start" />
              <span className="font-semibold">Configure queues</span>
              <span className="text-sm font-normal text-muted-foreground">
                Create queues linked specifically to {service.name} and manage
                prerequisites.
              </span>
            </Button>
            <Button
              variant="outline"
              className="h-auto flex-col items-start justify-start gap-2 p-5 text-left"
              onClick={() => setTab("live")}
            >
              <HugeiconsIcon icon={Clock01Icon} strokeWidth={2} data-icon="inline-start" />
              <span className="font-semibold">Run live queue</span>
              <span className="text-sm font-normal text-muted-foreground">
                Call tokens, start service, and complete or skip customers.
              </span>
            </Button>
            <Button
              variant="outline"
              className="h-auto flex-col items-start justify-start gap-2 p-5 text-left"
              onClick={() => setTab("appointments")}
            >
              <HugeiconsIcon icon={Calendar02Icon} strokeWidth={2} data-icon="inline-start" />
              <span className="font-semibold">Appointment desk</span>
              <span className="text-sm font-normal text-muted-foreground">
                View bookings for this service, check in customers, and complete
                visits.
              </span>
            </Button>
          </div>
        </TabsContent>

        <TabsContent value="queues" className="flex flex-col gap-5 pt-2">
          <div className="grid items-start gap-5 xl:grid-cols-[1.1fr_0.9fr]">
            <div className="flex min-w-0 flex-col gap-3">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <h2 className="font-heading text-xl font-bold tracking-tight">
                    Queues for {service.name}
                  </h2>
                  <p className="mt-1 text-sm text-muted-foreground">
                    Only queues linked to this service are shown.
                  </p>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  disabled={!service.queueEnabled}
                  onClick={() => {
                    resetQueueForm();
                    setShowQueueForm(true);
                  }}
                >
                  <HugeiconsIcon
                    icon={PlusIcon}
                    strokeWidth={2}
                    data-icon="inline-start"
                  />
                  New queue
                </Button>
              </div>

              {!service.queueEnabled ? (
                <p className="text-sm text-amber-600 dark:text-amber-500">
                  Live queues are disabled for this service. Enable them in
                  service settings to create queues.
                </p>
              ) : null}

              {queues.length === 0 ? (
                <Empty className="border-dashed">
                  <EmptyContent>
                    <EmptyMedia variant="icon">
                      <HugeiconsIcon icon={Queue02Icon} strokeWidth={2} />
                    </EmptyMedia>
                    <EmptyTitle>No queues yet</EmptyTitle>
                    <EmptyDescription>
                      Create a queue for this service to start managing walk-in
                      customers.
                    </EmptyDescription>
                  </EmptyContent>
                </Empty>
              ) : (
                queues.map((queue) => (
                  <Card key={queue._id} size="sm">
                    <CardContent className="flex flex-col gap-3">
                      <div className="flex flex-wrap items-center gap-2">
                        <h3 className="font-semibold">{queue.name}</h3>
                        <Badge
                          variant={statusVariant(queue.status)}
                          className="h-5 rounded-full capitalize"
                        >
                          {queue.status}
                        </Badge>
                      </div>
                      <p className="text-sm text-muted-foreground">
                        {queue.description || "No description"}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {queue.prerequisites.length} prerequisite(s)
                      </p>

                      <div className="flex flex-wrap gap-2 border-t pt-3">
                        <Button
                          size="sm"
                          disabled={busy}
                          onClick={() => {
                            setSelectedQueueId(queue._id);
                            setTab("live");
                          }}
                        >
                          Live operations
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          disabled={busy}
                          onClick={() => beginQueueEdit(queue)}
                        >
                          Edit
                        </Button>
                        {queue.status !== "active" ? (
                          <Button
                            size="sm"
                            variant="outline"
                            disabled={busy}
                            onClick={() =>
                              void queueStatus(queue._id, "active")
                            }
                          >
                            Activate
                          </Button>
                        ) : null}
                        {queue.status === "active" ? (
                          <Button
                            size="sm"
                            variant="outline"
                            disabled={busy}
                            onClick={() =>
                              void queueStatus(queue._id, "paused")
                            }
                          >
                            Pause
                          </Button>
                        ) : null}
                        {queue.status !== "closed" ? (
                          <Button
                            size="sm"
                            variant="outline"
                            disabled={busy}
                            onClick={() =>
                              void queueStatus(queue._id, "closed")
                            }
                          >
                            Close
                          </Button>
                        ) : null}
                        {queue.status === "closed" ? (
                          <Button
                            size="sm"
                            variant="outline"
                            disabled={busy}
                            onClick={() =>
                              void queueStatus(queue._id, "paused")
                            }
                          >
                            Reopen
                          </Button>
                        ) : null}
                        <Button
                          size="sm"
                          variant="outline"
                          className="ml-auto text-destructive hover:bg-destructive/10 hover:text-destructive"
                          disabled={busy}
                          onClick={() =>
                            setDeleteTarget({
                              queueId: queue._id,
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
                ))
              )}
            </div>

            {showQueueForm ? (
              <Card>
                <CardHeader>
                  <CardTitle>
                    {editingQueueId ? "Edit queue" : "Create queue"}
                  </CardTitle>
                  <CardDescription>
                    Service: <span className="font-medium">{service.name}</span>{" "}
                    (fixed)
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <form
                    onSubmit={saveQueue}
                    className="grid gap-4"
                    id="queue-form"
                  >
                    <Field>
                      <FieldLabel>Queue name</FieldLabel>
                      <Input
                        value={queueName}
                        onChange={(event) => setQueueName(event.target.value)}
                        required
                      />
                    </Field>

                    <Field>
                      <FieldLabel>Description</FieldLabel>
                      <Textarea
                        rows={2}
                        value={queueDescription}
                        onChange={(event) =>
                          setQueueDescription(event.target.value)
                        }
                      />
                    </Field>

                    <div className="grid gap-3">
                      <div className="flex items-center justify-between gap-2">
                        <h3 className="text-sm font-medium">Prerequisites</h3>
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={addPrerequisite}
                        >
                          <HugeiconsIcon
                            icon={PlusIcon}
                            strokeWidth={2}
                            data-icon="inline-start"
                          />
                          Add requirement
                        </Button>
                      </div>

                      {prerequisites.length === 0 ? (
                        <p className="text-sm text-muted-foreground">
                          No prerequisites configured.
                        </p>
                      ) : null}

                      {prerequisites.map((item, index) => (
                        <div
                          key={item.id}
                          className="grid gap-3 rounded-2xl border p-3"
                        >
                          <Input
                            placeholder="Requirement label"
                            value={item.label}
                            onChange={(event) =>
                              patchPrerequisite(index, {
                                label: event.target.value,
                              })
                            }
                            required
                          />
                          <Input
                            placeholder="Optional explanation"
                            value={item.description ?? ""}
                            onChange={(event) =>
                              patchPrerequisite(index, {
                                description: event.target.value,
                              })
                            }
                          />
                          <div className="flex flex-wrap items-center justify-between gap-2">
                            <label className="flex cursor-pointer items-center gap-2.5 text-sm">
                              <Checkbox
                                checked={item.isRequired}
                                onCheckedChange={(checked) =>
                                  patchPrerequisite(index, {
                                    isRequired: checked === true,
                                  })
                                }
                              />
                              Required acknowledgement
                            </label>
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              className="text-destructive hover:bg-destructive/10 hover:text-destructive"
                              onClick={() =>
                                setPrerequisites((items) =>
                                  items.filter((_, i) => i !== index),
                                )
                              }
                            >
                              Remove
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>

                    <div className="flex gap-2">
                      <Button type="submit" disabled={busy}>
                        {busy ? <Spinner data-icon="inline-start" /> : null}
                        {busy ? "Saving…" : "Save queue"}
                      </Button>
                      <Button
                        type="button"
                        variant="outline"
                        onClick={resetQueueForm}
                        disabled={busy}
                      >
                        Cancel
                      </Button>
                    </div>
                  </form>
                </CardContent>
              </Card>
            ) : null}
          </div>
        </TabsContent>

        <TabsContent value="live" className="flex flex-col gap-5 pt-2">
          <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-end">
            <div>
              <h2 className="font-heading text-xl font-bold tracking-tight">
                Live queue
              </h2>
              <p className="mt-1 text-sm text-muted-foreground">
                Live token controls for {service.name}.
              </p>
            </div>
            <Field className="sm:w-80">
              <FieldLabel>Queue</FieldLabel>
              <Select
                value={selectedQueue?._id ?? ""}
                onValueChange={(value) => setSelectedQueueId(value ?? "")}
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Choose a queue" />
                </SelectTrigger>
                <SelectContent>
                  {queues.map((q) => (
                    <SelectItem key={q._id} value={q._id}>
                      {q.name} · {titleCase(q.status)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </Field>
          </div>

          {!selectedQueue ? (
            <Empty className="border-dashed">
              <EmptyContent>
                <EmptyMedia variant="icon">
                  <HugeiconsIcon icon={Clock01Icon} strokeWidth={2} />
                </EmptyMedia>
                <EmptyTitle>No queue selected</EmptyTitle>
                <EmptyDescription>
                  Create a queue in the Queues tab first.
                </EmptyDescription>
              </EmptyContent>
              <Button size="sm" onClick={() => setTab("queues")}>
                Configure queues
              </Button>
            </Empty>
          ) : (
            <>
              <Card>
                <CardContent className="flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <h3 className="font-heading text-lg font-bold tracking-tight">
                        {selectedQueue.name}
                      </h3>
                      <Badge
                        variant={statusVariant(selectedQueue.status)}
                        className="h-5 rounded-full capitalize"
                      >
                        {selectedQueue.status}
                      </Badge>
                    </div>
                    <p className="mt-1 text-sm text-muted-foreground">
                      {selectedQueue.description}
                    </p>
                  </div>
                  <Button
                    disabled={busy || selectedQueue.status !== "active"}
                    onClick={() => void queueAction("call")}
                  >
                    {busy ? <Spinner data-icon="inline-start" /> : null}
                    {busy ? "Processing…" : "Call next customer"}
                  </Button>
                </CardContent>
              </Card>

              <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
                <StatCard label="Waiting" value={waiting} />
                <StatCard label="Called" value={called} />
                <StatCard label="Checked in" value={checkedIn} />
                <StatCard label="In service" value={serving} />
              </div>

              <Card>
                <CardHeader>
                  <CardTitle>Active tokens</CardTitle>
                  <CardDescription>
                    Realtime status updates from Convex.
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {tokens === undefined ? (
                    <Skeleton className="h-24 w-full rounded-2xl" />
                  ) : tokens.length === 0 ? (
                    <p className="py-6 text-center text-sm text-muted-foreground">
                      No active tokens.
                    </p>
                  ) : (
                    <div className="grid gap-3">
                      {tokens.map((token) => (
                        <article
                          key={token._id}
                          className="grid gap-3 rounded-2xl border p-4"
                        >
                          <div className="flex items-start gap-3">
                            <div className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-muted font-heading text-sm font-bold">
                              #{token.tokenNumber}
                            </div>
                            <div className="min-w-0">
                              <div className="flex flex-wrap items-center gap-2">
                                <p className="font-semibold">
                                  Token #{token.tokenNumber}
                                </p>
                                <Badge
                                  variant={statusVariant(token.status)}
                                  className="h-5 rounded-full capitalize"
                                >
                                  {titleCase(token.status)}
                                </Badge>
                              </div>
                              <p className="mt-1 flex items-center gap-1.5 text-sm text-muted-foreground">
                                <HugeiconsIcon
                                  icon={Clock01Icon}
                                  strokeWidth={2}
                                  data-icon="inline-start"
                                />
                                Joined {dateTime(token.joinedAt)}
                              </p>
                              {token.customerNote ? (
                                <p className="mt-1 text-sm">
                                  {token.customerNote}
                                </p>
                              ) : null}
                              {token.status === "called" &&
                              token.graceDeadlineAt ? (
                                <p className="mt-1 text-xs text-amber-600 dark:text-amber-500">
                                  Check-in deadline{" "}
                                  {formatTimeIST(token.graceDeadlineAt)}
                                </p>
                              ) : null}
                            </div>
                          </div>

                          <div className="flex flex-wrap gap-2 border-t pt-3">
                            {token.status === "checked_in" ? (
                              <Button
                                size="sm"
                                disabled={busy}
                                onClick={() =>
                                  void queueAction("start", token._id)
                                }
                              >
                                Start service
                              </Button>
                            ) : null}
                            {token.status === "serving" ? (
                              <Button
                                size="sm"
                                disabled={busy}
                                onClick={() =>
                                  void queueAction("complete", token._id)
                                }
                              >
                                Complete
                              </Button>
                            ) : null}
                            {["waiting", "called", "checked_in"].includes(
                              token.status,
                            ) ? (
                              <Button
                                size="sm"
                                variant="outline"
                                className="text-destructive hover:bg-destructive/10 hover:text-destructive"
                                disabled={busy}
                                onClick={() =>
                                  void queueAction("skip", token._id)
                                }
                              >
                                Skip
                              </Button>
                            ) : null}
                          </div>
                        </article>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </>
          )}
        </TabsContent>

        <TabsContent value="appointments" className="flex flex-col gap-5 pt-2">
          {!service.appointmentsEnabled ? (
            <p className="text-sm text-amber-600 dark:text-amber-500">
              Appointments are disabled for this service. Enable them in
              service settings to accept new bookings.
            </p>
          ) : null}

          <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-end">
            <div>
              <h2 className="font-heading text-xl font-bold tracking-tight">
                Appointments
              </h2>
              <p className="mt-1 text-sm text-muted-foreground">
                Only appointments for {service.name} are displayed.
              </p>
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              <Field>
                <FieldLabel>Date</FieldLabel>
                <Input
                  type="date"
                  value={date}
                  onChange={(event) => setDate(event.target.value)}
                />
              </Field>
              <Field>
                <FieldLabel>Status</FieldLabel>
                <Select
                  value={appointmentFilter}
                  onValueChange={(value) =>
                    setAppointmentFilter(value as "all" | AppointmentStatus)
                  }
                >
                  <SelectTrigger className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All statuses</SelectItem>
                    <SelectItem value="booked">Booked</SelectItem>
                    <SelectItem value="checked_in">Checked in</SelectItem>
                    <SelectItem value="completed">Completed</SelectItem>
                    <SelectItem value="cancelled">Cancelled</SelectItem>
                    <SelectItem value="no_show">No-show</SelectItem>
                  </SelectContent>
                </Select>
              </Field>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
            <StatCard
              label="Booked"
              value={appointments.filter((a) => a.status === "booked").length}
            />
            <StatCard
              label="Checked in"
              value={
                appointments.filter((a) => a.status === "checked_in").length
              }
            />
            <StatCard
              label="Completed"
              value={
                appointments.filter((a) => a.status === "completed").length
              }
            />
            <StatCard
              label="No-shows"
              value={appointments.filter((a) => a.status === "no_show").length}
            />
          </div>

          <Card>
            <CardContent>
              {filteredAppointments.length === 0 ? (
                <p className="py-10 text-center text-sm text-muted-foreground">
                  No matching appointments for this date.
                </p>
              ) : (
                <div className="grid gap-3">
                  {filteredAppointments.map((item) => {
                    const canMarkNoShow =
                      item.status === "booked" && now >= item.scheduledEnd;

                    return (
                      <article
                        key={item._id}
                        className="flex flex-col justify-between gap-3 rounded-2xl border p-4 sm:flex-row sm:items-center"
                      >
                        <div className="flex items-start gap-4">
                          <div className="grid gap-1 rounded-xl bg-muted p-3 text-center">
                            <p className="font-semibold tabular-nums">
                              {formatTimeIST(item.scheduledStart)}
                            </p>
                            <p className="text-xs text-muted-foreground">
                              {formatTimeIST(item.scheduledEnd)}
                            </p>
                          </div>
                          <div className="min-w-0">
                            <p className="font-semibold">{service.name}</p>
                            <p className="mt-1 flex items-center gap-1.5 text-sm text-muted-foreground">
                              <HugeiconsIcon
                                icon={Ticket01Icon}
                                strokeWidth={2}
                                data-icon="inline-start"
                              />
                              {dateTime(item.scheduledStart)}
                            </p>
                            {item.notes ? (
                              <p className="mt-2 text-sm">{item.notes}</p>
                            ) : null}
                            <div className="mt-2">
                              <Badge
                                variant={statusVariant(item.status)}
                                className="h-5 rounded-full capitalize"
                              >
                                {titleCase(item.status)}
                              </Badge>
                            </div>
                          </div>
                        </div>

                        <div className="flex flex-wrap gap-2">
                          {item.status === "booked" ? (
                            <Button
                              size="sm"
                              disabled={busy}
                              onClick={() =>
                                void appointmentAction("checkIn", item._id)
                              }
                            >
                              Check in
                            </Button>
                          ) : null}
                          {item.status === "checked_in" ? (
                            <Button
                              size="sm"
                              disabled={busy}
                              onClick={() =>
                                void appointmentAction("complete", item._id)
                              }
                            >
                              Complete visit
                            </Button>
                          ) : null}
                          {canMarkNoShow ? (
                            <Button
                              size="sm"
                              variant="outline"
                              className="text-destructive hover:bg-destructive/10 hover:text-destructive"
                              disabled={busy}
                              onClick={() =>
                                void appointmentAction("noShow", item._id)
                              }
                            >
                              Mark no-show
                            </Button>
                          ) : null}
                        </div>
                      </article>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="availability" className="flex flex-col gap-5 pt-2">
          <div>
            <h2 className="font-heading text-xl font-bold tracking-tight">
              Availability
            </h2>
            <p className="mt-1 text-sm text-muted-foreground">
              Calculated from the existing business hours and Convex capacity
              rules.
            </p>
          </div>

          {!service.appointmentsEnabled ? (
            <p className="text-sm text-muted-foreground">
              Appointments are disabled for this service.
            </p>
          ) : (
            <>
              <Card>
                <CardContent className="flex flex-wrap items-end justify-between gap-4">
                  <Field>
                    <FieldLabel>Date</FieldLabel>
                    <Input
                      type="date"
                      value={date}
                      min={todayInIST()}
                      onChange={(event) => setDate(event.target.value)}
                    />
                  </Field>
                  <p className="text-sm text-muted-foreground">
                    Timezone: Asia/Kolkata (IST)
                  </p>
                </CardContent>
              </Card>

              {availability === undefined ? (
                <Skeleton className="h-40 w-full rounded-3xl" />
              ) : (
                <>
                  <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
                    <StatCard
                      label="Daily capacity"
                      value={
                        "dailyCapacity" in availability
                          ? availability.dailyCapacity ?? 0
                          : 0
                      }
                    />
                    <StatCard
                      label="Booked appointments"
                      value={
                        "bookedAppointments" in availability
                          ? availability.bookedAppointments ?? 0
                          : 0
                      }
                    />
                    <StatCard
                      label="Active queue tokens"
                      value={
                        "activeQueueTokens" in availability
                          ? availability.activeQueueTokens ?? 0
                          : 0
                      }
                    />
                    <StatCard
                      label="Remaining capacity"
                      value={availability.remainingCapacity}
                    />
                  </div>

                  <Card>
                    <CardHeader className="flex-row items-center justify-between gap-3">
                      <CardTitle>
                        <HugeiconsIcon
                          icon={TimeScheduleIcon}
                          strokeWidth={2}
                          data-icon="inline-start"
                        />
                        Generated time slots
                      </CardTitle>
                      <Badge variant="secondary">
                        {availability.slots.length} slots
                      </Badge>
                    </CardHeader>
                    <CardContent>
                      {availability.slots.length === 0 ? (
                        <p className="text-sm text-muted-foreground">
                          No slots generated. Check business opening hours and
                          closures.
                        </p>
                      ) : (
                        <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-4">
                          {availability.slots.map((slot) => (
                            <div
                              key={slot.scheduledStart}
                              className={cn(
                                "rounded-xl border p-3",
                                slot.available
                                  ? "border-emerald-600/30 bg-emerald-500/10"
                                  : "bg-muted",
                              )}
                            >
                              <p className="font-medium tabular-nums">
                                {formatTimeIST(slot.scheduledStart)}–
                                {formatTimeIST(slot.scheduledEnd)}
                              </p>
                              <p
                                className={cn(
                                  "mt-2 text-xs",
                                  slot.available
                                    ? "text-emerald-700 dark:text-emerald-400"
                                    : "text-muted-foreground",
                                )}
                              >
                                {slot.available ? "Available" : "Unavailable"}
                              </p>
                            </div>
                          ))}
                        </div>
                      )}
                    </CardContent>
                  </Card>
                </>
              )}
            </>
          )}
        </TabsContent>
      </Tabs>

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
            <AlertDialogAction
              variant="destructive"
              onClick={() => void handleDeleteQueue()}
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}