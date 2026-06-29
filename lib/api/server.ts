import { Hono } from "hono";
import { internalRoutes } from "./internal-router";
import { publicV1 } from "./router";

const app = new Hono()
  .basePath("/api")
  .notFound((c) => c.json({ error: "Not found" }, 404))
  .route("/v1", publicV1)
  .route("/", internalRoutes);

export default app;
