import { prisma } from "@/lib/prisma";
import type { CreateReportInput, ListQuery } from "@/lib/schemas";
import type { PublicReport } from "@/lib/serialize";
import { toPublicReport, toPublicReports } from "@/lib/serialize";
import type { StatsResponse } from "@/lib/types";
import { Prisma, Stage, Urgency } from "@prisma/client";
import { NearbyQuery, NearbyReportItem } from "../api/contract";
import { ServiceResult } from "./lib";

export interface PaginatedReports {
  items: PublicReport[];
  nextCursor: string | null;
}

// ---------------------------------------------------------------------------
// Obtener un reporte por ID
// ---------------------------------------------------------------------------

export async function getReportById(
  id: string,
): Promise<ServiceResult<PublicReport>> {
  const report = await prisma.report.findUnique({ where: { id } });

  if (!report || report.stage === Stage.DESCARTADO) {
    return { ok: false, error: "Solicitud no encontrada", status: 404 };
  }

  return { ok: true, data: toPublicReport(report) };
}

// ---------------------------------------------------------------------------
// Listar reportes (paginado, con filtros opcionales)
// ---------------------------------------------------------------------------

export async function listReports(
  params: ListQuery,
): Promise<ServiceResult<PaginatedReports>> {
  const { needType, urgency, access, stage, cursor, limit, lat, lng, radius } =
    params;

  // Búsqueda geoespacial
  if (lat != null && lng != null) {
    const result = await prisma.report.findByRadius({
      lat,
      lng,
      radius,
      needType,
      urgency,
      access,
      stage,
      cursor: cursor ?? undefined,
      limit,
    });
    return {
      ok: true,
      data: {
        items: toPublicReports(result.items),
        nextCursor: result.nextCursor,
      },
    };
  }

  // Búsqueda plana con filtros
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
    take: limit + 1,
    ...(cursor ? { cursor: { id: cursor }, skip: 1 } : {}),
  });

  const hasMore = rows.length > limit;
  const items = hasMore ? rows.slice(0, limit) : rows;
  const nextCursor = hasMore ? items[items.length - 1].id : null;

  return { ok: true, data: { items: toPublicReports(items), nextCursor } };
}

// ---------------------------------------------------------------------------
// Crear un reporte
// ---------------------------------------------------------------------------

export async function createReport(
  input: CreateReportInput,
): Promise<ServiceResult<{ id: string }>> {
  const created = await prisma.report.create({
    data: input,
    select: { id: true },
  });

  return { ok: true, data: created };
}

// ---------------------------------------------------------------------------
// Reportes cercanos (sugeridor de duplicados vía PostGIS)
// ---------------------------------------------------------------------------

export async function getNearbyReports(
  params: NearbyQuery,
): Promise<ServiceResult<NearbyReportItem[]>> {
  const { lat, lng, radius } = params;
  const rows = await prisma.report.findNearby({ lat, lng, radius });

  const nearby = rows.map((r) => ({
    ...toPublicReport(r),
    distanceMeters: Math.round(Number(r.distanceMeters)),
    createdAt: r.createdAt.toISOString(),
    updatedAt: r.updatedAt.toISOString(),
    verifiedAt: r.verifiedAt?.toISOString() ?? null,
  }));

  return { ok: true, data: nearby };
}

// ---------------------------------------------------------------------------
// Estadísticas agregadas (totales, críticas, en atención, verificadas)
// ---------------------------------------------------------------------------

export async function getStats(): Promise<ServiceResult<StatsResponse>> {
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

  const urgencyMap = Object.fromEntries(
    byUrgency.map((r) => [r.urgency, r._count._all]),
  ) as Record<Urgency, number>;

  return {
    ok: true,
    data: {
      total,
      critical,
      inProgress,
      verified,
      urgency: {
        CRITICA: urgencyMap.CRITICA ?? 0,
        ALTA: urgencyMap.ALTA ?? 0,
        MEDIA: urgencyMap.MEDIA ?? 0,
        BAJA: urgencyMap.BAJA ?? 0,
      },
    },
  };
}
