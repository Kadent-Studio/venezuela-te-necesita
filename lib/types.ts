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

// Forma del reporte público tal como llega por JSON (fechas como string).
// Espejo de toPublicReport() en lib/serialize.ts — sin ipHash.
export interface PublicReportDTO {
  id: string;
  createdAt: string;
  updatedAt: string;
  latitude: number;
  longitude: number;
  accuracyMeters: number | null;
  address: string;
  needTypes: NeedType[];
  urgency: Urgency;
  description: string | null;
  peopleCount: number;
  hasInjured: boolean;
  hasChildren: boolean;
  hasElderly: boolean;
  access: AccessStatus;
  photoUrl: string | null;
  contactName: string;
  contactPhone: string;
  verified: boolean;
  verifiedBy: string | null;
  verifiedAt: string | null;
  stage: Stage;
  handledBy: string | null;
  discardReason: DiscardReason | null;
}

// Forma del ítem de un centro tal como llega por JSON (espejo de
// PublicCentroItem en lib/serialize.ts).
export interface CentroItemDTO {
  supplyType: SupplyType;
  level: StockLevel;
  note: string | null;
}

// Forma del centro público tal como llega por JSON (fechas como string).
// Espejo de toPublicCentro() — sin manageToken ni ipHash.
export interface PublicCentroDTO {
  id: string;
  createdAt: string;
  updatedAt: string;
  name: string;
  description: string | null;
  scope: CentroScope | null;
  country: string | null;
  state: string | null;
  city: string | null;
  latitude: number;
  longitude: number;
  accuracyMeters: number | null;
  address: string;
  photoUrl: string | null;
  receivesNote: string | null;
  encargadoName: string | null;
  encargadoPhone: string | null;
  phone: string | null;
  contactHandle: string | null;
  horario: string | null;
  verified: boolean;
  verifiedBy: string | null;
  verifiedAt: string | null;
  verificationsCount: number;
  endsAt: string | null;
  lastStockUpdatedAt: string;
  source: string | null;
  externalId: string | null;
  sourceHandle: string | null;
  items: CentroItemDTO[];
}

export interface StatsResponse {
  total: number;
  critical: number;
  inProgress: number;
  verified: number;
  urgency: { CRITICA: number; ALTA: number; MEDIA: number; BAJA: number };
}

export interface GeocodeResult {
  id: string;
  label: string;
  latitude: number;
  longitude: number;
  kind: string;
}

export interface GeocodeResponse {
  items: GeocodeResult[];
}
