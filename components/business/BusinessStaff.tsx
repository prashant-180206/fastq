"use client";

import { useState } from "react";
import { useMutation, useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import type { Id } from "@/convex/_generated/dataModel";

import {
  AlertCircle,
  Loader2,
  Plus,
  Shield,
  UserMinus,
  Users,
} from "lucide-react";

import { Button } from "@/components/ui/button";

type Role = "OWNER" | "MANAGER" | "STAFF";

interface BusinessStaffProps {
  businessId: string;
}

function roleLabel(role: Role) {
  switch (role) {
    case "OWNER":
      return "Owner";
    case "MANAGER":
      return "Manager";
    case "STAFF":
      return "Staff";
  }
}

function roleClass(role: Role) {
  switch (role) {
    case "OWNER":
      return "border-primary/30 bg-primary/10 text-primary";

    case "MANAGER":
      return "border-blue-500/30 bg-blue-500/10 text-blue-700 dark:text-blue-400";

    case "STAFF":
      return "border-border bg-muted text-muted-foreground";
  }
}

function getErrorMessage(error: unknown) {
  return error instanceof Error ? error.message : "Something went wrong.";
}

export default function BusinessStaff({ businessId }: BusinessStaffProps) {
  const businessIdTyped = businessId as Id<"businesses">;

  const members = useQuery(api.businesses.getMembers, {
    businessId: businessIdTyped,
  });

  const addMember = useMutation(api.businesses.addMember);
  const removeMember = useMutation(api.businesses.removeMember);

  const [dialogOpen, setDialogOpen] = useState(false);

  const [userId, setUserId] = useState("");
  const [role, setRole] = useState<"MANAGER" | "STAFF">("STAFF");

  const [adding, setAdding] = useState(false);
  const [removingUserId, setRemovingUserId] = useState<string | null>(null);

  const [error, setError] = useState<string | null>(null);

  async function handleAddMember() {
    if (!userId.trim()) {
      setError("User ID is required.");
      return;
    }

    setAdding(true);
    setError(null);

    try {
      await addMember({
        businessId: businessIdTyped,
        userId: userId.trim() as Id<"users">,
        role,
      });

      setUserId("");
      setRole("STAFF");
      setDialogOpen(false);
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setAdding(false);
    }
  }

  async function handleRemoveMember(
    memberUserId: Id<"users">,
    displayName: string,
  ) {
    const confirmed = window.confirm(
      `Remove ${displayName} from this business?`,
    );

    if (!confirmed) return;

    setRemovingUserId(memberUserId);
    setError(null);

    try {
      await removeMember({
        businessId: businessIdTyped,
        userId: memberUserId,
      });
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setRemovingUserId(null);
    }
  }

  if (members === undefined) {
    return (
      <div className="mx-auto w-full max-w-5xl space-y-6 p-4 sm:p-6">
        <div className="space-y-2">
          <div className="h-8 w-44 animate-pulse rounded bg-muted" />
          <div className="h-5 w-72 animate-pulse rounded bg-muted" />
        </div>

        <div className="overflow-hidden rounded-xl border">
          {Array.from({ length: 4 }).map((_, index) => (
            <div
              key={index}
              className="flex h-20 animate-pulse items-center gap-4 border-b px-5 last:border-b-0"
            >
              <div className="h-10 w-10 rounded-full bg-muted" />

              <div className="space-y-2">
                <div className="h-4 w-36 rounded bg-muted" />
                <div className="h-3 w-24 rounded bg-muted" />
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  const activeMembers = members.filter((item) => item.membership.isActive);

  const owners = activeMembers.filter(
    (item) => item.membership.role === "OWNER",
  );

  const managers = activeMembers.filter(
    (item) => item.membership.role === "MANAGER",
  );

  const staff = activeMembers.filter(
    (item) => item.membership.role === "STAFF",
  );

  return (
    <div className="mx-auto w-full max-w-5xl space-y-6 p-4 sm:p-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <div className="flex items-center gap-2">
            <Users className="h-6 w-6 text-primary" />

            <h1 className="text-2xl font-semibold tracking-tight">Staff</h1>
          </div>

          <p className="mt-1 text-sm text-muted-foreground">
            Manage the people who can operate this business.
          </p>
        </div>

        <Button
          type="button"
          onClick={() => {
            setError(null);
            setUserId("");
            setRole("STAFF");
            setDialogOpen(true);
          }}
        >
          <Plus className="mr-2 h-4 w-4" />
          Add member
        </Button>
      </div>

      {/* Error */}
      {error && (
        <div className="flex items-start gap-3 rounded-lg border border-destructive/30 bg-destructive/5 p-4 text-sm text-destructive">
          <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />

          <div className="flex-1">
            <p className="font-medium">Staff action failed</p>

            <p className="mt-1 opacity-90">{error}</p>
          </div>

          <button
            type="button"
            onClick={() => setError(null)}
            className="text-xs underline"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* Summary */}
      <div className="grid gap-4 sm:grid-cols-3">
        <SummaryCard label="Owners" value={owners.length} />

        <SummaryCard label="Managers" value={managers.length} />

        <SummaryCard label="Staff" value={staff.length} />
      </div>

      {/* Members */}
      <section className="overflow-hidden rounded-xl border bg-card">
        <div className="border-b p-5">
          <h2 className="font-semibold">Business members</h2>

          <p className="mt-1 text-sm text-muted-foreground">
            {activeMembers.length} active{" "}
            {activeMembers.length === 1 ? "member" : "members"}
          </p>
        </div>

        {activeMembers.length === 0 ? (
          <div className="p-10 text-center">
            <Users className="mx-auto h-10 w-10 text-muted-foreground" />

            <p className="mt-3 font-medium">No active members</p>

            <p className="mt-1 text-sm text-muted-foreground">
              Add someone to start building your business team.
            </p>
          </div>
        ) : (
          <div className="divide-y">
            {activeMembers.map(({ membership, user }) => {
              const role = membership.role as Role;

              const displayName = user?.name || user?.email || "Unnamed user";

              const initials = displayName
                .split(" ")
                .map((part) => part.charAt(0))
                .join("")
                .slice(0, 2)
                .toUpperCase();

              const isOwner = role === "OWNER";

              return (
                <div
                  key={membership._id}
                  className="flex flex-col gap-4 p-5 sm:flex-row sm:items-center sm:justify-between"
                >
                  <div className="flex min-w-0 items-center gap-4">
                    {/* Avatar */}
                    <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-primary/10 text-sm font-semibold text-primary">
                      {initials || <Users className="h-5 w-5" />}
                    </div>

                    {/* User info */}
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <p className="truncate font-medium">{displayName}</p>

                        <span
                          className={[
                            "rounded-full border px-2 py-0.5 text-[11px] font-medium",
                            roleClass(role),
                          ].join(" ")}
                        >
                          {roleLabel(role)}
                        </span>
                      </div>

                      {user?.email && user.name && (
                        <p className="mt-1 truncate text-sm text-muted-foreground">
                          {user.email}
                        </p>
                      )}

                      <p className="mt-1 truncate font-mono text-[11px] text-muted-foreground">
                        {membership.userId}
                      </p>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex shrink-0 items-center gap-2">
                    {isOwner ? (
                      <div className="flex items-center gap-2 rounded-md bg-muted px-3 py-2 text-xs text-muted-foreground">
                        <Shield className="h-3.5 w-3.5" />
                        Owner
                      </div>
                    ) : (
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        disabled={removingUserId === membership.userId}
                        onClick={() =>
                          handleRemoveMember(membership.userId, displayName)
                        }
                      >
                        {removingUserId === membership.userId ? (
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        ) : (
                          <UserMinus className="mr-2 h-4 w-4" />
                        )}
                        Remove
                      </Button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>

      {/* Role explanation */}
      <section className="rounded-xl border bg-muted/30 p-5">
        <h2 className="font-semibold">Roles</h2>

        <div className="mt-4 grid gap-4 md:grid-cols-3">
          <RoleDescription
            role="OWNER"
            description="Full business control, including removing members."
          />

          <RoleDescription
            role="MANAGER"
            description="Can manage operational areas and add staff members."
          />

          <RoleDescription
            role="STAFF"
            description="Can operate queues and other staff-level workflows."
          />
        </div>
      </section>

      {/* Add member dialog */}
      {dialogOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div
            role="dialog"
            aria-modal="true"
            className="w-full max-w-lg rounded-xl border bg-background p-6 shadow-xl"
          >
            <div>
              <h2 className="text-lg font-semibold">Add business member</h2>

              <p className="mt-1 text-sm text-muted-foreground">
                Add an existing Quiskip user to this business.
              </p>
            </div>

            <div className="mt-6 space-y-5">
              <div className="space-y-2">
                <label className="text-sm font-medium">User ID</label>

                <input
                  value={userId}
                  onChange={(event) => setUserId(event.target.value)}
                  placeholder="Paste the Convex user ID"
                  disabled={adding}
                  className="h-10 w-full rounded-md border bg-background px-3 font-mono text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
                />

                <p className="text-xs text-muted-foreground">
                  Your current backend accepts a Convex <code>users</code> ID
                  here. There is currently no email/user search mutation in the
                  supplied backend.
                </p>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Role</label>

                <select
                  value={role}
                  onChange={(event) =>
                    setRole(event.target.value as "MANAGER" | "STAFF")
                  }
                  disabled={adding}
                  className="h-10 w-full rounded-md border bg-background px-3 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
                >
                  <option value="STAFF">Staff</option>

                  <option value="MANAGER">Manager</option>
                </select>
              </div>
            </div>

            <div className="mt-6 flex justify-end gap-2">
              <Button
                type="button"
                variant="ghost"
                disabled={adding}
                onClick={() => setDialogOpen(false)}
              >
                Cancel
              </Button>

              <Button type="button" disabled={adding} onClick={handleAddMember}>
                {adding && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}

                {adding ? "Adding..." : "Add member"}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function SummaryCard({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-xl border bg-card p-5">
      <p className="text-sm text-muted-foreground">{label}</p>

      <p className="mt-2 text-3xl font-semibold tracking-tight">{value}</p>
    </div>
  );
}

function RoleDescription({
  role,
  description,
}: {
  role: Role;
  description: string;
}) {
  return (
    <div className="rounded-lg border bg-background p-4">
      <span
        className={[
          "inline-flex rounded-full border px-2.5 py-1 text-xs font-medium",
          roleClass(role),
        ].join(" ")}
      >
        {roleLabel(role)}
      </span>

      <p className="mt-3 text-sm leading-6 text-muted-foreground">
        {description}
      </p>
    </div>
  );
}
