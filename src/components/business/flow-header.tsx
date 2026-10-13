import Link from "next/link";
import { buttonVariants } from "@/components/ui/button";
import { ArrowLeft01Icon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import { cn } from "cn";

interface FlowHeaderProps {
  businessId: string;
  businessName: string;
  title: string;
  description?: string;
}

export function FlowHeader({
  businessId,
  businessName,
  title,
  description,
}: FlowHeaderProps) {
  return (
    <div>
      <Link
        href={`/b/${businessId}`}
        className={cn(
          buttonVariants({ variant: "ghost", size: "sm" }),
          "-ml-2 text-muted-foreground",
        )}
      >
        <HugeiconsIcon icon={ArrowLeft01Icon} strokeWidth={2} />
        Back to {businessName}
      </Link>

      <div className="mt-3">
        <h1 className="font-heading text-3xl font-bold tracking-tight sm:text-4xl">
          {title}
        </h1>
        {description ? (
          <p className="mt-2 max-w-2xl text-muted-foreground">{description}</p>
        ) : null}
      </div>
    </div>
  );
}