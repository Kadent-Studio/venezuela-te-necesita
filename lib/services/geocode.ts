import { VENEZUELA_BOUNDS } from "@/lib/schemas";
import type { GeocodeResult, GeocodeResponse } from "@/lib/types";
import type { ServiceResult } from "./lib";

// ---------------------------------------------------------------------------
// Tipos internos de Nominatim
// ---------------------------------------------------------------------------

type NominatimResult = {
  place_id?: number;
  display_name?: string;
  lat?: string;
  lon?: string;
  type?: string;
  class?: string;
};

// ---------------------------------------------------------------------------
// Constantes
// ---------------------------------------------------------------------------

const NOMINATIM_URL =
  process.env.NOMINATIM_URL ?? "https://nominatim.openstreetmap.org/search";

const USER_AGENT =
  process.env.NOMINATIM_USER_AGENT ??
  "unidosvenezuela/0.1 (contacto: admin@unidosvenezuela.local)";

const CACHE_CONTROL =
  "public, s-maxage=86400, stale-while-revalidate=604800";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function inVenezuela(lat: number, lng: number) {
  return (
    lat >= VENEZUELA_BOUNDS.minLat &&
    lat <= VENEZUELA_BOUNDS.maxLat &&
    lng >= VENEZUELA_BOUNDS.minLng &&
    lng <= VENEZUELA_BOUNDS.maxLng
  );
}

// ---------------------------------------------------------------------------
// Servicio
// ---------------------------------------------------------------------------

export async function searchLocation(
  query: string,
): Promise<ServiceResult<GeocodeResponse>> {
  const url = new URL(NOMINATIM_URL);
  url.searchParams.set("q", query);
  url.searchParams.set("format", "jsonv2");
  url.searchParams.set("addressdetails", "0");
  url.searchParams.set("limit", "5");
  url.searchParams.set("countrycodes", "ve");
  url.searchParams.set(
    "viewbox",
    [
      VENEZUELA_BOUNDS.minLng,
      VENEZUELA_BOUNDS.maxLat,
      VENEZUELA_BOUNDS.maxLng,
      VENEZUELA_BOUNDS.minLat,
    ].join(","),
  );
  url.searchParams.set("bounded", "1");

  let res: Response;
  try {
    res = await fetch(url, {
      headers: {
        Accept: "application/json",
        "Accept-Language": "es-VE,es;q=0.9",
        "User-Agent": USER_AGENT,
      },
    });
  } catch {
    return { ok: false, error: "No se pudo buscar la zona", status: 502 };
  }

  if (!res.ok) {
    return { ok: false, error: "No se pudo buscar la zona", status: 502 };
  }

  let data: unknown;
  try {
    data = await res.json();
  } catch {
    return { ok: false, error: "No se pudo buscar la zona", status: 502 };
  }

  if (!Array.isArray(data)) return { ok: true, data: { items: [] } };

  const items = (data as NominatimResult[])
    .map((item): GeocodeResult | null => {
      const latitude = Number(item.lat);
      const longitude = Number(item.lon);
      if (!Number.isFinite(latitude) || !Number.isFinite(longitude))
        return null;
      if (!inVenezuela(latitude, longitude)) return null;
      return {
        id: String(item.place_id ?? `${latitude},${longitude}`),
        label: item.display_name ?? query,
        latitude,
        longitude,
        kind: item.type ?? item.class ?? "lugar",
      };
    })
    .filter((item): item is GeocodeResult => item != null);

  return { ok: true, data: { items } };
}

export { CACHE_CONTROL };
