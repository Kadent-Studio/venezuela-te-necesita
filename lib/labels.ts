import type {
  NeedType,
  Urgency,
  AccessStatus,
  Stage,
  DiscardReason,
} from "@prisma/client";

export const needTypeLabel: Record<NeedType, string> = {
  RESCATE: "Rescate",
  MEDICO: "Médico",
  AGUA: "Agua",
  COMIDA: "Comida",
  REFUGIO: "Refugio",
  OTRO: "Otro",
};

export const urgencyLabel: Record<Urgency, string> = {
  CRITICA: "Crítica",
  ALTA: "Alta",
  MEDIA: "Media",
  BAJA: "Baja",
};

// Token de color de triaje por urgencia (var(--color-...)).
export const urgencyColor: Record<Urgency, string> = {
  CRITICA: "var(--color-critico)",
  ALTA: "var(--color-alto)",
  MEDIA: "var(--color-medio)",
  BAJA: "var(--color-bajo)",
};

export const accessLabel: Record<AccessStatus, string> = {
  TRANSITABLE: "Transitable",
  BLOQUEADA: "Vía bloqueada",
  VEHICULO_ESPECIAL: "Requiere vehículo especial",
  DESCONOCIDA: "Acceso desconocido",
};

export const accessColor: Record<AccessStatus, string> = {
  TRANSITABLE: "var(--color-acceso-ok)",
  BLOQUEADA: "var(--color-acceso-bloqueado)",
  VEHICULO_ESPECIAL: "var(--color-acceso-especial)",
  DESCONOCIDA: "var(--color-acceso-desconocido)",
};

export const stageLabel: Record<Stage, string> = {
  NUEVO: "Nuevo",
  EN_ATENCION: "En atención",
  RESUELTO: "Resuelto",
  DESCARTADO: "Descartado",
};

export const discardReasonLabel: Record<DiscardReason, string> = {
  DUPLICADO: "Duplicado",
  FALSO: "Falso",
  FUERA_DE_ALCANCE: "Fuera de alcance",
};

// Orden de necesidades en formularios (rescate primero, otro al final).
export const needTypeOrder: NeedType[] = [
  "RESCATE",
  "MEDICO",
  "AGUA",
  "COMIDA",
  "REFUGIO",
  "OTRO",
];

export const urgencyOrder: Urgency[] = ["CRITICA", "ALTA", "MEDIA", "BAJA"];

export const accessOrder: AccessStatus[] = [
  "TRANSITABLE",
  "VEHICULO_ESPECIAL",
  "BLOQUEADA",
  "DESCONOCIDA",
];
