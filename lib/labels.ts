import type {
  NeedType,
  Urgency,
  AccessStatus,
  Stage,
  DiscardReason,
  SupplyType,
  StockLevel,
  CentroScope,
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

// ---------------------------------------------------------------------------
// Centros de acopio
// ---------------------------------------------------------------------------

export const supplyTypeLabel: Record<SupplyType, string> = {
  AGUA: "Agua potable",
  ALIMENTOS: "Alimentos no perecederos",
  MEDICINAS: "Medicinas / insumos",
  PANALES: "Pañales",
  HIGIENE: "Artículos de higiene",
  ROPA: "Ropa y calzado",
  COLCHONES: "Colchones / cobijas",
  AGUA_ASEO: "Agua para aseo",
  COCINA: "Utensilios de cocina",
  ENERGIA: "Linternas / pilas / energía",
  LIMPIEZA: "Productos de limpieza",
  OTRO: "Otro",
};

// Orden del catálogo en formularios y semáforos.
export const supplyTypeOrder: SupplyType[] = [
  "AGUA",
  "ALIMENTOS",
  "MEDICINAS",
  "PANALES",
  "HIGIENE",
  "ROPA",
  "COLCHONES",
  "AGUA_ASEO",
  "COCINA",
  "ENERGIA",
  "LIMPIEZA",
  "OTRO",
];

export const scopeLabel: Record<CentroScope, string> = {
  VENEZUELA: "En Venezuela",
  EXTERIOR: "En el exterior",
};

export const stockLevelLabel: Record<StockLevel, string> = {
  URGENTE: "Urgente",
  NECESITA: "Necesita",
  SUFICIENTE: "Suficiente",
  SOBRADO: "Sobrado",
};

// Lectura para el donante de cada nivel.
export const stockLevelHint: Record<StockLevel, string> = {
  URGENTE: "Falta ahora — traer con prioridad",
  NECESITA: "Hace falta",
  SUFICIENTE: "Tienen lo necesario — no urge",
  SOBRADO: "Saturado — no traer más",
};

// Token de color del semáforo por nivel (reusa la paleta de triaje).
export const stockLevelColor: Record<StockLevel, string> = {
  URGENTE: "var(--color-critico)",
  NECESITA: "var(--color-alto)",
  SUFICIENTE: "var(--color-bajo)",
  SOBRADO: "var(--color-ceniza-3)",
};

// Urgente primero (lo accionable), sobrado al final (lo que se evita).
export const stockLevelOrder: StockLevel[] = [
  "URGENTE",
  "NECESITA",
  "SUFICIENTE",
  "SOBRADO",
];

// Rango para priorizar/colorear un centro por su ítem más urgente (0 = menor).
export const stockLevelRank: Record<StockLevel, number> = {
  SOBRADO: 0,
  SUFICIENTE: 1,
  NECESITA: 2,
  URGENTE: 3,
};
