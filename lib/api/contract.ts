import { createRoute } from "@hono/zod-openapi";
import { z } from "zod";
import { latitude, longitude } from "../schemas";

// ---------------------------------------------------------------------------
// Schemas
// ---------------------------------------------------------------------------

const NeedType = z
  .enum(["RESCATE", "MEDICO", "AGUA", "COMIDA", "REFUGIO", "OTRO"])
  .openapi("NeedType");

const Urgency = z.enum(["CRITICA", "ALTA", "MEDIA", "BAJA"]).openapi("Urgency");

const AccessStatus = z
  .enum(["TRANSITABLE", "BLOQUEADA", "VEHICULO_ESPECIAL", "DESCONOCIDA"])
  .openapi("AccessStatus");

const Stage = z
  .enum(["NUEVO", "EN_ATENCION", "RESUELTO", "DESCARTADO"])
  .openapi("Stage");

const DiscardReason = z
  .enum(["DUPLICADO", "FALSO", "FUERA_DE_ALCANCE"])
  .openapi("DiscardReason");

const ErrorResponseSchema = z
  .object({ error: z.string() })
  .openapi("ErrorResponse");

const ValidationErrorResponseSchema = z
  .object({ error: z.string(), details: z.array(z.unknown()).nullish() })
  .openapi("ValidationErrorResponse");

export const Report = z
  .object({
    id: z.string(),
    createdAt: z.string(),
    updatedAt: z.string(),
    latitude: z.number(),
    longitude: z.number(),
    accuracyMeters: z.number().nullable(),
    address: z.string(),
    needTypes: z.array(NeedType),
    urgency: Urgency,
    description: z.string().nullable(),
    peopleCount: z.number(),
    hasInjured: z.boolean(),
    hasChildren: z.boolean(),
    hasElderly: z.boolean(),
    access: AccessStatus,
    photoUrl: z.string().nullable(),
    contactName: z.string(),
    contactPhone: z.string(),
    verified: z.boolean(),
    verifiedBy: z.string().nullable(),
    verifiedAt: z.string().nullable(),
    stage: Stage,
    handledBy: z.string().nullable(),
    discardReason: DiscardReason.nullable(),
  })
  .openapi("Report");

export const ReportListResponse = z
  .object({
    items: z.array(Report),
    nextCursor: z.string().nullable(),
  })
  .openapi("ReportListResponse");

// ---------------------------------------------------------------------------
// GET /reports/{id}
// ---------------------------------------------------------------------------

const GetReportParams = z
  .object({
    id: z.string().openapi({
      description: "El ID del reporte que se desea obtener",
      param: { name: "id", in: "path" },
    }),
  })
  .openapi("GetReportParams");

export const getReportContract = createRoute({
  method: "get",
  path: "/reports/{id}",
  tags: ["Reportes"],
  summary: "Obtener un reporte",
  description:
    "Devuelve los datos completos de un reporte por su ID. Los reportes descartados no se retornan.",
  operationId: "getReport",
  request: {
    params: GetReportParams,
  },
  responses: {
    200: {
      content: { "application/json": { schema: Report } },
      description: "Reporte encontrado",
    },
    404: {
      content: {
        "application/json": {
          schema: ErrorResponseSchema,
        },
      },
      description: "Reporte no encontrado",
    },
  },
});

// ---------------------------------------------------------------------------
// GET /reports — listado paginado
// ---------------------------------------------------------------------------

export const ListReportsQuerySchema = z
  .object({
    needType: NeedType.optional(),
    urgency: Urgency.optional(),
    access: AccessStatus.optional(),
    stage: Stage.optional(),
    cursor: z.string().optional(),
    limit: z.coerce.number().int().min(1).max(50).default(20),
    lat: z.coerce.number().optional(),
    lng: z.coerce.number().optional(),
    radius: z.coerce.number().min(10).max(50000).default(5000),
  })
  .refine(
    (v) => (v.lat == null && v.lng == null) || (v.lat != null && v.lng != null),
    { message: "Indica lat y lng para filtrar por zona" },
  )
  .openapi("ListReportsQuery");

export const listReportsContract = createRoute({
  method: "get",
  path: "/reports",
  tags: ["Reportes"],
  summary: "Listar reportes",
  description:
    "Listado paginado de reportes con filtros opcionales por tipo de necesidad, urgencia, acceso, etapa y ubicación geográfica. Se excluyen los reportes descartados por defecto.",
  operationId: "listReports",
  request: {
    query: ListReportsQuerySchema,
  },
  responses: {
    200: {
      content: { "application/json": { schema: ReportListResponse } },
      description: "Listado paginado de reportes",
    },
    400: {
      content: {
        "application/json": {
          schema: ValidationErrorResponseSchema,
        },
      },
      description: "Parámetros inválidos",
    },
  },
});

// ---------------------------------------------------------------------------
// GET /reports/nearby — sugeridor de duplicados
// ---------------------------------------------------------------------------

export const NearbyReportItemSchema = Report.extend({
  distanceMeters: z.number(),
}).openapi("NearbyReport");

export type NearbyReportItem = z.infer<typeof NearbyReportItemSchema>;

const NearbyReportsResponse = z
  .object({ items: z.array(NearbyReportItemSchema) })
  .openapi("NearbyReportsResponse");

export const NearbyQuerySchema = z
  .object({
    lat: z.number().pipe(latitude),
    lng: z.number().pipe(longitude),
    radius: z.coerce.number().min(10).max(5000).default(200),
  })
  .openapi("NearbyQuery");

export type NearbyQuery = z.infer<typeof NearbyQuerySchema>;

export const nearbyContract = createRoute({
  method: "get",
  path: "/reports/nearby",
  tags: ["Reportes"],
  summary: "Buscar reportes cercanos",
  description:
    "Sugeridor de duplicados: devuelve reportes cercanos a una coordenada ordenados por distancia. Útil para detectar si ya existe una solicitud similar en la misma zona antes de crear una nueva.",
  operationId: "getNearbyReports",
  request: {
    query: NearbyQuerySchema,
  },
  responses: {
    200: {
      content: { "application/json": { schema: NearbyReportsResponse } },
      description: "Reportes cercanos ordenados por distancia",
    },
    400: {
      content: {
        "application/json": {
          schema: ValidationErrorResponseSchema,
        },
      },
      description: "Parámetros inválidos",
    },
  },
});

// ---------------------------------------------------------------------------
// GET /reports/stats — estadísticas agregadas
// ---------------------------------------------------------------------------

const UrgencyCounts = z.object({
  CRITICA: z.number(),
  ALTA: z.number(),
  MEDIA: z.number(),
  BAJA: z.number(),
});

export const StatsResponseSchema = z
  .object({
    total: z.number(),
    critical: z.number(),
    inProgress: z.number(),
    verified: z.number(),
    urgency: UrgencyCounts,
  })
  .openapi("StatsResponse");

export const statsContract = createRoute({
  method: "get",
  path: "/reports/stats",
  tags: ["Estadísticas"],
  summary: "Estadísticas agregadas",
  description:
    "Devuelve conteos agregados: total de reportes activos, críticos, en atención, verificados y desglose por nivel de urgencia. No incluye reportes descartados.",
  operationId: "getStats",
  responses: {
    200: {
      content: { "application/json": { schema: StatsResponseSchema } },
      description: "Estadísticas agregadas (sin descartados)",
    },
    500: {
      content: {
        "application/json": {
          schema: z.object({ error: z.string() }),
        },
      },
      description: "Error interno",
    },
  },
});
