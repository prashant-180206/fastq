"use client";

import { FormEvent, useState } from "react";
import { useMutation } from "convex/react";
import { useRouter } from "next/navigation";
// import { api } from "@/../convex/_generated/api";
import {
  ArrowLeft,
  ArrowRight,
  Building2,
  Loader2,
  MapPin,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { api } from "@/convex/_generated/api";

const BUSINESS_TYPES = [
  "Restaurant",
  "Cafe",
  "Salon",
  "Clinic",
  "Hospital",
  "Barbershop",
  "Retail",
  "Fitness",
  "Education",
  "Other",
];

export default function CreateBusinessForm() {
  const router = useRouter();
  const createBusiness = useMutation(api.businesses.create);

  const [form, setForm] = useState({
    name: "",
    description: "",
    type: "",
    city: "",
    address: "",
    latitude: "",
    longitude: "",
    phone: "",
    website: "",
  });

  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [locating, setLocating] = useState(false);

  function updateField(field: keyof typeof form, value: string) {
    setForm((current) => ({
      ...current,
      [field]: value,
    }));
  }

  function useCurrentLocation() {
    if (!navigator.geolocation) {
      setError("Geolocation is not supported by this browser.");
      return;
    }

    setError("");
    setLocating(true);

    navigator.geolocation.getCurrentPosition(
      (position) => {
        updateField("latitude", position.coords.latitude.toString());

        updateField("longitude", position.coords.longitude.toString());

        setLocating(false);
      },
      () => {
        setError(
          "Unable to get your location. You can enter the coordinates manually.",
        );
        setLocating(false);
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
      },
    );
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    setError("");

    const name = form.name.trim();
    const type = form.type.trim();
    const city = form.city.trim();
    const address = form.address.trim();

    if (!name) {
      setError("Business name is required.");
      return;
    }

    if (!type) {
      setError("Business type is required.");
      return;
    }

    if (!city) {
      setError("City is required.");
      return;
    }

    if (!address) {
      setError("Address is required.");
      return;
    }

    const latitude = Number(form.latitude);
    const longitude = Number(form.longitude);

    if (!Number.isFinite(latitude) || latitude < -90 || latitude > 90) {
      setError("Enter a valid latitude between -90 and 90.");
      return;
    }

    if (!Number.isFinite(longitude) || longitude < -180 || longitude > 180) {
      setError("Enter a valid longitude between -180 and 180.");
      return;
    }

    setSubmitting(true);

    try {
      const businessId = await createBusiness({
        name,
        type,
        city,
        address,
        latitude,
        longitude,
        description: form.description.trim() || undefined,
        phone: form.phone.trim() || undefined,
        website: form.website.trim() || undefined,
      });

      router.push(`/business/${businessId}`);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to create the business.",
      );
      setSubmitting(false);
    }
  }

  return (
    <main className="min-h-[calc(100vh-4rem)] bg-muted/20">
      <div className="mx-auto max-w-3xl px-4 py-8 sm:px-6 lg:px-8">
        <Button
          variant="ghost"
          className="mb-6 -ml-3"
          onClick={() => router.back()}
          disabled={submitting}
        >
          <ArrowLeft className="mr-2 size-4" />
          Back
        </Button>

        <div className="mb-8">
          <div className="mb-3 flex size-12 items-center justify-center rounded-xl bg-primary/10">
            <Building2 className="size-6 text-primary" />
          </div>

          <h1 className="text-3xl font-bold tracking-tight">
            Create your business
          </h1>

          <p className="mt-2 text-muted-foreground">
            Add your business information to get started with Quiskip.
          </p>
        </div>

        <form onSubmit={handleSubmit}>
          <Card>
            <CardHeader>
              <CardTitle>Business information</CardTitle>
            </CardHeader>

            <CardContent className="space-y-6">
              {/* Name + Type */}
              <div className="grid gap-5 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="name">
                    Business name <span className="text-destructive">*</span>
                  </Label>

                  <Input
                    id="name"
                    value={form.name}
                    onChange={(e) => updateField("name", e.target.value)}
                    placeholder="e.g. Brew House"
                    disabled={submitting}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="type">
                    Business type <span className="text-destructive">*</span>
                  </Label>

                  <select
                    id="type"
                    value={form.type}
                    onChange={(e) => updateField("type", e.target.value)}
                    disabled={submitting}
                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus:outline-none focus:ring-2 focus:ring-ring"
                  >
                    <option value="">Select a type</option>

                    {BUSINESS_TYPES.map((type) => (
                      <option key={type} value={type}>
                        {type}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Description */}
              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>

                <Textarea
                  id="description"
                  value={form.description}
                  onChange={(e: any) =>
                    updateField("description", e.target.value)
                  }
                  placeholder="Tell customers a little about your business..."
                  rows={4}
                  disabled={submitting}
                />
              </div>

              {/* Location */}
              <div className="border-t pt-6">
                <div className="mb-4">
                  <h3 className="font-semibold">Location</h3>

                  <p className="text-sm text-muted-foreground">
                    This information is used to locate your business.
                  </p>
                </div>

                <div className="space-y-5">
                  <div className="space-y-2">
                    <Label htmlFor="city">
                      City <span className="text-destructive">*</span>
                    </Label>

                    <Input
                      id="city"
                      value={form.city}
                      onChange={(e) => updateField("city", e.target.value)}
                      placeholder="e.g. Pune"
                      disabled={submitting}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="address">
                      Address <span className="text-destructive">*</span>
                    </Label>

                    <Textarea
                      id="address"
                      value={form.address}
                      onChange={(e: any) =>
                        updateField("address", e.target.value)
                      }
                      placeholder="Full business address"
                      rows={3}
                      disabled={submitting}
                    />
                  </div>

                  <div className="flex flex-col gap-3 rounded-xl border bg-muted/30 p-4 sm:flex-row sm:items-center sm:justify-between">
                    <div className="flex gap-3">
                      <MapPin className="mt-0.5 size-5 shrink-0 text-primary" />

                      <div>
                        <p className="font-medium">Business coordinates</p>

                        <p className="text-sm text-muted-foreground">
                          Required for your business location.
                        </p>
                      </div>
                    </div>

                    <Button
                      type="button"
                      variant="outline"
                      onClick={useCurrentLocation}
                      disabled={submitting || locating}
                    >
                      {locating ? (
                        <>
                          <Loader2 className="mr-2 size-4 animate-spin" />
                          Getting location...
                        </>
                      ) : (
                        <>
                          <MapPin className="mr-2 size-4" />
                          Use current location
                        </>
                      )}
                    </Button>
                  </div>

                  <div className="grid gap-5 sm:grid-cols-2">
                    <div className="space-y-2">
                      <Label htmlFor="latitude">
                        Latitude <span className="text-destructive">*</span>
                      </Label>

                      <Input
                        id="latitude"
                        type="number"
                        step="any"
                        value={form.latitude}
                        onChange={(e) =>
                          updateField("latitude", e.target.value)
                        }
                        placeholder="18.5204"
                        disabled={submitting}
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="longitude">
                        Longitude <span className="text-destructive">*</span>
                      </Label>

                      <Input
                        id="longitude"
                        type="number"
                        step="any"
                        value={form.longitude}
                        onChange={(e) =>
                          updateField("longitude", e.target.value)
                        }
                        placeholder="73.8567"
                        disabled={submitting}
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Contact */}
              <div className="border-t pt-6">
                <div className="mb-4">
                  <h3 className="font-semibold">Contact information</h3>

                  <p className="text-sm text-muted-foreground">
                    Optional information customers can use to contact you.
                  </p>
                </div>

                <div className="grid gap-5 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="phone">Phone</Label>

                    <Input
                      id="phone"
                      type="tel"
                      value={form.phone}
                      onChange={(e) => updateField("phone", e.target.value)}
                      placeholder="+91 98765 43210"
                      disabled={submitting}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="website">Website</Label>

                    <Input
                      id="website"
                      type="url"
                      value={form.website}
                      onChange={(e) => updateField("website", e.target.value)}
                      placeholder="https://example.com"
                      disabled={submitting}
                    />
                  </div>
                </div>
              </div>

              {/* Error */}
              {error && (
                <div
                  role="alert"
                  className="rounded-lg border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive"
                >
                  {error}
                </div>
              )}

              {/* Submit */}
              <div className="flex flex-col-reverse gap-3 border-t pt-6 sm:flex-row sm:justify-end">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => router.back()}
                  disabled={submitting}
                >
                  Cancel
                </Button>

                <Button type="submit" disabled={submitting}>
                  {submitting ? (
                    <>
                      <Loader2 className="mr-2 size-4 animate-spin" />
                      Creating...
                    </>
                  ) : (
                    <>
                      Create business
                      <ArrowRight className="ml-2 size-4" />
                    </>
                  )}
                </Button>
              </div>
            </CardContent>
          </Card>
        </form>
      </div>
    </main>
  );
}
