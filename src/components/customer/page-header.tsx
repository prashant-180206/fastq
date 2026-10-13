import Link from "next/link";
import { buttonVariants } from "@/components/ui/button";
import { ArrowLeft01Icon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import { cn } from "cn";

interface PageHeaderProps {
  title: string;
  subtitle?: string;
  backHref?: string;
  backLabel?: string;
  actions?: React.ReactNode;
}

export function PageHeader({
  title,
  subtitle,
  backHref,
  backLabel = "Back",
  actions,
}: PageHeaderProps) {
  return (
    <div className="flex flex-col gap-3">
      {backHref ? (
        <Link
          href={backHref}
          className={cn(
            buttonVariants({ variant: "ghost", size: "sm" }),
            "-ml-2 self-start text-muted-foreground",
          )}
        >
          <HugeiconsIcon
            icon={ArrowLeft01Icon}
            strokeWidth={2}
            data-icon="inline-start"
          />
          {backLabel}
        </Link>
      ) : null}

      <div className="flex flex-wrap items-end justify-between gap-3">
        <div className="min-w-0">
          <h1 className="font-heading text-3xl font-bold tracking-tight">
            {title}
          </h1>
          {subtitle ? (
            <p className="mt-2 max-w-2xl text-muted-foreground">{subtitle}</p>
          ) : null}
        </div>
        {actions ? (
          <div className="flex flex-wrap items-center gap-3">{actions}</div>
        ) : null}
      </div>
    </div>
  );
}