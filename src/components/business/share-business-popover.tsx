"use client";

import { useState } from "react";
import { QrCode } from "@/components/qrcode/QrCode";
import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverDescription,
  PopoverHeader,
  PopoverTitle,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  CheckmarkCircle01Icon,
  Copy01Icon,
  QrCodeIcon,
} from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";

interface ShareBusinessPopoverProps {
  businessId: string;
  businessName: string;
}

export function ShareBusinessPopover({
  businessId,
  businessName,
}: ShareBusinessPopoverProps) {
  const [url, setUrl] = useState("");
  const [copied, setCopied] = useState(false);

  const buildUrl = () => {
    if (!url) {
      setUrl(`${window.location.origin}/b/${businessId}`);
    }
  };

  const copyLink = async () => {
    if (!url) {
      return;
    }

    await navigator.clipboard.writeText(url);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  return (
    <Popover onOpenChange={(open) => (open ? buildUrl() : undefined)}>
      <PopoverTrigger render={<Button variant="outline" size="sm" />}>
        <HugeiconsIcon icon={QrCodeIcon} strokeWidth={2} />
        Scan / Share
      </PopoverTrigger>
      <PopoverContent align="end" className="w-80">
        {url ? (
          <div className="flex items-center justify-center rounded-2xl bg-white p-4 ring-1 ring-foreground/5">
            <QrCode value={url} />
          </div>
        ) : (
          <div className="h-[228px] animate-pulse rounded-2xl bg-muted" />
        )}

        <PopoverHeader>
          <PopoverTitle>Share {businessName}</PopoverTitle>
          <PopoverDescription>
            Scan the code to open this business on another device, or copy the
            link.
          </PopoverDescription>
        </PopoverHeader>

        <div className="flex items-center gap-2">
          <div className="min-w-0 flex-1 truncate rounded-xl bg-muted px-3 py-2 font-mono text-xs text-muted-foreground">
            {url}
          </div>
          <Button variant="outline" size="sm" onClick={copyLink}>
            {copied ? (
              <HugeiconsIcon
                icon={CheckmarkCircle01Icon}
                strokeWidth={2}
                className="text-primary"
              />
            ) : (
              <HugeiconsIcon icon={Copy01Icon} strokeWidth={2} />
            )}
            {copied ? "Copied" : "Copy"}
          </Button>
        </div>
      </PopoverContent>
    </Popover>
  );
}