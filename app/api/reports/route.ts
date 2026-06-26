import { NextResponse, type NextRequest } from "next/server";
import { Prisma, Stage } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { createReportSchema, listQuerySchema } from "@/lib/schemas";
import { toPublicReports } from "@/lib/serialize";
import { zodErrorResponse, errorResponse } from "@/lib/api";

export const runtime = "nodejs";

// GET /api/reports — lista pública sanitizada, paginada por cursor.
export async function GET(req: NextRequest) {
  const parsed = listQuerySchema.safeParse(
    Object.fromEntries(req.nextUrl.searchParams),
  );
  if (!parsed.success) return zodErrorResponse(parsed.error);

  const { needType, urgency, access, stage, cursor, limit, lat, lng } =
    parsed.data;

  if (lat != null && lng != null) {
    const { items, nextCursor } = await prisma.report.findByRadius({
      lat,
      lng,
      radius: parsed.data.radius,
      needType,
      urgency,
      access,
      stage,
      cursor,
      limit,
    });
    return NextResponse.json({ items: toPublicReports(items), nextCursor });
  }

  // Público: nunca se muestran los reportes descartados.
  const where: Prisma.ReportWhereInput = {
    stage:
      stage && stage !== Stage.DESCARTADO ? stage : { not: Stage.DESCARTADO },
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
