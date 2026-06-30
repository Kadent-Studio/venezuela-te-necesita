import {
  getNearbyReports,
  getReportById,
  getStats,
  listReports,
} from "@/lib/services/reports";
import { swaggerUI } from "@hono/swagger-ui";
import { defineOpenAPIRoute, OpenAPIHono } from "@hono/zod-openapi";
import { cors } from "hono/cors";
import { getBaseUrl } from "../url";
import {
  getReportContract,
  listReportsContract,
  nearbyContract,
  statsContract,
} from "./contract";

// GET /reports/{id}
export const getReportRoute = defineOpenAPIRoute({
  route: getReportContract,
  async handler(c) {
    const { id } = c.req.valid("param");
    const result = await getReportById(id);
    if (!result.ok) {
      return c.json({ error: result.error }, result.status as 404);
    }
    return c.json(result.data, 200);
  },
});

// GET /reports — listado paginado con filtros opcionales
export const listReportsRoute = defineOpenAPIRoute({
  route: listReportsContract,
  async handler(c) {
    const query = c.req.valid("query");
    const result = await listReports(query);
    return c.json(result.data, 200);
  },
});

// GET /reports/nearby — sugeridor de duplicados vía PostGIS
export const nearbyRoute = defineOpenAPIRoute({
  route: nearbyContract,
  async handler(c) {
    const query = c.req.valid("query");
    const result = await getNearbyReports(query);
    if (!result.ok) {
      return c.json({ error: result.error, details: null }, 400);
    }
    return c.json({ items: result.data }, 200);
  },
});

// GET /reports/stats — estadísticas agregadas
export const statsRoute = defineOpenAPIRoute({
  route: statsContract,
  async handler(c) {
    const result = await getStats();
    if (!result.ok) {
      return c.json({ error: result.error }, 500);
    }
    return c.json(result.data, 200);
  },
});

const route = new OpenAPIHono();

route.use(cors({ origin: "*" }));

export const publicV1 = route.openapiRoutes([
  statsRoute,
  getReportRoute,
  listReportsRoute,
  nearbyRoute,
]);

const apiUrl = `${getBaseUrl()}/api/v1`;

publicV1
  .doc31("/docs", {
    openapi: "3.1.0",
    info: {
      title: "Unidos Venezuela — API de respuesta al terremoto",
      version: "1.0.0",
      description:
        "API pública de la plataforma **Unidos Venezuela** para la coordinación ciudadana de ayuda " +
        "tras los **terremotos del 24 de junio de 2026**, un doblete sísmico de magnitud 7.2 y 7.5 Mw " +
        "con epicentro entre San Felipe (Yaracuy) y Yumare/Montalbán (Carabobo), al norte de Venezuela.\n\n" +
        "El sismo —el más fuerte en el país en más de un siglo— dejó más de 1 700 fallecidos, " +
        "5 000 heridos, 50 000 desaparecidos y daños estimados en $6 700 millones. " +
        "Los estados más afectados son Yaracuy, Carabobo, Falcón, Miranda y La Guaira, " +
        "con afectaciones severas en Maracay, Valencia, Caracas y el Aeropuerto Internacional de Maiquetía.\n\n" +
        "Esta API permite consultar solicitudes de ayuda georreferenciadas — rescate, atención médica, " +
        "agua, comida, refugio — con filtros por ubicación, urgencia, accesibilidad y estado. " +
        "Todos los endpoints son de solo lectura y no requieren autenticación.\n\n" +
        "Los datos expuestos están sanitizados: nunca se incluye información de contacto " +
        "ni datos personales de los solicitantes.",
      contact: {
        name: "Kadent Studio",
        email: "kadentstudio@gmail.com",
      },
      license: {
        name: "MIT",
        url: "https://opensource.org/licenses/MIT",
      },
    },
    servers: [
      {
        url: apiUrl,
        description: "API pública de Unidos Venezuela",
      },
    ],
    tags: [
      {
        name: "Reportes",
        description:
          "Solicitudes de ayuda en las zonas afectadas: consultar, listar y buscar por proximidad geográfica",
      },
      {
        name: "Estadísticas",
        description:
          "Conteos agregados de la respuesta: total de reportes activos, críticos, en atención, verificados y desglose por urgencia",
      },
    ],
  })
  .get(
    "/ui",
    swaggerUI({
      url: "/api/v1/docs",
      docExpansion: "list",
      defaultModelsExpandDepth: 2,
      filter: true,
      tryItOutEnabled: true,
    }),
  );
