import { zValidator } from "@hono/zod-validator";
import { Hono } from "hono";
import {
  createCentroSchema,
  createReportSchema,
  geocodeQuerySchema,
  updateCentroItemsSchema,
  updateCentroSchema,
} from "../schemas";
import {
  createCentro,
  updateCentro,
  updateCentroItems,
} from "../services/centros";
import { CACHE_CONTROL, searchLocation } from "../services/geocode";
import { createReport } from "../services/reports";
import { generateUploadToken } from "../services/upload";

// Cabecera con el enlace secreto de gestión de un centro (sin login).
const MANAGE_TOKEN_HEADER = "x-manage-token";

// Interna: no se expone en OpenAPI ni en docs públicos.
export const internalRoutes = new Hono()
  .get("/health", (c) => c.text("OK"))
  .get("/geocode", zValidator("query", geocodeQuerySchema), async (c) => {
    const { q } = c.req.valid("query");

    const result = await searchLocation(q);
    if (!result.ok) {
      return c.json({ error: result.error }, result.status as 502);
    }

    return c.json(result.data, 200, { "Cache-Control": CACHE_CONTROL });
  })
  .post("/reports", zValidator("json", createReportSchema), async (c) => {
    const body = c.req.valid("json");
    const result = await createReport(body);
    if (!result.ok) {
      return c.json(
        { error: result.error, details: null },
        result.status as 400,
      );
    }
    return c.json(result.data, 201);
  })
  .post("/reports/upload", async (c) => {
    const body = await c.req.json();
    const result = await generateUploadToken(body, c.req.raw);
    if (!result.ok) {
      return c.json({ error: result.error }, result.status as 400);
    }
    return c.json(result.data, 200);
  })
  // --- Centros de acopio ---
  .post("/centros", zValidator("json", createCentroSchema), async (c) => {
    const body = c.req.valid("json");
    const result = await createCentro(body);
    if (!result.ok) {
      return c.json(
        { error: result.error, details: null },
        result.status as 400,
      );
    }
    return c.json(result.data, 201);
  })
  .patch(
    "/centros/:id/items",
    zValidator("json", updateCentroItemsSchema),
    async (c) => {
      const id = c.req.param("id");
      const token = c.req.header(MANAGE_TOKEN_HEADER);
      const body = c.req.valid("json");
      const result = await updateCentroItems(id, token, body);
      if (!result.ok) {
        return c.json({ error: result.error }, result.status as 403);
      }
      return c.json(result.data, 200);
    },
  )
  .patch("/centros/:id", zValidator("json", updateCentroSchema), async (c) => {
    const id = c.req.param("id");
    const token = c.req.header(MANAGE_TOKEN_HEADER);
    const body = c.req.valid("json");
    const result = await updateCentro(id, token, body);
    if (!result.ok) {
      return c.json({ error: result.error }, result.status as 403);
    }
    return c.json(result.data, 200);
  })
  .post("/centros/upload", async (c) => {
    const body = await c.req.json();
    const result = await generateUploadToken(body, c.req.raw);
    if (!result.ok) {
      return c.json({ error: result.error }, result.status as 400);
    }
    return c.json(result.data, 200);
  });
