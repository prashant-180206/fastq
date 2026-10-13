export type BrowserCoords = {
  latitude: number;
  longitude: number;
};

const DEFAULT_OPTIONS: PositionOptions = {
  enableHighAccuracy: true,
  timeout: 15000,
  maximumAge: 60000,
};

export function getCurrentPosition(
  options: PositionOptions = DEFAULT_OPTIONS,
): Promise<BrowserCoords> {
  return new Promise((resolve, reject) => {
    if (
      typeof navigator === "undefined" ||
      !("geolocation" in navigator)
    ) {
      reject(new Error("Geolocation is not supported by this browser."));
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) =>
        resolve({
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
        }),
      (err) => reject(new Error(positionErrorMessage(err))),
      options,
    );
  });
}

function positionErrorMessage(err: GeolocationPositionError): string {
  switch (err.code) {
    case err.PERMISSION_DENIED:
      return "Location permission was denied. Allow access to search nearby businesses.";
    case err.POSITION_UNAVAILABLE:
      return "Your current location is unavailable. Try again or filter without a location.";
    default:
      return "Timed out while trying to get your location. Try again.";
  }
}