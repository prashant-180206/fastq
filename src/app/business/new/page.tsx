"use client";

import { useState } from "react";
import Link from "next/link";
import { useMutation, useQuery } from "convex/react";
import { api } from "@/../convex/_generated/api";

export default function NewBusinessPage() {
  const createBusiness = useMutation(api.businesses.create);
  const businesses = useQuery(api.businesses.getMine);

  const [name, setName] = useState("");
  const [slug, setSlug] = useState("");
  const [description, setDescription] = useState("");
  const [contactEmail, setContactEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  function makeSlug(value: string) {
    return value
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-|-$/g, "");
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setLoading(true);

    try {
      await createBusiness({
        name: name.trim(),
        slug: slug.trim(),
        description: description.trim() || undefined,
        contactEmail: contactEmail.trim() || undefined,
        phone: phone.trim() || undefined,
      });

      setName("");
      setSlug("");
      setDescription("");
      setContactEmail("");
      setPhone("");
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Could not create the business.",
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="min-h-screen bg-slate-50 px-4 py-10">
      <div className="mx-auto max-w-3xl">
        <Link href="/" className="text-sm font-semibold text-blue-700">
          ← Quiskip home
        </Link>

        <header className="mt-8">
          <h1 className="text-3xl font-bold tracking-tight text-slate-900">
            Your businesses
          </h1>
          <p className="mt-2 text-slate-600">
            Create a business to start managing queues and appointments.
          </p>
        </header>

        <section className="mt-8 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <h2 className="text-xl font-semibold text-slate-900">
            Add a business
          </h2>

          <form onSubmit={handleSubmit} className="mt-6 space-y-5">
            <div>
              <label
                htmlFor="name"
                className="mb-2 block text-sm font-medium text-slate-700"
              >
                Business name
              </label>
              <input
                id="name"
                required
                value={name}
                onChange={(event) => {
                  const value = event.target.value;
                  setName(value);
                  setSlug(makeSlug(value));
                }}
                className="w-full rounded-lg border border-slate-300 px-4 py-3 outline-none focus:border-blue-600"
                placeholder="Example Clinic"
              />
            </div>

            <div>
              <label
                htmlFor="slug"
                className="mb-2 block text-sm font-medium text-slate-700"
              >
                Business URL slug
              </label>
              <input
                id="slug"
                required
                pattern="[a-z0-9]+(-[a-z0-9]+)*"
                value={slug}
                onChange={(event) => setSlug(makeSlug(event.target.value))}
                className="w-full rounded-lg border border-slate-300 px-4 py-3 outline-none focus:border-blue-600"
                placeholder="example-clinic"
              />
              <p className="mt-1 text-xs text-slate-500">
                Lowercase letters, numbers, and hyphens.
              </p>
            </div>

            <div>
              <label
                htmlFor="description"
                className="mb-2 block text-sm font-medium text-slate-700"
              >
                Description (optional)
              </label>
              <textarea
                id="description"
                rows={3}
                value={description}
                onChange={(event) => setDescription(event.target.value)}
                className="w-full rounded-lg border border-slate-300 px-4 py-3 outline-none focus:border-blue-600"
                placeholder="What does your business do?"
              />
            </div>

            <div>
              <label
                htmlFor="contactEmail"
                className="mb-2 block text-sm font-medium text-slate-700"
              >
                Business contact email (optional)
              </label>
              <input
                id="contactEmail"
                type="email"
                value={contactEmail}
                onChange={(event) => setContactEmail(event.target.value)}
                className="w-full rounded-lg border border-slate-300 px-4 py-3 outline-none focus:border-blue-600"
                placeholder="contact@example.com"
              />
            </div>

            <div>
              <label
                htmlFor="phone"
                className="mb-2 block text-sm font-medium text-slate-700"
              >
                Phone (optional)
              </label>
              <input
                id="phone"
                type="tel"
                value={phone}
                onChange={(event) => setPhone(event.target.value)}
                className="w-full rounded-lg border border-slate-300 px-4 py-3 outline-none focus:border-blue-600"
                placeholder="+91..."
              />
            </div>

            {error && (
              <p role="alert" className="text-sm text-red-700">
                {error}
              </p>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-lg bg-blue-700 px-4 py-3 font-semibold text-white hover:bg-blue-800 disabled:opacity-60"
            >
              {loading ? "Creating..." : "Create business"}
            </button>
          </form>
        </section>

        <section className="mt-10">
          <h2 className="text-xl font-semibold text-slate-900">
            Your existing businesses
          </h2>

          {businesses === undefined ? (
            <p className="mt-4 text-sm text-slate-500">Loading businesses...</p>
          ) : businesses.length === 0 ? (
            <p className="mt-4 rounded-xl border border-dashed border-slate-300 p-6 text-sm text-slate-500">
              No businesses yet. Create your first one above.
            </p>
          ) : (
            <ul className="mt-4 space-y-3">
              {businesses.map((business) => (
                <li
                  key={business._id}
                  className="rounded-xl border border-slate-200 bg-white p-4"
                >
                  <h3 className="font-semibold text-slate-900">
                    {business.name}
                  </h3>
                  <p className="mt-1 text-sm text-slate-500">
                    /{business.slug}
                  </p>
                  {business.description && (
                    <p className="mt-2 text-sm text-slate-600">
                      {business.description}
                    </p>
                  )}
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>
    </main>
  );
}
