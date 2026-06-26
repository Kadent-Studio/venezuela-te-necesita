import { NextResponse, type NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { nearbyQuerySchema } from "@/lib/schemas";
import { toPublicReport } from "@/lib/serialize";
import { zodErrorResponse } from "@/lib/api";

export const runtime = "nodejs";

// GET /api/reports/nearby?lat=&lng=&radius= — sugeridor de duplicados.
// Usa PostGIS para filtrar y ordenar por distancia real en metros.
export async function GET(req: NextRequest) {
  const parsed = nearbyQuerySchema.safeParse(
    Object.fromEntries(req.nextUrl.searchParams),
  );
  if (!parsed.success) return zodErrorResponse(parsed.error);

  const { lat, lng, radius } = parsed.data;
  const rows = await prisma.report.findNearby({ lat, lng, radius });

  const nearby = rows.map((r) => ({
    ...toPublicReport(r),
    distanceMeters: Math.round(Number(r.distanceMeters)),
  }));

  return NextResponse.json({ items: nearby });
}
