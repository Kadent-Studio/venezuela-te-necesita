import { zValidator } from "@hono/zod-validator";
import { Hono } from "hono";
import { createReportSchema, geocodeQuerySchema } from "../schemas";
import { CACHE_CONTROL, searchLocation } from "../services/geocode";
import { createReport } from "../services/reports";
import { generateUploadToken } from "../services/upload";

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
  });
