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
      title: "Unidos Venezuela API",
      version: "1.0.0",
    },
    servers: [
      {
        url: apiUrl,
        description: "API pública de Unidos Venezuela",
      },
    ],
  })
  .get("/ui", swaggerUI({ url: "/api/v1/docs" }));
