import { NextResponse, type NextRequest } from "next/server";
import { Prisma, Stage, type Report } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { createReportSchema, listQuerySchema, type ListQuery } from "@/lib/schemas";
import { toPublicReports } from "@/lib/serialize";
import { zodErrorResponse, errorResponse } from "@/lib/api";
import {
  enumFilterSql,
  needTypeSql,
  pointSql,
  publicStageSql,
} from "@/lib/postgis";

export const runtime = "nodejs";

// GET /api/reports — lista pública sanitizada, paginada por cursor.
export async function GET(req: NextRequest) {
  const parsed = listQuerySchema.safeParse(
    Object.fromEntries(req.nextUrl.searchParams),
  );
  if (!parsed.success) return zodErrorResponse(parsed.error);

  const { needType, urgency, access, stage, cursor, limit, lat, lng } = parsed.data;

  if (lat != null && lng != null) {
    return listReportsByRadius(parsed.data);
  }

  // Público: nunca se muestran los reportes descartados.
  const where: Prisma.ReportWhereInput = {
    stage: stage && stage !== Stage.DESCARTADO ? stage : { not: Stage.DESCARTADO },
    ...(needType ? { needTypes: { has: needType } } : {}),
    ...(urgency ? { urgency } : {}),
    ...(access ? { access } : {}),
  };

  const rows = await prisma.report.findMany({
    where,
    orderBy: [{ createdAt: "desc" }, { id: "desc" }],
    take: limit + 1, // +1 para saber si hay página siguiente
    ...(cursor ? { cursor: { id: cursor }, skip: 1 } : {}),
  });

  const hasMore = rows.length > limit;
  const items = hasMore ? rows.slice(0, limit) : rows;
  const nextCursor = hasMore ? items[items.length - 1].id : null;

  return NextResponse.json({ items: toPublicReports(items), nextCursor });
}

async function listReportsByRadius(query: ListQuery) {
  const { needType, urgency, access, stage, cursor, limit, lat, lng, radius } = query;
  if (lat == null || lng == null) {
    return errorResponse(400, "Indica lat y lng para filtrar por zona");
  }

  const cursorReport = cursor
    ? await prisma.report.findUnique({
        where: { id: cursor },
        select: { id: true, createdAt: true },
      })
    : null;

  const cursorSql = cursorReport
    ? Prisma.sql`AND ("createdAt", "id") < (${cursorReport.createdAt}, ${cursorReport.id})`
    : Prisma.empty;
  const point = pointSql(lat, lng);
  const publicStage =
    stage && stage !== Stage.DESCARTADO ? publicStageSql(stage) : publicStageSql();

  const rows = await prisma.$queryRaw<Report[]>`
    SELECT
      "id", "createdAt", "updatedAt",
      "latitude", "longitude", "accuracyMeters", "address",
      "needTypes", "urgency", "description",
      "peopleCount", "hasInjured", "hasChildren", "hasElderly",
      "access", "photoUrl",
      "contactName", "contactPhone",
      "verified", "verifiedBy", "verifiedAt",
      "stage", "handledBy", "discardReason", "ipHash"
    FROM "Report"
    WHERE ${publicStage}
      ${needTypeSql(needType)}
      ${enumFilterSql("urgency", "Urgency", urgency)}
      ${enumFilterSql("access", "AccessStatus", access)}
      AND ST_DWithin("location", ${point}, ${radius})
      ${cursorSql}
    ORDER BY "createdAt" DESC, "id" DESC
    LIMIT ${limit + 1}
  `;

  const hasMore = rows.length > limit;
  const items = hasMore ? rows.slice(0, limit) : rows;
  const nextCursor = hasMore ? items[items.length - 1].id : null;

  return NextResponse.json({ items: toPublicReports(items), nextCursor });
}

// POST /api/reports — crea una solicitud (estado inicial NUEVO, sin verificar).
export async function POST(req: NextRequest) {
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return errorResponse(400, "Cuerpo JSON inválido");
  }

  const parsed = createReportSchema.safeParse(body);
  if (!parsed.success) return zodErrorResponse(parsed.error);

  const created = await prisma.report.create({
    data: parsed.data,
    select: { id: true },
  });

  return NextResponse.json({ id: created.id }, { status: 201 });
}
