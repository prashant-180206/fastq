"use client";

import { useEffect, useState } from "react";
import { useMutation, useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import type { Id } from "@/convex/_generated/dataModel";

import {
  AlertCircle,
  Bell,
  CalendarDays,
  Check,
  Clock3,
  Loader2,
  MapPin,
  Phone,
  Save,
  Settings,
  Users,
} from "lucide-react";

import { Button } from "@/components/ui/button";

interface BusinessSettingsProps {
  businessId: string;
}

function getErrorMessage(error: unknown) {
  return error instanceof Error
    ? error.message
    : "Something went wrong.";
}

export default function BusinessSettings({
  businessId,
}: BusinessSettingsProps) {
  const id = businessId as Id<"businesses">;

  const business = useQuery(api.businesses.getForMember, {
    businessId: id,
  });

  const settings = useQuery(api.businessSettings.get, {
    businessId: id,
  });

  /*
   * Your backend's business settings mutation contract was not
   * supplied in the project files, so this page intentionally
   * reads the real settings without inventing a mutation API.
   *
   * Business settings that are already exposed by the backend:
   * - queueEnabled
   * - appointmentsEnabled
   * - appointmentMode
   * - queueSettings
   * - notificationSettings
   */

  const [queueEnabled, setQueueEnabled] = useState(false);
  const [appointmentsEnabled, setAppointmentsEnabled] =
    useState(false);

  const [savedSnapshot, setSavedSnapshot] = useState<{
    queueEnabled: boolean;
    appointmentsEnabled: boolean;
  } | null>(null);

  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!settings) return;

    setQueueEnabled(settings.queueEnabled);
    setAppointmentsEnabled(settings.appointmentsEnabled);

    setSavedSnapshot({
      queueEnabled: settings.queueEnabled,
      appointmentsEnabled: settings.appointmentsEnabled,
    });
  }, [settings]);

  const dirty =
    savedSnapshot !== null &&
    (queueEnabled !== savedSnapshot.queueEnabled ||
      appointmentsEnabled !==
        savedSnapshot.appointmentsEnabled);

  if (business === undefined || settings === undefined) {
    return <LoadingState />;
  }

  if (!business) {
    return (
      <div className="mx-auto max-w-5xl p-6">
        <div className="rounded-xl border border-destructive/30 bg-destructive/5 p-6">
          <div className="flex items-center gap-3 text-destructive">
            <AlertCircle className="h-5 w-5" />
            <p className="font-medium">
              Business not found
            </p>
          </div>
        </div>
      </div>
    );
  }

  if (!settings) {
    return (
      <div className="mx-auto max-w-5xl p-6">
        <div className="rounded-xl border p-6">
          <div className="flex items-center gap-3">
            <Settings className="h-5 w-5 text-muted-foreground" />

            <div>
              <p className="font-medium">
                Settings unavailable
              </p>

              <p className="mt-1 text-sm text-muted-foreground">
                Business settings could not be loaded.
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  function resetChanges() {
    if (!savedSnapshot) return;

    setQueueEnabled(savedSnapshot.queueEnabled);
    setAppointmentsEnabled(
      savedSnapshot.appointmentsEnabled,
    );

    setError(null);
  }

  return (
    <div className="mx-auto w-full max-w-5xl space-y-6 p-4 sm:p-6">
      {/* Header */}
      <div>
        <div className="flex items-center gap-2">
          <Settings className="h-6 w-6 text-primary" />

          <h1 className="text-2xl font-semibold tracking-tight">
            Business settings
          </h1>
        </div>

        <p className="mt-1 text-sm text-muted-foreground">
          Configure how {business.name} operates.
        </p>
      </div>

      {/* Error */}
      {error && (
        <div className="flex items-start gap-3 rounded-lg border border-destructive/30 bg-destructive/5 p-4 text-sm text-destructive">
          <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />

          <div>
            <p className="font-medium">
              Settings error
            </p>

            <p className="mt-1">{error}</p>
          </div>
        </div>
      )}

      {/* Business information */}
      <section className="rounded-xl border bg-card">
        <div className="border-b p-5">
          <h2 className="font-semibold">
            Business information
          </h2>

          <p className="mt-1 text-sm text-muted-foreground">
            Information customers see about your business.
          </p>
        </div>

        <div className="grid gap-5 p-5 sm:grid-cols-2">
          <InfoItem
            icon={Settings}
            label="Business name"
            value={business.name}
          />

          <InfoItem
            icon={Users}
            label="Business type"
            value={business.type}
          />

          <InfoItem
            icon={MapPin}
            label="Address"
            value={business.address}
          />

          <InfoItem
            icon={MapPin}
            label="City"
            value={business.city}
          />

          <InfoItem
            icon={Phone}
            label="Phone"
            value={business.phone || "Not configured"}
          />

          <InfoItem
            icon={Clock3}
            label="Status"
            value={
              business.isActive
                ? "Active"
                : "Inactive"
            }
          />
        </div>
      </section>

      {/* Operating capabilities */}
      <section className="rounded-xl border bg-card">
        <div className="border-b p-5">
          <h2 className="font-semibold">
            Operating capabilities
          </h2>

          <p className="mt-1 text-sm text-muted-foreground">
            Enable or disable the main workflows for this
            business.
          </p>
        </div>

        <div className="divide-y">
          <SettingRow
            icon={Users}
            title="Queue management"
            description="Allow customers to join queues and staff to operate them."
            enabled={queueEnabled}
            onChange={setQueueEnabled}
          />

          <SettingRow
            icon={CalendarDays}
            title="Appointments"
            description="Allow customers to book appointments for your services."
            enabled={appointmentsEnabled}
            onChange={setAppointmentsEnabled}
          />
        </div>
      </section>

      {/* Current appointment mode */}
      <section className="rounded-xl border bg-card p-5">
        <div className="flex items-start gap-4">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
            <CalendarDays className="h-5 w-5" />
          </div>

          <div className="min-w-0">
            <h2 className="font-semibold">
              Appointment mode
            </h2>

            <p className="mt-1 text-sm text-muted-foreground">
              Current backend configuration:
            </p>

            <div className="mt-3 inline-flex rounded-full border bg-muted px-3 py-1 text-xs font-medium">
              {settings.appointmentMode}
            </div>
          </div>
        </div>
      </section>

      {/* Queue configuration */}
      <section className="rounded-xl border bg-card p-5">
        <div className="flex items-start gap-4">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
            <Users className="h-5 w-5" />
          </div>

          <div>
            <h2 className="font-semibold">
              Queue configuration
            </h2>

            <p className="mt-1 text-sm text-muted-foreground">
              Queue-specific configuration is stored in the
              backend settings.
            </p>

            <pre className="mt-4 max-w-full overflow-x-auto rounded-lg bg-muted p-4 text-xs">
              {JSON.stringify(
                settings.queueSettings ?? {},
                null,
                2,
              )}
            </pre>
          </div>
        </div>
      </section>

      {/* Notifications */}
      <section className="rounded-xl border bg-card p-5">
        <div className="flex items-start gap-4">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
            <Bell className="h-5 w-5" />
          </div>

          <div>
            <h2 className="font-semibold">
              Notifications
            </h2>

            <p className="mt-1 text-sm text-muted-foreground">
              Notification configuration stored by the
              business.
            </p>

            <pre className="mt-4 max-w-full overflow-x-auto rounded-lg bg-muted p-4 text-xs">
              {JSON.stringify(
                settings.notificationSettings ?? {},
                null,
                2,
              )}
            </pre>
          </div>
        </div>
      </section>

      {/* Save bar */}
      <div className="sticky bottom-4 z-20 flex flex-col gap-3 rounded-xl border bg-background/95 p-4 shadow-lg backdrop-blur sm:flex-row sm:items-center sm:justify-between">
        <div>
          {dirty ? (
            <p className="text-sm font-medium">
              Unsaved changes
            </p>
          ) : (
            <p className="flex items-center gap-2 text-sm text-muted-foreground">
              <Check className="h-4 w-4" />
              All changes saved
            </p>
          )}

          <p className="text-xs text-muted-foreground">
            Settings mutations should be wired once the
            backend settings update contract is available.
          </p>
        </div>

        <div className="flex gap-2">
          <Button
            type="button"
            variant="outline"
            disabled={!dirty}
            onClick={resetChanges}
          >
            Reset
          </Button>

          <Button
            type="button"
            disabled={!dirty}
            onClick={() => {
              setError(
                "The current Convex backend does not expose a settings update mutation in the supplied project files.",
              );
            }}
          >
            <Save className="mr-2 h-4 w-4" />
            Save changes
          </Button>
        </div>
      </div>
    </div>
  );
}

function SettingRow({
  icon: Icon,
  title,
  description,
  enabled,
  onChange,
}: {
  icon: typeof Users;
  title: string;
  description: string;
  enabled: boolean;
  onChange: (value: boolean) => void;
}) {
  return (
    <div className="flex items-center justify-between gap-5 p-5">
      <div className="flex min-w-0 items-start gap-4">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-muted">
          <Icon className="h-5 w-5 text-muted-foreground" />
        </div>

        <div>
          <p className="font-medium">{title}</p>

          <p className="mt-1 text-sm leading-5 text-muted-foreground">
            {description}
          </p>
        </div>
      </div>

      <button
        type="button"
        role="switch"
        aria-checked={enabled}
        onClick={() => onChange(!enabled)}
        className={[
          "relative h-6 w-11 shrink-0 rounded-full transition-colors",
          enabled ? "bg-primary" : "bg-muted",
          "focus:outline-none focus:ring-2 focus:ring-primary/30",
        ].join(" ")}
      >
        <span
          className={[
            "absolute top-1 h-4 w-4 rounded-full bg-white shadow transition-transform",
            enabled
              ? "translate-x-6"
              : "translate-x-1",
          ].join(" ")}
        />
      </button>
    </div>
  );
}

function InfoItem({
  icon: Icon,
  label,
  value,
}: {
  icon: typeof Settings;
  label: string;
  value: string;
}) {
  return (
    <div className="flex items-start gap-3">
      <Icon className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" />

      <div className="min-w-0">
        <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
          {label}
        </p>

        <p className="mt-1 break-words text-sm">
          {value}
        </p>
      </div>
    </div>
  );
}

function LoadingState() {
  return (
    <div className="mx-auto w-full max-w-5xl space-y-6 p-4 sm:p-6">
      <div className="space-y-2">
        <div className="h-8 w-56 animate-pulse rounded bg-muted" />
        <div className="h-4 w-80 animate-pulse rounded bg-muted" />
      </div>

      {Array.from({ length: 4 }).map((_, index) => (
        <div
          key={index}
          className="h-32 animate-pulse rounded-xl border bg-muted/40"
        />
      ))}
    </div>
  );
}