import { config as loadEnv } from "dotenv";
import { PrismaClient } from "@prisma/client/index";
import type {
  NeedType,
  Urgency,
  AccessStatus,
  Stage,
  DiscardReason,
} from "@prisma/client";
import { PrismaNeon } from "@prisma/adapter-neon";

loadEnv({ path: ".env.local" });
loadEnv();

const databaseUrl =
  process.env.DIRECT_URL ??
  process.env.POSTGRES_URL_NON_POOLING ??
  process.env.DATABASE_URL_UNPOOLED ??
  process.env.DATABASE_URL ??
  "";

const adapter = new PrismaNeon({
  connectionString: databaseUrl,
});
const prisma = new PrismaClient({
  adapter,
});

// ---------------------------------------------------------------------------
// Datos semilla realistas para Venezuela
// ---------------------------------------------------------------------------

const NEED_TYPES: NeedType[] = [
  "RESCATE",
  "MEDICO",
  "AGUA",
  "COMIDA",
  "REFUGIO",
  "OTRO",
];
const URGENCIES: Urgency[] = ["CRITICA", "ALTA", "MEDIA", "BAJA"];
const ACCESS_STATUSES: AccessStatus[] = [
  "TRANSITABLE",
  "BLOQUEADA",
  "VEHICULO_ESPECIAL",
  "DESCONOCIDA",
];
const STAGES: Stage[] = ["NUEVO", "EN_ATENCION", "RESUELTO", "DESCARTADO"];
const DISCARD_REASONS: DiscardReason[] = [
  "DUPLICADO",
  "FALSO",
  "FUERA_DE_ALCANCE",
];

const NAMES = [
  "María Rodríguez",
  "José Hernández",
  "Ana Martínez",
  "Carlos González",
  "Rosa Pérez",
  "Luis García",
  "Carmen López",
  "Jorge Sánchez",
  "Marta Díaz",
  "Pedro Ramírez",
  "Elena Torres",
  "Ricardo Castillo",
  "Sofía Medina",
  "Andrés Rojas",
  "Laura Moreno",
  "Fernando Álvarez",
  "Valentina Silva",
  "Diego Contreras",
  "Isabel Romero",
  "Alejandro Mendoza",
  "Gabriela Ortiz",
  "Manuel Guerrero",
  "Paola Vargas",
  "Sergio Herrera",
  "Adriana Peña",
  "Héctor Castro",
  "Daniela Delgado",
  "Óscar Paredes",
  "Katherine Rivas",
  "Miguel Ángel Flores",
  "Natalia Suárez",
  "Rubén Acosta",
  "Andreína Núñez",
  "Francisco Figueroa",
  "Stephanie Córdova",
  "Antonio León",
  "Fabiola Rangel",
  "Jesús Marcano",
  "Lorena Campos",
  "Enrique Molina",
];

const PHONE_PREFIXES = ["0412", "0414", "0416", "0424", "0426"];

const SECTORS: [string, number, number][] = [
  // [sector + referencia, lat, lng]
  ["Caracas, Dtto. Capital — El Silencio", 10.506, -66.915],
  ["Caracas — Petare", 10.476, -66.803],
  ["Caracas — Catia", 10.514, -66.94],
  ["Caracas — Baruta", 10.433, -66.873],
  ["Maracaibo, Zulia — Centro", 10.64, -71.63],
  ["Maracaibo — San Francisco", 10.568, -71.662],
  ["Valencia, Carabobo — Naguanagua", 10.247, -68.005],
  ["Valencia — Tocuyito", 10.091, -68.088],
  ["Barquisimeto, Lara — Centro", 10.063, -69.334],
  ["Barquisimeto — Cabudare", 10.023, -69.265],
  ["Ciudad Guayana, Bolívar — Puerto Ordaz", 8.292, -62.712],
  ["Ciudad Guayana — San Félix", 8.334, -62.716],
  ["Maturín, Monagas — Centro", 9.747, -63.176],
  ["Barcelona, Anzoátegui — Centro", 10.133, -64.686],
  ["Puerto La Cruz, Anzoátegui — Paseo Colón", 10.204, -64.637],
  ["Maracay, Aragua — Centro", 10.246, -67.596],
  ["Maracay — Caña de Azúcar", 10.28, -67.634],
  ["Cumaná, Sucre — Centro", 10.455, -64.17],
  ["Mérida, Mérida — Centro", 8.598, -71.142],
  ["Mérida — Ejido", 8.548, -71.238],
  ["San Cristóbal, Táchira — Centro", 7.767, -72.226],
  ["San Cristóbal — Táriba", 7.818, -72.226],
  ["Coro, Falcón — Centro", 11.406, -69.666],
  ["Acarigua, Portuguesa — Centro", 9.558, -69.196],
  ["Guanare, Portuguesa — Centro", 9.041, -69.747],
  ["Barinas, Barinas — Centro", 8.623, -70.209],
  ["Trujillo, Trujillo — Centro", 9.365, -70.433],
  ["Valera, Trujillo — Centro", 9.32, -70.607],
  ["Los Teques, Miranda — Centro", 10.345, -67.037],
  ["La Guaira, La Guaira — Centro", 10.597, -66.925],
  ["Porlamar, Nueva Esparta — Centro", 10.959, -63.85],
  ["Punto Fijo, Falcón — Centro", 11.696, -70.196],
  ["Ciudad Bolívar, Bolívar — Centro", 8.123, -63.549],
  ["El Tigre, Anzoátegui — Centro", 8.887, -64.253],
  ["Calabozo, Guárico — Centro", 8.927, -67.427],
  ["San Juan de los Morros, Guárico — Centro", 9.913, -67.358],
  ["Tucupita, Delta Amacuro — Centro", 9.059, -62.05],
  ["Puerto Ayacucho, Amazonas — Centro", 5.663, -67.626],
  ["Carora, Lara — Centro", 10.165, -70.082],
  ["El Tocuyo, Lara — Centro", 9.786, -69.792],
];

const DESCRIPTIONS = [
  null,
  null,
  "La comunidad no tiene acceso a agua potable desde hace una semana.",
  "Varias familias perdieron sus viviendas tras las lluvias. Necesitan refugio.",
  "El sector está incomunicado por derrumbe en la vía principal.",
  "Hay varios niños con desnutrición aguda en el barrio.",
  "No hay servicio eléctrico desde hace 10 días, se necesita apoyo.",
  "Personas mayores atrapadas en el edificio sin poder evacuar.",
  "La única vía de acceso está bloqueada por escombros.",
  "Centro de salud local no tiene insumos básicos para atender emergencias.",
  "Familias enteras durmiendo a la intemperie tras el desalojo.",
  "La comunidad reporta múltiples casos de dengue en la última semana.",
  "Deslave afectó varias viviendas. Hay heridos.",
  "Se necesita transporte para evacuar a 30 personas del sector.",
  "Filtraciones de aguas negras en la calle principal, riesgo sanitario.",
  null,
  null,
  "Bombona de agua comunal dañada, llevan días sin suministro.",
  "Incendio forestal se acerca a las viviendas. Se requiere evacuación.",
];

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function pick<T>(arr: readonly T[]): T {
  return arr[Math.floor(Math.random() * arr.length)]!;
}

function pickN<T>(arr: readonly T[], min: number, max: number): T[] {
  const n = min + Math.floor(Math.random() * (max - min + 1));
  const shuffled = [...arr].sort(() => Math.random() - 0.5);
  return shuffled.slice(0, Math.min(n, arr.length));
}

function randomPhone(): string {
  const prefix = pick(PHONE_PREFIXES);
  const suffix = String(Math.floor(1000000 + Math.random() * 9000000));
  return `${prefix}-${suffix}`;
}

function randomDate(start: Date, end: Date): Date {
  const t = start.getTime() + Math.random() * (end.getTime() - start.getTime());
  return new Date(t);
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------

async function main() {
  console.log("🌱 Seeding 1.000 reports…");

  const now = new Date();
  const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

  const batchSize = 100;
  let inserted = 0;

  for (let batch = 0; batch < 10; batch++) {
    const data: Array<{
      latitude: number;
      longitude: number;
      accuracyMeters: number;
      address: string;
      needTypes: NeedType[];
      urgency: Urgency;
      description: string | null;
      peopleCount: number;
      hasInjured: boolean;
      hasChildren: boolean;
      hasElderly: boolean;
      access: AccessStatus;
      contactName: string;
      contactPhone: string;
      createdAt: Date;
      updatedAt: Date;
      verified: boolean;
      stage: Stage;
      discardReason: DiscardReason | null;
    }> = [];

    for (let i = 0; i < batchSize; i++) {
      const [baseAddress, baseLat, baseLng] = pick(SECTORS);
      const latOffset = (Math.random() - 0.5) * 0.04;
      const lngOffset = (Math.random() - 0.5) * 0.04;

      const createdAt = randomDate(thirtyDaysAgo, now);
      const updatedAt = randomDate(createdAt, now);
      const stage = pick(STAGES);
      const verified = stage !== "NUEVO" && Math.random() < 0.6;
      const urgency = pick(URGENCIES);

      data.push({
        latitude: +(baseLat! + latOffset).toFixed(6),
        longitude: +(baseLng! + lngOffset).toFixed(6),
        accuracyMeters: pick([5, 10, 15, 20, 50, 100, null])!,
        address: baseAddress!,
        needTypes: pickN(NEED_TYPES, 1, 3),
        urgency,
        description: pick(DESCRIPTIONS),
        peopleCount: pick([1, 1, 1, 2, 2, 3, 3, 4, 5, 6, 8, 10, 15]),
        hasInjured: Math.random() < 0.15,
        hasChildren: Math.random() < 0.35,
        hasElderly: Math.random() < 0.3,
        access: pick(ACCESS_STATUSES),
        contactName: pick(NAMES),
        contactPhone: randomPhone(),
        createdAt,
        updatedAt,
        verified,
        stage,
        discardReason: stage === "DESCARTADO" ? pick(DISCARD_REASONS) : null,
      });
    }

    await prisma.report.createMany({ data });
    inserted += batchSize;
    console.log(`  ✓ ${inserted} / 1000`);
  }

  console.log("✅ Seeding complete — 1.000 reports inserted.");
}

main()
  .catch((e) => {
    console.error("❌ Seed failed:", e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
