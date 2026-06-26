import { PrismaClient } from "@prisma/client/index";
import { PrismaNeon } from "@prisma/adapter-neon";
import { postgisExtension } from "@/lib/postgis";

// Prisma 7 con driver adapter de Neon (sin engine nativo; apto para serverless/Fluid).
// Singleton para no agotar conexiones con el hot-reload de Next en desarrollo.
const globalForPrisma = globalThis as unknown as {
  prisma: ReturnType<typeof createPrismaClient> | undefined;
};

function createPrismaClient() {
  const adapter = new PrismaNeon({
    connectionString: process.env.DATABASE_URL,
  });
  return new PrismaClient({
    adapter,
    log: process.env.NODE_ENV === "development" ? ["error", "warn"] : ["error"],
  }).$extends(postgisExtension);
}

export const prisma = globalForPrisma.prisma ?? createPrismaClient();

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}
