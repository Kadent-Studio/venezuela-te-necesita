import type { Report } from "@prisma/client";

// Campos sensibles que NUNCA deben salir en una respuesta pública.
const SENSITIVE_KEYS = ["contactName", "contactPhone", "ipHash"] as const;

export type PublicReport = Omit<Report, (typeof SENSITIVE_KEYS)[number]>;

// Convierte un Report en su forma pública, omitiendo el contacto y el ipHash.
// Toda salida pública (lista, mapa, nearby, detalle) DEBE pasar por aquí.
export function toPublicReport(report: Report): PublicReport {
  const copy: Record<string, unknown> = { ...report };
  for (const key of SENSITIVE_KEYS) delete copy[key];
  return copy as PublicReport;
}

export function toPublicReports(reports: Report[]): PublicReport[] {
  return reports.map(toPublicReport);
}
