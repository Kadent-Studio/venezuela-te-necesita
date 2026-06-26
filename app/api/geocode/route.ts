import { NextResponse, type NextRequest } from "next/server";
import { geocodeQuerySchema, VENEZUELA_BOUNDS } from "@/lib/schemas";
import { zodErrorResponse, errorResponse } from "@/lib/api";

export const runtime = "nodejs";

type NominatimResult = {
  place_id?: number;
  display_name?: string;
  lat?: string;
  lon?: string;
  type?: string;
  class?: string;
};

const NOMINATIM_URL =
  process.env.NOMINATIM_URL ?? "https://nominatim.openstreetmap.org/search";

function inVenezuela(lat: number, lng: number) {
  return (
    lat >= VENEZUELA_BOUNDS.minLat &&
    lat <= VENEZUELA_BOUNDS.maxLat &&
    lng >= VENEZUELA_BOUNDS.minLng &&
    lng <= VENEZUELA_BOUNDS.maxLng
  );
}

export async function GET(req: NextRequest) {
  const parsed = geocodeQuerySchema.safeParse(
    Object.fromEntries(req.nextUrl.searchParams),
  );
  if (!parsed.success) return zodErrorResponse(parsed.error);

  const url = new URL(NOMINATIM_URL);
  url.searchParams.set("q", parsed.data.q);
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
        "User-Agent":
          process.env.NOMINATIM_USER_AGENT ??
          "unidosvenezuela/0.1 (contacto: admin@unidosvenezuela.local)",
      },
      next: { revalidate: 60 * 60 * 24 },
    });
  } catch {
    return errorResponse(502, "No se pudo buscar la zona");
  }

  if (!res.ok) return errorResponse(502, "No se pudo buscar la zona");

  const data = (await res.json()) as NominatimResult[];
  const items = data
    .map((item) => {
      const latitude = Number(item.lat);
      const longitude = Number(item.lon);
      if (!Number.isFinite(latitude) || !Number.isFinite(longitude)) return null;
      if (!inVenezuela(latitude, longitude)) return null;
      return {
        id: String(item.place_id ?? `${latitude},${longitude}`),
        label: item.display_name ?? parsed.data.q,
        latitude,
        longitude,
        kind: item.type ?? item.class ?? "lugar",
      };
    })
    .filter((item): item is NonNullable<typeof item> => item != null);

  return NextResponse.json(
    { items },
    {
      headers: {
        "Cache-Control": "public, s-maxage=86400, stale-while-revalidate=604800",
      },
    },
  );
}
