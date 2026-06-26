import "dotenv/config";
import { defineConfig } from "prisma/config";

// Prisma 7: configuración del CLI (migrate / studio / introspection).
// La conexión de runtime de la app se hace con un driver adapter en lib/prisma.ts.
// Se usa process.env (no el helper env() estricto) para no fallar cuando la variable
// aún no existe; las migraciones requieren DIRECT_URL/DATABASE_URL presentes.
export default defineConfig({
  schema: "prisma/schema.prisma",
  datasource: {
    url: process.env.DIRECT_URL ?? process.env.DATABASE_URL ?? "",
  },
});
