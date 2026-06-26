const EARTH_RADIUS_M = 6_371_000;

function toRad(deg: number): number {
  return (deg * Math.PI) / 180;
}

// Distancia en metros entre dos coordenadas (fórmula de Haversine).
export function haversineMeters(
  aLat: number,
  aLng: number,
  bLat: number,
  bLng: number,
): number {
  const dLat = toRad(bLat - aLat);
  const dLng = toRad(bLng - aLng);
  const lat1 = toRad(aLat);
  const lat2 = toRad(bLat);

  const h =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLng / 2) ** 2;
  return 2 * EARTH_RADIUS_M * Math.asin(Math.sqrt(h));
}

// Caja delimitadora aproximada para prefiltrar candidatos en SQL antes del
// cálculo preciso por Haversine (evita escanear toda la tabla).
export function boundingBox(lat: number, lng: number, radiusMeters: number) {
  const latDelta = (radiusMeters / EARTH_RADIUS_M) * (180 / Math.PI);
  const lngDelta = latDelta / Math.max(Math.cos(toRad(lat)), 0.01);
  return {
    minLat: lat - latDelta,
    maxLat: lat + latDelta,
    minLng: lng - lngDelta,
    maxLng: lng + lngDelta,
  };
}
