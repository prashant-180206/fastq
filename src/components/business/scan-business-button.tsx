"use client";

import { useCallback, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { QrScanner } from "@/components/qrcode/QrScanner";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { notifyError } from "@/lib/toast";
import { QrCodeIcon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";

function parseBusinessId(value: string): string | null {
  try {
    const url = new URL(value, typeof window !== "undefined" ? window.location.origin : "http://localhost");
    const match = url.pathname.match(/^\/b\/([^/]+)\/?$/);
    return match ? match[1] : null;
  } catch {
    return null;
  }
}

export function ScanBusinessButton() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const handledRef = useRef(false);

  const handleScan = useCallback(
    (value: string) => {
      if (handledRef.current) {
        return;
      }

      const businessId = parseBusinessId(value);

      if (!businessId) {
        notifyError("That QR code does not point to a FastQ business.");
        return;
      }

      handledRef.current = true;
      router.push(`/b/${businessId}`);
    },
    [router],
  );

  const handleError = useCallback((message: string) => {
    notifyError(`Camera problem: ${message}`);
  }, []);

  return (
    <Sheet
      open={open}
      onOpenChange={(next) => {
        setOpen(next);
        if (!next) {
          handledRef.current = false;
        }
      }}
    >
      <Button
        type="button"
        variant="outline"
        className="shrink-0"
        onClick={() => setOpen(true)}
      >
        <HugeiconsIcon icon={QrCodeIcon} strokeWidth={2} />
        Scan QR
      </Button>

      <SheetContent side="bottom" className="mx-auto w-full gap-4 px-4 pt-6 sm:max-w-md sm:rounded-t-3xl">
        <SheetHeader className="p-0 text-center">
          <SheetTitle>Scan a business QR</SheetTitle>
          <SheetDescription>
            Point your camera at the QR code printed or shown by a business to
            open it directly.
          </SheetDescription>
        </SheetHeader>

        <div className="flex items-center justify-center">
          {open ? <QrScanner onScan={handleScan} onError={handleError} /> : null}
        </div>
      </SheetContent>
    </Sheet>
  );
}