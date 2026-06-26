import { NextResponse, type NextRequest } from "next/server";
import { Stage } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { nearbyQuerySchema } from "@/lib/schemas";
import { toPublicReport } from "@/lib/serialize";
import { zodErrorResponse } from "@/lib/api";
import { boundingBox, haversineMeters } from "@/lib/geo";

export const runtime = "nodejs";

const MAX_RESULTS = 10;

// GET /api/reports/nearby?lat=&lng=&radius= — sugeridor de duplicados.
// Prefiltra por caja delimitadora en SQL y afina con Haversine en memoria.
export async function GET(req: NextRequest) {
  const parsed = nearbyQuerySchema.safeParse(
    Object.fromEntries(req.nextUrl.searchParams),
  );
  if (!parsed.success) return zodErrorResponse(parsed.error);

  const { lat, lng, radius } = parsed.data;
  const box = boundingBox(lat, lng, radius);

  const candidates = await prisma.report.findMany({
    where: {
      stage: { not: Stage.DESCARTADO },
      latitude: { gte: box.minLat, lte: box.maxLat },
      longitude: { gte: box.minLng, lte: box.maxLng },
    },
    take: 100,
  });

  const nearby = candidates
    .map((r) => ({
      report: r,
      distance: haversineMeters(lat, lng, r.latitude, r.longitude),
    }))
    .filter((c) => c.distance <= radius)
    .sort((a, b) => a.distance - b.distance)
    .slice(0, MAX_RESULTS)
    .map((c) => ({
      ...toPublicReport(c.report),
      distanceMeters: Math.round(c.distance),
    }));

  return NextResponse.json({ items: nearby });
}
