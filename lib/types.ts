import type {
  NeedType,
  Urgency,
  AccessStatus,
  Stage,
  DiscardReason,
} from "@prisma/client";

// Forma del reporte público tal como llega por JSON (fechas como string).
// Espejo de toPublicReport() en lib/serialize.ts — sin contacto ni ipHash.
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
  verified: boolean;
  verifiedBy: string | null;
  verifiedAt: string | null;
  stage: Stage;
  handledBy: string | null;
  discardReason: DiscardReason | null;
}

export interface ReportListResponse {
  items: PublicReportDTO[];
  nextCursor: string | null;
}

export interface NearbyReport extends PublicReportDTO {
  distanceMeters: number;
}

export interface StatsResponse {
  total: number;
  critical: number;
  inProgress: number;
  verified: number;
  urgency: { CRITICA: number; ALTA: number; MEDIA: number; BAJA: number };
}
