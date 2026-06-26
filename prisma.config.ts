import { config as loadEnv } from "dotenv";
import { defineConfig } from "prisma/config";

// Prisma 7: configuración del CLI (migrate / studio / introspection).
// La conexión de runtime de la app se hace con un driver adapter en lib/prisma.ts.
// Next carga .env.local en runtime, pero Prisma CLI no lo hace por defecto.
loadEnv({ path: ".env.local" });
loadEnv();

const databaseUrl =
  process.env.DIRECT_URL ??
  process.env.POSTGRES_URL_NON_POOLING ??
  process.env.DATABASE_URL_UNPOOLED ??
  process.env.DATABASE_URL ??
  "";

export default defineConfig({
  schema: "prisma/schema.prisma",
  datasource: {
    url: databaseUrl,
  },
});
