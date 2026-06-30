import {
  AccessStatus,
  CentroScope,
  DiscardReason,
  NeedType,
  Stage,
  StockLevel,
  SupplyType,
  Urgency,
} from "@prisma/client";
import { z } from "zod";

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

// Coordenadas globales: los centros de acopio pueden estar en el exterior
// (puntos de la diáspora), así que no se restringen a Venezuela.
export const anyLatitude = z
  .number()
  .min(-90, "Latitud inválida")
  .max(90, "Latitud inválida");

export const anyLongitude = z
  .number()
  .min(-180, "Longitud inválida")
  .max(180, "Longitud inválida");

// Teléfono permisivo: dígitos, +, espacios y guiones (formato VE flexible).
export const phone = z
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
    .array(z.enum(NeedType))
    .min(1, "Elige al menos un tipo de ayuda"),
  urgency: z.enum(Urgency),
  description: z.string().trim().max(2000).optional(),

  peopleCount: z.number().int().min(1).max(100000).default(1),
  hasInjured: z.boolean().default(false),
  hasChildren: z.boolean().default(false),
  hasElderly: z.boolean().default(false),

  access: z.enum(AccessStatus),

  photoUrl: z.string().url().max(2000).optional(),

  contactName: z.string().trim().min(2, "Indica un nombre").max(120),
  contactPhone: phone,
});

export type CreateReportInput = z.infer<typeof createReportSchema>;

// Filtros y paginación por cursor (GET /api/reports público).
export const listQuerySchema = z
  .object({
    needType: z.enum(NeedType).optional(),
    urgency: z.enum(Urgency).optional(),
    access: z.enum(AccessStatus).optional(),
    stage: z.enum(Stage).optional(),
    cursor: z.string().cuid().optional(),
    limit: z.coerce.number().int().min(1).max(50).default(20),
    lat: z.coerce.number().pipe(latitude).optional(),
    lng: z.coerce.number().pipe(longitude).optional(),
    radius: z.coerce.number().min(10).max(50000).default(5000),
  })
  .refine(
    (v) => (v.lat == null && v.lng == null) || (v.lat != null && v.lng != null),
    {
      message: "Indica lat y lng para filtrar por zona",
      path: ["lat"],
    },
  );

export type ListQuery = z.infer<typeof listQuerySchema>;

// Buscador de ciudad/zona para centrar el mapa. La búsqueda real vive en
// /api/geocode para identificar la app ante Nominatim y limitar el alcance.
export const geocodeQuerySchema = z.object({
  q: z.string().trim().min(2, "Busca una ciudad o sector").max(120),
});

// Actualización de estado por un coordinador (PATCH /api/admin/reports/[id]).
// photoUrl admite null explícito para retirar una foto (moderación).
export const updateReportSchema = z
  .object({
    verified: z.boolean().optional(),
    stage: z.enum(Stage).optional(),
    discardReason: z.enum(DiscardReason).nullish(),
    photoUrl: z.string().max(2000).nullable().optional(),
  })
  .refine((v) => Object.keys(v).length > 0, "Nada que actualizar")
  .refine(
    (v) => v.stage === Stage.DESCARTADO || !v.discardReason,
    "discardReason solo aplica cuando stage es DESCARTADO",
  );

// ---------------------------------------------------------------------------
// Centros de acopio
// ---------------------------------------------------------------------------

// Nivel de un ítem del semáforo (el donante ve qué falta y qué sobra).
const centroItemInput = z.object({
  supplyType: z.enum(SupplyType),
  level: z.enum(StockLevel),
  note: z.string().trim().max(300).optional(),
});

// Creación de un centro (formulario público + POST /api/centros).
// `items` es opcional: el servicio siembra los 12 ítems en NECESITA y aplica
// los niveles enviados como sobrescritura. Coordenadas globales (puede estar
// en el exterior). El encargado es opcional: las fuentes externas no siempre
// traen una persona designada.
export const createCentroSchema = z.object({
  name: z.string().trim().min(2, "Indica el nombre del centro").max(160),
  description: z.string().trim().max(2000).optional(),

  scope: z.enum(CentroScope).optional(),
  country: z.string().trim().max(80).optional(),
  state: z.string().trim().max(120).optional(),
  city: z.string().trim().max(120).optional(),

  latitude: anyLatitude,
  longitude: anyLongitude,
  accuracyMeters: z.number().int().positive().max(100000).optional(),
  address: z.string().trim().min(3, "Indica una referencia").max(400),

  photoUrl: z.string().url().max(2000).optional(),

  receivesNote: z.string().trim().max(4000).optional(),

  encargadoName: z.string().trim().min(2).max(160).optional(),
  encargadoPhone: phone.optional(),
  phone: phone.optional(),
  contactHandle: z.string().trim().max(160).optional(),
  horario: z.string().trim().max(160).optional(),

  endsAt: z.coerce.date().optional(),

  items: z.array(centroItemInput).max(20).optional(),
});

export type CreateCentroInput = z.infer<typeof createCentroSchema>;

// Listado público de centros (GET /api/centros). Filtro opcional por ítem/nivel
// y por ámbito/país.
export const listCentrosQuerySchema = z.object({
  supplyType: z.enum(SupplyType).optional(),
  level: z.enum(StockLevel).optional(),
  scope: z.enum(CentroScope).optional(),
  country: z.string().trim().max(80).optional(),
  cursor: z.string().cuid().optional(),
  limit: z.coerce.number().int().min(1).max(50).default(20),
});

export type ListCentrosQuery = z.infer<typeof listCentrosQuerySchema>;

// Actualización de campos operativos por el encargado (PATCH, token).
export const updateCentroSchema = z
  .object({
    name: z.string().trim().min(2).max(160).optional(),
    description: z.string().trim().max(2000).nullish(),
    scope: z.enum(CentroScope).nullish(),
    country: z.string().trim().max(80).nullish(),
    state: z.string().trim().max(120).nullish(),
    city: z.string().trim().max(120).nullish(),
    receivesNote: z.string().trim().max(4000).nullish(),
    encargadoName: z.string().trim().min(2).max(160).nullish(),
    encargadoPhone: phone.nullish(),
    phone: phone.nullish(),
    contactHandle: z.string().trim().max(160).nullish(),
    horario: z.string().trim().max(160).nullish(),
    photoUrl: z.string().max(2000).nullable().optional(),
    latitude: anyLatitude.optional(),
    longitude: anyLongitude.optional(),
    accuracyMeters: z.number().int().positive().max(100000).nullish(),
    address: z.string().trim().min(3).max(400).optional(),
    endsAt: z.coerce.date().nullish(),
  })
  .refine((v) => Object.keys(v).length > 0, "Nada que actualizar")
  .refine(
    (v) =>
      (v.latitude == null && v.longitude == null) ||
      (v.latitude != null && v.longitude != null),
    { message: "Indica latitud y longitud juntas", path: ["latitude"] },
  );

export type UpdateCentroInput = z.infer<typeof updateCentroSchema>;

// Actualización de los niveles del semáforo (PATCH /items, token).
export const updateCentroItemsSchema = z.object({
  items: z.array(centroItemInput).min(1, "Indica al menos un ítem").max(20),
});

export type UpdateCentroItemsInput = z.infer<typeof updateCentroItemsSchema>;
