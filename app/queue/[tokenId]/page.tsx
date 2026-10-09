"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useMutation, useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import { Badge, Button, Card, Logo, Spinner } from "@/components/ui";

export default function TokenPage() {
  const params = useParams<{ tokenId: string }>();
  const tokenId = params.tokenId as Id<"queueTokens">;
  const token = useQuery(api.queues.getToken, { tokenId });
  const leave = useMutation(api.queues.leave);
  if (token === undefined)
    return (
      <div className="grid min-h-screen place-items-center bg-[#f8fbf8]">
        <Spinner />
      </div>
    );
  if (!token || !token.queue)
    return (
      <div className="grid min-h-screen place-items-center text-center">
        <div>
          <h1 className="text-2xl font-bold">Ticket not found</h1>
          <Link href="/" className="mt-4 inline-block text-[#e85d3f]">
            Back home
          </Link>
        </div>
      </div>
    );
  const position = token.position ?? 1;
  const active = ["WAITING", "CALLED", "SERVING"].includes(token.status);
  return (
    <main className="min-h-screen bg-[#f8fbf8] px-5 py-6 text-[#183b45]">
      <nav className="mx-auto flex max-w-3xl items-center justify-between">
        <Link href="/">
          <Logo />
        </Link>
        <Link
          href={`/business/${token.queue.businessId}`}
          className="text-sm font-semibold text-[#617c80]"
        >
          ← Business page
        </Link>
      </nav>
      <div className="mx-auto max-w-2xl py-16">
        <div className="text-center">
          <Badge tone={active ? "green" : "gray"}>
            {active ? "● Live ticket" : token.status}
          </Badge>
          <h1 className="mt-5 text-3xl font-bold">You&apos;re in line</h1>
          <p className="mt-2 text-[#789095]">{token.queue.name}</p>
        </div>
        <Card className="mt-8 overflow-hidden">
          <div className="bg-[#183b45] px-6 py-10 text-center text-white">
            <p className="text-sm font-semibold uppercase tracking-[.18em] text-[#b8d0cb]">
              Your ticket number
            </p>
            <p className="mt-3 text-8xl font-bold tracking-[-.07em] text-[#ffb29e]">
              {token.tokenNumber}
            </p>
            <p className="mt-3 text-[#b8d0cb]">
              {token.status === "WAITING"
                ? "We&apos;ll notify you when it&apos;s your turn."
                : token.status === "CALLED"
                  ? "Please head to the counter now."
                  : token.status === "SERVING"
                    ? "You&apos;re being served."
                    : "This ticket is no longer active."}
            </p>
          </div>
          <div className="grid grid-cols-2 divide-x divide-[#edf2ef] p-6 text-center">
            <div>
              <p className="text-3xl font-bold">
                {active ? Math.max(0, position - 1) : "—"}
              </p>
              <p className="mt-1 text-sm text-[#789095]">people ahead</p>
            </div>
            <div>
              <p className="text-3xl font-bold">
                {active ? `${token.estimatedWaitTime}m` : "—"}
              </p>
              <p className="mt-1 text-sm text-[#789095]">estimated wait</p>
            </div>
          </div>
        </Card>
        {token.status === "WAITING" && (
          <div className="mt-6 text-center">
            <Button variant="danger" onClick={() => void leave({ tokenId })}>
              Leave queue
            </Button>
          </div>
        )}
        <p className="mt-8 text-center text-xs leading-5 text-[#86a09d]">
          This page updates automatically as the queue moves. Keep it open or
          allow notifications.
        </p>
      </div>
    </main>
  );
}
