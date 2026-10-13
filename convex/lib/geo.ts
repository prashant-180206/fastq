export type GeoPoint = {
  latitude: number;
  longitude: number;
};

export type BoundingBox = {
  minLatitude: number;
  maxLatitude: number;
  minLongitude: number;
  maxLongitude: number;
};

// Approximate kilometres per degree of latitude (constant across the globe).
const KM_PER_DEGREE_LATITUDE = 111.32;

/**
 * Convert a centre point and radius (km) into a bounding rectangle expressed
 * as latitude/longitude limits. Searching with these axis-aligned limits
 * (a box, not a euclidean circle) keeps the query cheap and indexable, which
 * is preferable to filtering by exact great-circle distance.
 */
export function boundingBox(
  center: GeoPoint,
  radiusKm: number,
): BoundingBox {
  const dLat = radiusKm / KM_PER_DEGREE_LATITUDE;

  // Longitude degrees shrink towards the poles, so widen the box there.
  const cosLat = Math.max(
    Math.cos((center.latitude * Math.PI) / 180),
    0.01,
  );
  const dLng = radiusKm / (KM_PER_DEGREE_LATITUDE * cosLat);

  const minLatitude = Math.max(center.latitude - dLat, -90);
  const maxLatitude = Math.min(center.latitude + dLat, 90);
  const minLongitude = Math.max(center.longitude - dLng, -180);
  const maxLongitude = Math.min(center.longitude + dLng, 180);

  return { minLatitude, maxLatitude, minLongitude, maxLongitude };
}

/** Straight-line (haversine) distance in kilometres between two points. */
export function distanceKm(a: GeoPoint, b: GeoPoint): number {
  const toRadians = (degrees: number) => (degrees * Math.PI) / 180;

  const dLat = toRadians(b.latitude - a.latitude);
  const dLng = toRadians(b.longitude - a.longitude);
  const lat1 = toRadians(a.latitude);
  const lat2 = toRadians(b.latitude);

  const h =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLng / 2) ** 2;

  return 2 * 6371 * Math.asin(Math.sqrt(h));
}