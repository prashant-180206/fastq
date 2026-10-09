"use client";

import Link from "next/link";
import { ArrowRight, Building2, MapPin } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

type Business = {
  _id: string;
  name: string;
  description?: string;
  type: string;
  city: string;
  address: string;
  logoUrl?: string;
  isActive: boolean;
};

type Props = {
  business: Business;
};

export function BusinessCard({ business }: Props) {
  return (
    <Card className="overflow-hidden transition-shadow hover:shadow-md">
      {/* Business visual */}
      <div className="relative aspect-2/1 overflow-hidden bg-muted">
        {business.logoUrl ? (
          <img
            src={business.logoUrl}
            alt={`${business.name} logo`}
            className="h-full w-full object-cover"
          />
        ) : (
          <div className="flex h-full items-center justify-center">
            <Building2 className="size-12 text-muted-foreground/30" />
          </div>
        )}
      </div>

      <CardContent className="p-5">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <h3 className="truncate text-lg font-semibold">{business.name}</h3>

            <p className="mt-1 text-sm text-muted-foreground">
              {business.type}
            </p>
          </div>

          <span className="shrink-0 rounded-full bg-emerald-100 px-2.5 py-1 text-xs font-medium text-emerald-700">
            Available
          </span>
        </div>

        {business.description && (
          <p className="mt-3 line-clamp-2 text-sm leading-6 text-muted-foreground">
            {business.description}
          </p>
        )}

        <div className="mt-4 flex items-start gap-2 text-sm text-muted-foreground">
          <MapPin className="mt-0.5 size-4 shrink-0" />

          <div className="min-w-0">
            <p className="truncate">{business.address}</p>
            <p>{business.city}</p>
          </div>
        </div>

        <Button className="mt-5 w-full">
          <Link href={`/b/${business._id}`}>
            View business
            <ArrowRight className="ml-2 size-4" />
          </Link>
        </Button>
      </CardContent>
    </Card>
  );
}
