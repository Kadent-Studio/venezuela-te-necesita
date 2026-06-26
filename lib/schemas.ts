import { z } from "zod";
import {
  NeedType,
  Urgency,
  AccessStatus,
  Stage,
  DiscardReason,
} from "@prisma/client";

// Caja delimitadora aproximada de Venezuela. Rechaza coordenadas fuera del país
// (y de paso el clásico (0,0) de datos basura/spam).
export const VENEZUELA_BOUNDS = {
  minLat: 0.6,
  maxLat: 12.3,
  minLng: -73.4,
  maxLng: -59.8,
} as const;

export const latitude = z
  .number()
  .min(VENEZUELA_BOUNDS.minLat, "Latitud fuera de Venezuela")
  .max(VENEZUELA_BOUNDS.maxLat, "Latitud fuera de Venezuela");

export const longitude = z
  .number()
  .min(VENEZUELA_BOUNDS.minLng, "Longitud fuera de Venezuela")
  .max(VENEZUELA_BOUNDS.maxLng, "Longitud fuera de Venezuela");

// Teléfono permisivo: dígitos, +, espacios y guiones (formato VE flexible).
const phone = z
  .string()
  .trim()
  .min(7, "Teléfono demasiado corto")
  .max(20)
  .regex(/^[+0-9()\-\s]+$/, "Teléfono inválido");

// Esquema de creación de un reporte (formulario público + POST /api/reports).
export const createReportSchema = z.object({
  latitude,
  longitude,
  accuracyMeters: z.number().int().positive().max(100000).optional(),
  address: z.string().trim().min(3, "Indica una referencia").max(300),

  needTypes: z
    .array(z.nativeEnum(NeedType))
    .min(1, "Elige al menos un tipo de ayuda"),
  urgency: z.nativeEnum(Urgency),
  description: z.string().trim().max(2000).optional(),

  peopleCount: z.number().int().min(1).max(100000).default(1),
  hasInjured: z.boolean().default(false),
  hasChildren: z.boolean().default(false),
  hasElderly: z.boolean().default(false),

  access: z.nativeEnum(AccessStatus),

  photoUrl: z.string().url().max(2000).optional(),

  contactName: z.string().trim().min(2, "Indica un nombre").max(120),
  contactPhone: phone,
});

export type CreateReportInput = z.infer<typeof createReportSchema>;

// Filtros y paginación por cursor (GET /api/reports público).
export const listQuerySchema = z.object({
  needType: z.nativeEnum(NeedType).optional(),
  urgency: z.nativeEnum(Urgency).optional(),
  access: z.nativeEnum(AccessStatus).optional(),
  stage: z.nativeEnum(Stage).optional(),
  cursor: z.string().cuid().optional(),
  limit: z.coerce.number().int().min(1).max(50).default(20),
});

export type ListQuery = z.infer<typeof listQuerySchema>;

// Sugeridor de duplicados (GET /api/reports/nearby).
export const nearbyQuerySchema = z.object({
  lat: z.coerce.number().pipe(latitude),
  lng: z.coerce.number().pipe(longitude),
  radius: z.coerce.number().min(10).max(5000).default(200), // metros
});

export type NearbyQuery = z.infer<typeof nearbyQuerySchema>;

// Actualización de estado por un coordinador (PATCH /api/admin/reports/[id]).
// photoUrl admite null explícito para retirar una foto (moderación).
export const updateReportSchema = z
  .object({
    verified: z.boolean().optional(),
    stage: z.nativeEnum(Stage).optional(),
    discardReason: z.nativeEnum(DiscardReason).nullish(),
    photoUrl: z.null().optional(),
  })
  .refine((v) => Object.keys(v).length > 0, "Nada que actualizar")
  .refine(
    (v) => v.stage === Stage.DESCARTADO || !v.discardReason,
    "discardReason solo aplica cuando stage es DESCARTADO",
  );

export type UpdateReportInput = z.infer<typeof updateReportSchema>;
