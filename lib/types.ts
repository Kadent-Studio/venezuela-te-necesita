import type {
  NeedType,
  Urgency,
  AccessStatus,
  Stage,
  DiscardReason,
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
