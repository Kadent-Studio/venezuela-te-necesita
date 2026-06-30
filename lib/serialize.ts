import type { Centro, CentroItem, Report } from "@prisma/client";

// Campos sensibles que NUNCA deben salir en una respuesta pública.
// El contacto (contactName/contactPhone) SÍ es público: es el medio para
// comunicarse con quien tiene acceso al lugar del incidente.
const SENSITIVE_KEYS = ["ipHash"] as const;

export type PublicReport = Omit<Report, (typeof SENSITIVE_KEYS)[number]>;

// Convierte un Report en su forma pública, omitiendo solo el ipHash.
// Toda salida pública (lista, mapa, nearby, detalle) DEBE pasar por aquí.
export function toPublicReport(report: Report): PublicReport {
  const copy: Record<string, unknown> = { ...report };
  for (const key of SENSITIVE_KEYS) delete copy[key];
  return copy as PublicReport;
}

export function toPublicReports(reports: Report[]): PublicReport[] {
  return reports.map(toPublicReport);
}

// ---------------------------------------------------------------------------
// Centros de acopio
// ---------------------------------------------------------------------------

// El manageToken (enlace de gestión) y el ipHash NUNCA salen en respuestas
// públicas. El contacto del encargado SÍ es público: es el medio para que los
// donantes coordinen entregas.
const CENTRO_SENSITIVE_KEYS = ["manageToken", "ipHash"] as const;

export type CentroWithItems = Centro & { items: CentroItem[] };

export interface PublicCentroItem {
  supplyType: CentroItem["supplyType"];
  level: CentroItem["level"];
  note: string | null;
}

export type PublicCentro = Omit<
  Centro,
  (typeof CENTRO_SENSITIVE_KEYS)[number]
> & { items: PublicCentroItem[] };

// Convierte un Centro (con sus ítems) en su forma pública. Toda salida pública
// (lista, mapa, detalle) DEBE pasar por aquí.
export function toPublicCentro(centro: CentroWithItems): PublicCentro {
  const copy: Record<string, unknown> = { ...centro };
  for (const key of CENTRO_SENSITIVE_KEYS) delete copy[key];
  copy.items = centro.items.map((i) => ({
    supplyType: i.supplyType,
    level: i.level,
    note: i.note,
  }));
  return copy as PublicCentro;
}

export function toPublicCentros(centros: CentroWithItems[]): PublicCentro[] {
  return centros.map(toPublicCentro);
}
