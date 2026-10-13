import { api } from "@/../convex/_generated/api";
import type { FunctionReturnType } from "convex/server";
import { ShareBusinessPopover } from "@/components/business/share-business-popover";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { buttonVariants } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { CallIcon, Mail01Icon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import { cn } from "cn";

type Business = NonNullable<
  FunctionReturnType<typeof api.business.data.getPublicById>
>;

export function BusinessProfileHeader({
  business,
}: {
  business: Business;
}) {
  return (
    <Card className="overflow-hidden">
      <CardContent className="flex flex-col gap-5 p-6 sm:flex-row sm:items-start">
        <Avatar size="lg" className="size-20 rounded-2xl text-2xl">
          {business.logoUrl ? (
            <AvatarImage
              src={business.logoUrl}
              alt={`${business.name} logo`}
              className="rounded-2xl"
            />
          ) : null}
          <AvatarFallback className="rounded-2xl text-2xl">
            {business.name.charAt(0).toUpperCase()}
          </AvatarFallback>
        </Avatar>

        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <h1 className="min-w-0 text-3xl font-bold tracking-tight">
              {business.name}
            </h1>
            <ShareBusinessPopover
              businessId={business._id}
              businessName={business.name}
            />
          </div>

          {business.description ? (
            <p className="mt-4 max-w-2xl whitespace-pre-wrap text-muted-foreground">
              {business.description}
            </p>
          ) : null}

          {business.phone || business.contactEmail ? (
            <div className="mt-5 flex flex-wrap gap-3">
              {business.phone ? (
                <a
                  href={`tel:${business.phone}`}
                  className={cn(buttonVariants({ variant: "outline", size: "sm" }))}
                >
                  <HugeiconsIcon icon={CallIcon} strokeWidth={2} />
                  Call business
                </a>
              ) : null}
              {business.contactEmail ? (
                <a
                  href={`mailto:${business.contactEmail}`}
                  className={cn(buttonVariants({ variant: "outline", size: "sm" }))}
                >
                  <HugeiconsIcon icon={Mail01Icon} strokeWidth={2} />
                  Email business
                </a>
              ) : null}
            </div>
          ) : null}
        </div>
      </CardContent>
    </Card>
  );
}