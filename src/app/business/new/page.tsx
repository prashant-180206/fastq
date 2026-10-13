"use client";

import { useState, type FormEvent } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMutation } from "convex/react";
import { api } from "@/../convex/_generated/api";
import { AppHeader } from "@/components/layout/app-header";
import {
  Alert,
  AlertDescription,
  AlertTitle,
} from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Field,
  FieldDescription,
  FieldLabel,
} from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Spinner } from "@/components/ui/spinner";
import { Textarea } from "@/components/ui/textarea";
import { BUSINESS_TYPES, type BusinessType } from "@/lib/business-type";
import { notifyError, notifySuccess } from "@/lib/toast";
import {
  ArrowLeft01Icon,
  Gps01Icon,
  Store01Icon,
} from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import { cn } from "cn";

export default function NewBusinessPage() {
  const router = useRouter();
  const createBusiness = useMutation(api.business.data.create);

  const [name, setName] = useState("");
  const [type, setType] = useState<BusinessType>("business");
  const [description, setDescription] = useState("");
  const [contactEmail, setContactEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [latitude, setLatitude] = useState("");
  const [longitude, setLongitude] = useState("");
  const [locating, setLocating] = useState(false);
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  function handleUseCurrentLocation() {
    if (!("geolocation" in navigator)) {
      notifyError(
        "Geolocation not supported",
        "Your browser does not support location services.",
      );
      return;
    }

    setLocating(true);
    setError("");

    navigator.geolocation.getCurrentPosition(
      (position) => {
        setLatitude(position.coords.latitude.toFixed(6));
        setLongitude(position.coords.longitude.toFixed(6));
        setLocating(false);
        notifySuccess("Location added", "Coordinates filled from your current position.");
      },
      (err) => {
        setLocating(false);
        notifyError(
          "Could not get your location",
          err.code === err.PERMISSION_DENIED
            ? "Location permission was denied. Allow access in your browser to use this."
            : err.code === err.POSITION_UNAVAILABLE
              ? "Your location is currently unavailable. Try again or enter coordinates manually."
              : "The request timed out. Try again or enter coordinates manually.",
        );
      },
      { enableHighAccuracy: true, timeout: 15000, maximumAge: 60000 },
    );
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setSaving(true);

    const hasLatitude = latitude.trim() !== "";
    const hasLongitude = longitude.trim() !== "";

    if (hasLatitude !== hasLongitude) {
      setError("Provide both latitude and longitude, or leave both empty.");
      setSaving(false);
      return;
    }

    try {
      const businessId = await createBusiness({
        name,
        type,
        description: description || undefined,
        contactEmail: contactEmail || undefined,
        phone: phone || undefined,
        location:
          hasLatitude && hasLongitude
            ? {
                latitude: Number(latitude),
                longitude: Number(longitude),
              }
            : undefined,
      });

      router.push(`/business/${businessId}`);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Could not create business.",
      );
    } finally {
      setSaving(false);
    }
  }

  return (
    <>
      <AppHeader />

      <main className="mx-auto max-w-xl px-4 py-8 sm:px-6">
        <Link
          href="/business"
          className={cn(
            "inline-flex items-center gap-1.5 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground",
          )}
        >
          <HugeiconsIcon
            icon={ArrowLeft01Icon}
            strokeWidth={2}
            className="size-4"
          />
          All businesses
        </Link>

        <div className="mt-4">
          <div className="flex items-center gap-3">
            <div className="flex size-10 items-center justify-center rounded-xl bg-primary/10 text-primary">
              <HugeiconsIcon icon={Store01Icon} strokeWidth={2} className="size-5" />
            </div>
            <div>
              <h1 className="font-heading text-2xl font-bold tracking-tight">
                Create business
              </h1>
              <p className="mt-0.5 text-sm text-muted-foreground">
                Start with the basics. You can configure working hours later.
              </p>
            </div>
          </div>
        </div>

        <Card className="mt-6">
          <CardHeader>
            <CardTitle>Business details</CardTitle>
            <CardDescription>
              This information appears on your public QuiLess page.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="flex flex-col gap-5">
              <Field>
                <FieldLabel htmlFor="name">
                  Business name <span className="text-destructive">*</span>
                </FieldLabel>
                <Input
                  id="name"
                  required
                  maxLength={100}
                  value={name}
                  onChange={(event) => setName(event.target.value)}
                  placeholder="e.g. Downtown Salon"
                />
              </Field>

              <Field>
                <FieldLabel htmlFor="business-type">Type</FieldLabel>
                <Select
                  value={type}
                  onValueChange={(value) =>
                    setType((value as BusinessType) ?? "business")
                  }
                >
                  <SelectTrigger id="business-type" className="w-full">
                    <SelectValue placeholder="Select a type" />
                  </SelectTrigger>
                  <SelectContent>
                    {BUSINESS_TYPES.map((entry) => (
                      <SelectItem key={entry.value} value={entry.value}>
                        {entry.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FieldDescription>
                  The category shown when customers discover your business.
                </FieldDescription>
              </Field>

              <Field>
                <FieldLabel htmlFor="description">Description</FieldLabel>
                <Textarea
                  id="description"
                  value={description}
                  onChange={(event) => setDescription(event.target.value)}
                  placeholder="What does your business do?"
                  rows={3}
                />
                <FieldDescription>
                  Optional short summary shown on your public page.
                </FieldDescription>
              </Field>

              <Field>
                <FieldLabel htmlFor="email">Contact email</FieldLabel>
                <Input
                  id="email"
                  type="email"
                  value={contactEmail}
                  onChange={(event) => setContactEmail(event.target.value)}
                  placeholder="You@business.com"
                />
              </Field>

              <Field>
                <FieldLabel htmlFor="phone">Phone</FieldLabel>
                <Input
                  id="phone"
                  type="tel"
                  value={phone}
                  onChange={(event) => setPhone(event.target.value)}
                  placeholder="+91 98765 43210"
                />
              </Field>

              <div className="grid gap-5 sm:grid-cols-2">
                <Field>
                  <FieldLabel htmlFor="latitude">Latitude</FieldLabel>
                  <Input
                    id="latitude"
                    type="number"
                    step="any"
                    min="-90"
                    max="90"
                    inputMode="decimal"
                    value={latitude}
                    onChange={(event) => setLatitude(event.target.value)}
                    placeholder="e.g. 28.6139"
                  />
                </Field>

                <Field>
                  <FieldLabel htmlFor="longitude">Longitude</FieldLabel>
                  <Input
                    id="longitude"
                    type="number"
                    step="any"
                    min="-180"
                    max="180"
                    inputMode="decimal"
                    value={longitude}
                    onChange={(event) => setLongitude(event.target.value)}
                    placeholder="e.g. 77.2090"
                  />
                </Field>
              </div>
              <FieldDescription>
                Optional WGS84 coordinates for directions and nearby discovery.
              </FieldDescription>
              <Button
                type="button"
                variant="outline"
                className="w-full sm:w-fit"
                onClick={handleUseCurrentLocation}
                disabled={locating || saving}
              >
                {locating ? (
                  <Spinner data-icon="inline-start" />
                ) : (
                  <HugeiconsIcon
                    icon={Gps01Icon}
                    strokeWidth={2}
                    data-icon="inline-start"
                  />
                )}
                {locating ? "Getting your location…" : "Use my current location"}
              </Button>

              {error ? (
                <Alert variant="destructive">
                  <AlertTitle>Could not create business</AlertTitle>
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              ) : null}

              <Button type="submit" disabled={saving} className="w-full">
                {saving ? <Spinner data-icon="inline-start" /> : null}
                {saving ? "Creating…" : "Create business"}
              </Button>
            </form>
          </CardContent>
        </Card>
      </main>
    </>
  );
}