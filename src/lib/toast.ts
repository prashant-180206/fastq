"use client";

import { toast } from "@/components/ui/toast";

export function notifySuccess(
  title: string,
  description?: React.ReactNode,
): void {
  toast.add({
    type: "success",
    title,
    description,
    timeout: 5000,
  });
}

export function notifyError(
  title: string,
  description?: React.ReactNode,
): void {
  toast.add({
    type: "error",
    title,
    description,
    timeout: 6000,
  });
}

export function notifyInfo(
  title: string,
  description?: React.ReactNode,
): void {
  toast.add({
    type: "info",
    title,
    description,
    timeout: 5000,
  });
}