// ─────────────────────────────────────────────────────────
// Geolocation Utility – Haversine distance calculation
// ─────────────────────────────────────────────────────────

const EARTH_RADIUS_M = 6_371_000; // metres

/**
 * Convert degrees to radians.
 */
function toRad(deg) {
  return (deg * Math.PI) / 180;
}

/**
 * Calculate the Haversine distance between two lat/lng points.
 * @param {number} lat1 - Latitude of point 1
 * @param {number} lng1 - Longitude of point 1
 * @param {number} lat2 - Latitude of point 2
 * @param {number} lng2 - Longitude of point 2
 * @returns {number} Distance in metres
 */
export function haversineDistance(lat1, lng1, lat2, lng2) {
  const dLat = toRad(lat2 - lat1);
  const dLng = toRad(lng2 - lng1);

  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLng / 2) ** 2;

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return EARTH_RADIUS_M * c;
}

/**
 * Check if a point is within a given radius of a campus location.
 * @param {number} studentLat
 * @param {number} studentLng
 * @param {number} campusLat
 * @param {number} campusLng
 * @param {number} radiusMetres - Default 100m
 * @returns {{ within: boolean, distance: number }}
 */
export function isWithinCampus(studentLat, studentLng, campusLat, campusLng, radiusMetres = 100) {
  const distance = haversineDistance(studentLat, studentLng, campusLat, campusLng);

  return {
    within: distance <= radiusMetres,
    distance: Math.round(distance)
  };
}
