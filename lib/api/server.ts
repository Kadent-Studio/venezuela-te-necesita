import { Hono } from "hono";
import { internalRoutes } from "./internal-router";
import { publicV1 } from "./router";

const app = new Hono()
  .basePath("/api")
  .route("/v1", publicV1)
  .route("/", internalRoutes);

app.notFound((c) => c.json({ error: "Not found" }, 404));
app.onError((error, c) => {
  console.error(error);
  return c.json({ error: "Internal Server Error" }, 500);
});

export default app;
