import { prisma } from "@/lib/prisma";
import type { CreateReportInput, ListQuery } from "@/lib/schemas";
import type { PublicReport } from "@/lib/serialize";
import { toPublicReport, toPublicReports } from "@/lib/serialize";
import type { StatsResponse } from "@/lib/types";
import { Prisma, Stage, Urgency } from "@prisma/client";
import { NearbyQuery, NearbyReportItem, GeoJSONQuery } from "../api/contract";
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

export async function listReports(params: ListQuery) {
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

  return {
    ok: true,
    data: { items: toPublicReports(items), nextCursor },
  } as const;
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

// ---------------------------------------------------------------------------
// GeoJSON — FeatureCollection de reportes para GIS y mapas
// ---------------------------------------------------------------------------

export interface GeoJSONFeatureCollection {
  type: "FeatureCollection";
  features: GeoJSONFeature[];
}

export interface GeoJSONFeature {
  type: "Feature";
  geometry: {
    type: "Point";
    coordinates: [number, number];
  };
  properties: Record<string, unknown>;
  id: string;
}

export async function getReportsGeoJSON(
  params: GeoJSONQuery,
): Promise<ServiceResult<GeoJSONFeatureCollection>> {
  const { needType, urgency, access, stage, lat, lng, radius, limit } = params;

  let rows;

  if (lat != null && lng != null) {
    const result = await prisma.report.findByRadius({
      lat,
      lng,
      radius,
      needType,
      urgency,
      access,
      stage,
      limit,
    });
    rows = result.items;
  } else {
    const where: Prisma.ReportWhereInput = {
      stage:
        stage && stage !== Stage.DESCARTADO ? stage : { not: Stage.DESCARTADO },
      ...(needType ? { needTypes: { has: needType } } : {}),
      ...(urgency ? { urgency } : {}),
      ...(access ? { access } : {}),
    };

    rows = await prisma.report.findMany({
      where,
      orderBy: [{ createdAt: "desc" }, { id: "desc" }],
      take: limit,
    });
  }

  const features: GeoJSONFeature[] = rows.map((r) => {
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { contactName, contactPhone, ipHash, ...props } =
      r as unknown as Record<string, unknown>;
    return {
      type: "Feature",
      geometry: {
        type: "Point",
        coordinates: [r.longitude, r.latitude],
      },
      properties: {
        ...props,
        createdAt:
          props.createdAt instanceof Date
            ? (props.createdAt as Date).toISOString()
            : props.createdAt,
        updatedAt:
          props.updatedAt instanceof Date
            ? (props.updatedAt as Date).toISOString()
            : props.updatedAt,
        verifiedAt:
          props.verifiedAt instanceof Date
            ? (props.verifiedAt as Date).toISOString()
            : props.verifiedAt,
      },
      id: r.id,
    };
  });

  return {
    ok: true,
    data: {
      type: "FeatureCollection",
      features,
    },
  };
}
