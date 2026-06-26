import { Prisma, type Report } from "@prisma/client";

export type ReportWithDistance = Report & {
  distanceMeters: number;
};

export interface FindNearbyParams {
  lat: number;
  lng: number;
  radius: number;
}

export interface FindByRadiusParams {
  lat: number;
  lng: number;
  radius: number;
  needType?: string;
  urgency?: string;
  access?: string;
  stage?: string;
  cursor?: string;
  limit: number;
}

export interface CursorPage<T> {
  items: T[];
  nextCursor: string | null;
}

// ---------------------------------------------------------------------------
// Fragmentos SQL internos (Prisma.sql SafeQL)
// ---------------------------------------------------------------------------

function pointSql(lat: number, lng: number) {
  return Prisma.sql`ST_SetSRID(ST_MakePoint(${lng}, ${lat}), 4326)::geography`;
}

function publicStageSql(stage?: string) {
  if (stage) return Prisma.sql`"stage" = ${stage}::"Stage"`;
  return Prisma.sql`"stage" <> 'DESCARTADO'::"Stage"`;
}

function needTypeSql(needType?: string) {
  if (!needType) return Prisma.empty;
  return Prisma.sql`AND ${needType}::"NeedType" = ANY("needTypes")`;
}

function enumFilterSql(
  column: "urgency" | "access",
  enumName: "Urgency" | "AccessStatus",
  value?: string,
) {
  if (!value) return Prisma.empty;
  return Prisma.sql`AND ${Prisma.raw(`"${column}"`)} = ${value}::${Prisma.raw(`"${enumName}"`)}`;
}

// ---------------------------------------------------------------------------
// Extensión PostGIS – agrega métodos type‑safe al modelo `report`
// Sigue el enfoque SafeQL: https://pris.ly/d/safeql
// ---------------------------------------------------------------------------

export const postgisExtension = Prisma.defineExtension({
  name: "postgis",
  model: {
    report: {
      /**
       * Busca reportes cercanos sin paginación (sugeridor de duplicados).
       */
      async findNearby(
        params: FindNearbyParams,
      ): Promise<ReportWithDistance[]> {
        const { lat, lng, radius } = params;
        const point = pointSql(lat, lng);

        const ctx = Prisma.getExtensionContext(this);

        const rows = await ctx.$parent.$queryRaw<ReportWithDistance[]>`
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
          LIMIT 10
        `;

        return rows;
      },

      /**
       * Lista paginada con filtros dentro de un círculo de radio fijo.
       * Ordena por fecha (createdAt DESC, id DESC) para la paginación por cursor;
       * el radio solo filtra, no ordena por distancia.
       */
      async findByRadius(
        params: FindByRadiusParams,
      ): Promise<CursorPage<Report>> {
        const {
          lat,
          lng,
          radius,
          needType,
          urgency,
          access,
          stage,
          cursor,
          limit,
        } = params;
        const ctx = Prisma.getExtensionContext(this);
        const prisma = ctx.$parent;

        let cursorSql = Prisma.empty;
        if (cursor) {
          const cursorReport = await prisma.$queryRaw<
            { createdAt: Date; id: string }[]
          >`
            SELECT "createdAt", "id" FROM "Report" WHERE "id" = ${cursor}
          `;
          if (cursorReport[0]) {
            cursorSql = Prisma.sql`AND ("createdAt", "id") < (${cursorReport[0].createdAt}, ${cursorReport[0].id})`;
          }
        }

        const point = pointSql(lat, lng);
        const stageFilter =
          stage && stage !== "DESCARTADO"
            ? publicStageSql(stage)
            : publicStageSql();

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
          WHERE ${stageFilter}
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

        return { items, nextCursor };
      },
    },
  },
});
