import { NextResponse } from "next/server";
import { Stage, Urgency } from "@prisma/client";
import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// GET /api/reports/stats — agregados públicos para el encabezado del feed.
// No incluye reportes descartados.
export async function GET() {
  const notDiscarded = { stage: { not: Stage.DESCARTADO } } as const;

  const [total, critical, inProgress, verified, byUrgency] = await Promise.all([
    prisma.report.count({ where: notDiscarded }),
    prisma.report.count({
      where: { ...notDiscarded, urgency: Urgency.CRITICA },
    }),
    prisma.report.count({
      where: { ...notDiscarded, stage: Stage.EN_ATENCION },
    }),
    prisma.report.count({ where: { ...notDiscarded, verified: true } }),
    prisma.report.groupBy({
      by: ["urgency"],
      where: notDiscarded,
      _count: { _all: true },
    }),
  ]);

  const urgency = Object.fromEntries(
    byUrgency.map((r) => [r.urgency, r._count._all]),
  ) as Record<Urgency, number>;

  return NextResponse.json({
    total,
    critical,
    inProgress,
    verified,
    urgency: {
      CRITICA: urgency.CRITICA ?? 0,
      ALTA: urgency.ALTA ?? 0,
      MEDIA: urgency.MEDIA ?? 0,
      BAJA: urgency.BAJA ?? 0,
    },
  });
}
