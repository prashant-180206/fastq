"use client";

import Link from "next/link";
import { MapContainer, Marker, Popup, TileLayer } from "react-leaflet";
import L from "leaflet";
import { useMemo } from "react";
import "leaflet/dist/leaflet.css";
import { businessTypeLabel } from "@/lib/business-type";

type MapBusiness = {
  _id: string;
  name: string;
  description: string | undefined;
  type: string;
  location: { latitude: number; longitude: number } | undefined;
};

const DEFAULT_CENTER: [number, number] = [20.5937, 78.9629];

type LocatedBusiness = MapBusiness & {
  location: { latitude: number; longitude: number };
};

function isLocated(business: MapBusiness): business is LocatedBusiness {
  return business.location !== undefined;
}

function buildIcon() {
  return L.divIcon({
    className: "business-map-marker",
    html: '<div class="flex h-8 w-8 items-center justify-center rounded-full border-2 border-background bg-primary text-[11px] font-bold text-primary-foreground shadow-lg">B</div>',
    iconAnchor: [16, 16],
    popupAnchor: [0, -16],
  });
}

export function BusinessMap({
  businesses,
  center,
}: {
  businesses: MapBusiness[];
  center?: { latitude: number; longitude: number } | null;
}) {
  const located = businesses.filter(isLocated);
  const icon = useMemo(() => buildIcon(), []);

  const mapCenter: [number, number] = center
    ? [center.latitude, center.longitude]
    : located[0]
      ? [located[0].location.latitude, located[0].location.longitude]
      : DEFAULT_CENTER;

  return (
    <MapContainer
      center={mapCenter}
      zoom={center ? 12 : located.length === 0 ? 5 : 11}
      scrollWheelZoom
      className="h-full w-full"
    >
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
      {located.map((business) => (
        <Marker
          key={business._id}
          position={[business.location.latitude, business.location.longitude]}
          icon={icon}
        >
          <Popup>
            <div className="w-52 space-y-1.5">
              <p className="line-clamp-1 text-sm font-semibold">{business.name}</p>
              <p className="line-clamp-2 text-xs text-muted-foreground">
                {business.description ?? "No description yet."}
              </p>
              <p className="text-xs font-medium capitalize text-primary">
                {businessTypeLabel(business.type)}
              </p>
              <Link
                href={`/b/${business._id}`}
                className="block text-xs font-semibold text-primary underline-offset-4 hover:underline"
              >
                View business →
              </Link>
            </div>
          </Popup>
        </Marker>
      ))}
    </MapContainer>
  );
}