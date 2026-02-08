import * as Location from "expo-location";

function formatAddress(a) {
  if (!a) return null;
  const parts = [
    a.name,
    a.street,
    a.district,
    a.city,
    a.region,
    a.country
  ].filter(Boolean);
  return parts.join(", ");
}

function withTimeout(promise, ms, label = "timeout") {
  return Promise.race([
    promise,
    new Promise((_, reject) => setTimeout(() => reject(new Error(label)), ms)),
  ]);
}

/**
 * Requests permission and returns { lat, lng, address }.
 * If denied or location services off or timeout -> returns null.
 */
export async function getDeviceLocationOrNull({ timeoutMs = 12000, force = false } = {}) {
  try {
    const services = await Location.hasServicesEnabledAsync().catch(() => true);
    if (!services) return null;

    let { status } = await Location.getForegroundPermissionsAsync();
    if (status !== "granted" || force) {
      const res = await withTimeout(Location.requestForegroundPermissionsAsync(), timeoutMs, "permission_timeout");
      status = res.status;
    }
    if (status !== "granted") return null;

    let pos = null;
    try {
      pos = await withTimeout(
        Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced }),
        timeoutMs,
        "position_timeout"
      );
    } catch {
      pos = await Location.getLastKnownPositionAsync();
    }

    const lat = pos?.coords?.latitude;
    const lng = pos?.coords?.longitude;

    if (typeof lat !== "number" || typeof lng !== "number") return null;

    let address = null;
    try {
      const rev = await withTimeout(Location.reverseGeocodeAsync({ latitude: lat, longitude: lng }), timeoutMs, "geocode_timeout");
      if (rev && rev[0]) address = formatAddress(rev[0]);
    } catch {
    }

    return {
      lat,
      lng,
      address: address || "Cari lokasiya",
    };
  } catch {
    return null;
  }
}
