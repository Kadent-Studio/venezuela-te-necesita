import { NextResponse, type NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { nearbyQuerySchema } from "@/lib/schemas";
import { toPublicReport } from "@/lib/serialize";
import { zodErrorResponse } from "@/lib/api";
import { pointSql, publicStageSql, type ReportWithDistance } from "@/lib/postgis";

export const runtime = "nodejs";

const MAX_RESULTS = 10;

// GET /api/reports/nearby?lat=&lng=&radius= — sugeridor de duplicados.
// Usa PostGIS para filtrar y ordenar por distancia real en metros.
export async function GET(req: NextRequest) {
  const parsed = nearbyQuerySchema.safeParse(
    Object.fromEntries(req.nextUrl.searchParams),
  );
  if (!parsed.success) return zodErrorResponse(parsed.error);

  const { lat, lng, radius } = parsed.data;
  const point = pointSql(lat, lng);

  const rows = await prisma.$queryRaw<ReportWithDistance[]>`
    SELECT
      "id", "createdAt", "updatedAt",
      "latitude", "longitude", "accuracyMeters", "address",
      "needTypes", "urgency", "description",
      "peopleCount", "hasInjured", "hasChildren", "hasElderly",
      "access", "photoUrl",
      "contactName", "contactPhone",
      "verified", "verifiedBy", "verifiedAt",
      "stage", "handledBy", "discardReason", "ipHash",
      ST_Distance("location", ${point})::double precision AS "distanceMeters"
    FROM "Report"
    WHERE ${publicStageSql()}
      AND ST_DWithin("location", ${point}, ${radius})
    ORDER BY "distanceMeters" ASC
    LIMIT ${MAX_RESULTS}
  `;

  const nearby = rows.map((r) => ({
    ...toPublicReport(r),
    distanceMeters: Math.round(Number(r.distanceMeters)),
  }));

  return NextResponse.json({ items: nearby });
}
