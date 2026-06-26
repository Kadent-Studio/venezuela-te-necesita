import { Prisma, type Report } from "@prisma/client";

export type ReportWithDistance = Report & {
  distanceMeters: number;
};

type PublicReportStage = "NUEVO" | "EN_ATENCION" | "RESUELTO";

export function pointSql(lat: number, lng: number) {
  return Prisma.sql`ST_SetSRID(ST_MakePoint(${lng}, ${lat}), 4326)::geography`;
}

export function publicStageSql(stage?: PublicReportStage) {
  if (stage) return Prisma.sql`"stage" = ${stage}::"Stage"`;
  return Prisma.sql`"stage" <> 'DESCARTADO'::"Stage"`;
}

export function needTypeSql(needType?: string) {
  if (!needType) return Prisma.empty;
  return Prisma.sql`AND ${needType}::"NeedType" = ANY("needTypes")`;
}

export function enumFilterSql<T extends string>(
  column: "urgency" | "access",
  enumName: "Urgency" | "AccessStatus",
  value?: T,
) {
  if (!value) return Prisma.empty;
  return Prisma.sql`AND ${Prisma.raw(`"${column}"`)} = ${value}::${Prisma.raw(
    `"${enumName}"`,
  )}`;
}
