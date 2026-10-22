"use client";

import Link from "next/link";
import { use, useState } from "react";
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
import { buttonVariants } from "@/components/ui/button";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty";
import { Skeleton } from "@/components/ui/skeleton";
import { Spinner } from "@/components/ui/spinner";
import { useNow } from "@/hooks/use-now";
import { formatDateTimeIST } from "@/lib/format";
import { notifyError, notifySuccess } from "@/lib/toast";
import { PageHeader } from "@/components/customer/page-header";
import {
  Cancel01Icon,
  CheckmarkCircle01Icon,
  Megaphone01Icon,
  Queue02Icon,
} from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import { cn } from "cn";

type PageProps = {
  params: Promise<{ tokenId: string }>;
};

const cancellableStatuses = ["waiting", "called", "checked_in"];

function titleCase(value: string) {
  return value.replaceAll("_", " ").replace(/\b\w/g, (c) => c.toUpperCase());
}

function statusVariant(status: string): "default" | "secondary" | "outline" {
  if (["called", "serving", "checked_in"].includes(status)) {
    return "secondary";
  }
  if (["waiting", "completed"].includes(status)) {
    return "default";
  }
  return "outline";
}

function DetailRow({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <div>
      <p className="text-sm text-muted-foreground">{label}</p>
      <p className="mt-1 font-medium">{value}</p>
    </div>
  );
}

export default function CustomerQueueTokenPage({ params }: PageProps) {
  const { tokenId } = use(params);
  const tokenIdRef = tokenId as Id<"queueTokens">;

  const token = useQuery(api.business.queueCapacity.getMyTokenById, {
    tokenId: tokenIdRef,
  });
  const businesses = useQuery(api.business.data.getAll, {});

  const now = useNow(30_000);
  const broadcasts = useQuery(api.business.broadcasts.getActiveForToken, {
    tokenId: tokenIdRef,
    now,
  });

  const checkIn = useMutation(api.business.queueCapacity.checkInToken);
  const cancel = useMutation(api.business.queueCapacity.cancelToken);

  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [confirmOpen, setConfirmOpen] = useState(false);

  async function handleCheckIn() {
    setBusy(true);
    setError("");

    try {
      await checkIn({ tokenId: tokenIdRef });
      notifySuccess("Checked in");
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Unable to check in.";
      setError(message);
      notifyError(message);
    } finally {
      setBusy(false);
    }
  }

  async function handleCancel() {
    setBusy(true);
    setError("");

    try {
      await cancel({ tokenId: tokenIdRef });
      notifySuccess("Queue token cancelled");
      setConfirmOpen(false);
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Unable to cancel the token.";
      setError(message);
      notifyError(message);
      setConfirmOpen(false);
    } finally {
      setBusy(false);
    }
  }

  if (token === undefined) {
    return (
      <div className="flex flex-col gap-6">
        <PageHeader
          title="Queue token"
          subtitle="Loading your token details…"
          backHref="/customer/queue"
          backLabel="My queue tokens"
        />
        <Card>
          <CardContent className="gap-3">
            <Skeleton className="h-6 w-32 rounded-full" />
            <div className="grid gap-4 sm:grid-cols-2">
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-full" />
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (token === null) {
    return (
      <div className="flex flex-col gap-6">
        <Empty>
          <EmptyContent>
            <EmptyMedia variant="icon">
              <HugeiconsIcon icon={Queue02Icon} strokeWidth={2} />
            </EmptyMedia>
            <EmptyTitle>Token not found</EmptyTitle>
            <EmptyDescription>
              This token may not exist or may not belong to your account.
            </EmptyDescription>
          </EmptyContent>
          <Link
            href="/customer/queue"
            className={cn(buttonVariants({ size: "sm" }))}
          >
            Return to my queues
          </Link>
        </Empty>
      </div>
    );
  }

  const business = businesses?.find(
    (entry) => entry._id === token.businessId,
  );
  const canCheckIn = token.status === "called";
  const canCancel = cancellableStatuses.includes(token.status);

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title={`Queue token #${token.tokenNumber}`}
        subtitle={
          business
            ? `${business.name} — joined ${formatDateTimeIST(token.joinedAt)}`
            : `Joined ${formatDateTimeIST(token.joinedAt)}`
        }
        backHref="/customer/queue"
        backLabel="My queue tokens"
      />

      <Card>
        <CardContent className="flex flex-col gap-5">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <span className="text-sm text-muted-foreground">
              Current status
            </span>
            <Badge
              variant={statusVariant(token.status)}
              className="h-6 rounded-full capitalize"
            >
              {titleCase(token.status)}
            </Badge>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <DetailRow label="Token number" value={`#${token.tokenNumber}`} />
            <DetailRow
              label="Joined"
              value={formatDateTimeIST(token.joinedAt)}
            />
            <DetailRow
              label="Called at"
              value={
                token.calledAt
                  ? formatDateTimeIST(token.calledAt)
                  : "—"
              }
            />
            <DetailRow
              label="Check-in time"
              value={
                token.checkedInAt
                  ? formatDateTimeIST(token.checkedInAt)
                  : "—"
              }
            />
            <DetailRow
              label="Service started"
              value={
                token.serviceStartedAt
                  ? formatDateTimeIST(token.serviceStartedAt)
                  : "—"
              }
            />
            <DetailRow
              label="Completed at"
              value={
                token.completedAt
                  ? formatDateTimeIST(token.completedAt)
                  : "—"
              }
            />
          </div>

          {token.graceDeadlineAt !== undefined && token.status === "called" && (
            <div className="rounded-lg border p-3">
              <p className="text-sm text-muted-foreground">
                Check-in deadline
              </p>
              <p className="mt-1 font-medium">
                {formatDateTimeIST(token.graceDeadlineAt)}
              </p>
            </div>
          )}

          {token.customerNote ? (
            <div>
              <p className="text-sm text-muted-foreground">Your note</p>
              <p className="mt-1 whitespace-pre-wrap">{token.customerNote}</p>
            </div>
          ) : null}

          <div className="flex flex-wrap gap-3 border-t pt-4">
            {canCheckIn && (
              <Button
                type="button"
                disabled={busy}
                onClick={handleCheckIn}
              >
                {busy ? (
                  <>
                    <Spinner />
                    Checking in…
                  </>
                ) : (
                  <>
                    <HugeiconsIcon
                      icon={CheckmarkCircle01Icon}
                      strokeWidth={2}
                      data-icon="inline-start"
                    />
                    Check in now
                  </>
                )}
              </Button>
            )}

            {canCancel && (
              <Button
                type="button"
                variant="outline"
                disabled={busy}
                onClick={() => setConfirmOpen(true)}
              >
                <HugeiconsIcon
                  icon={Cancel01Icon}
                  strokeWidth={2}
                  data-icon="inline-start"
                />
                Cancel token
              </Button>
            )}

            {!canCheckIn && !canCancel && (
              <p className="text-sm text-muted-foreground">
                No customer actions are available for this token status.
              </p>
            )}
          </div>

          {error && (
            <p role="alert" className="text-sm text-destructive">
              {error}
            </p>
          )}
        </CardContent>
      </Card>

      {broadcasts && broadcasts.length > 0 ? (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <HugeiconsIcon
                icon={Megaphone01Icon}
                strokeWidth={2}
                className="size-5 text-primary"
              />
              Announcements
            </CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col gap-3">
            {broadcasts.map((broadcast) => (
              <div
                key={broadcast._id}
                className="rounded-lg border border-primary/20 bg-primary/5 p-3"
              >
                <p className="whitespace-pre-wrap text-sm">
                  {broadcast.message}
                </p>
                <p className="mt-1 text-xs text-muted-foreground">
                  Until {formatDateTimeIST(broadcast.expiresAt)}
                </p>
              </div>
            ))}
          </CardContent>
        </Card>
      ) : null}

      {business && (
        <Card size="sm">
          <CardContent className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="text-sm text-muted-foreground">Business</p>
              <p className="mt-1 font-semibold">{business.name}</p>
            </div>
            <Link
              href={`/b/${business._id}`}
              className={cn(
                buttonVariants({ variant: "outline", size: "sm" }),
              )}
            >
              View business
            </Link>
          </CardContent>
        </Card>
      )}

      <AlertDialog
        open={confirmOpen}
        onOpenChange={(open) => {
          if (!open) {
            setConfirmOpen(false);
          }
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogMedia>
              <HugeiconsIcon icon={Cancel01Icon} strokeWidth={2} />
            </AlertDialogMedia>
            <AlertDialogTitle>Cancel this queue token?</AlertDialogTitle>
            <AlertDialogDescription>
              Cancelling removes you from the queue. This action cannot be
              undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Keep token</AlertDialogCancel>
            <AlertDialogAction variant="destructive" onClick={handleCancel}>
              Cancel token
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}