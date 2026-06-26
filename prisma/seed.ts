import { config as loadEnv } from "dotenv";
import { faker } from "@faker-js/faker/locale/es";
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
// Semilla con faker — Venezuela
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

// Sectores reales de Venezuela con coordenadas de referencia.
const SECTORS = [
  { address: "Caracas, Dtto. Capital — El Silencio", lat: 10.506, lng: -66.915 },
  { address: "Caracas — Petare", lat: 10.476, lng: -66.803 },
  { address: "Caracas — Catia", lat: 10.514, lng: -66.94 },
  { address: "Caracas — Baruta", lat: 10.433, lng: -66.873 },
  { address: "Maracaibo, Zulia — Centro", lat: 10.64, lng: -71.63 },
  { address: "Maracaibo — San Francisco", lat: 10.568, lng: -71.662 },
  { address: "Valencia, Carabobo — Naguanagua", lat: 10.247, lng: -68.005 },
  { address: "Valencia — Tocuyito", lat: 10.091, lng: -68.088 },
  { address: "Barquisimeto, Lara — Centro", lat: 10.063, lng: -69.334 },
  { address: "Barquisimeto — Cabudare", lat: 10.023, lng: -69.265 },
  { address: "Ciudad Guayana, Bolívar — Puerto Ordaz", lat: 8.292, lng: -62.712 },
  { address: "Ciudad Guayana — San Félix", lat: 8.334, lng: -62.716 },
  { address: "Maturín, Monagas — Centro", lat: 9.747, lng: -63.176 },
  { address: "Barcelona, Anzoátegui — Centro", lat: 10.133, lng: -64.686 },
  { address: "Puerto La Cruz, Anzoátegui — Paseo Colón", lat: 10.204, lng: -64.637 },
  { address: "Maracay, Aragua — Centro", lat: 10.246, lng: -67.596 },
  { address: "Maracay — Caña de Azúcar", lat: 10.28, lng: -67.634 },
  { address: "Cumaná, Sucre — Centro", lat: 10.455, lng: -64.17 },
  { address: "Mérida, Mérida — Centro", lat: 8.598, lng: -71.142 },
  { address: "Mérida — Ejido", lat: 8.548, lng: -71.238 },
  { address: "San Cristóbal, Táchira — Centro", lat: 7.767, lng: -72.226 },
  { address: "San Cristóbal — Táriba", lat: 7.818, lng: -72.226 },
  { address: "Coro, Falcón — Centro", lat: 11.406, lng: -69.666 },
  { address: "Acarigua, Portuguesa — Centro", lat: 9.558, lng: -69.196 },
  { address: "Guanare, Portuguesa — Centro", lat: 9.041, lng: -69.747 },
  { address: "Barinas, Barinas — Centro", lat: 8.623, lng: -70.209 },
  { address: "Trujillo, Trujillo — Centro", lat: 9.365, lng: -70.433 },
  { address: "Valera, Trujillo — Centro", lat: 9.32, lng: -70.607 },
  { address: "Los Teques, Miranda — Centro", lat: 10.345, lng: -67.037 },
  { address: "La Guaira, La Guaira — Centro", lat: 10.597, lng: -66.925 },
  { address: "Porlamar, Nueva Esparta — Centro", lat: 10.959, lng: -63.85 },
  { address: "Punto Fijo, Falcón — Centro", lat: 11.696, lng: -70.196 },
  { address: "Ciudad Bolívar, Bolívar — Centro", lat: 8.123, lng: -63.549 },
  { address: "El Tigre, Anzoátegui — Centro", lat: 8.887, lng: -64.253 },
  { address: "Calabozo, Guárico — Centro", lat: 8.927, lng: -67.427 },
  { address: "San Juan de los Morros, Guárico — Centro", lat: 9.913, lng: -67.358 },
  { address: "Tucupita, Delta Amacuro — Centro", lat: 9.059, lng: -62.05 },
  { address: "Puerto Ayacucho, Amazonas — Centro", lat: 5.663, lng: -67.626 },
  { address: "Carora, Lara — Centro", lat: 10.165, lng: -70.082 },
  { address: "El Tocuyo, Lara — Centro", lat: 9.786, lng: -69.792 },
];

// ---------------------------------------------------------------------------
// Teléfono venezolano
// ---------------------------------------------------------------------------

const VE_PREFIXES = ["0412", "0414", "0416", "0424", "0426"];

function vePhone(): string {
  return `${faker.helpers.arrayElement(VE_PREFIXES)}-${faker.string.numeric(7)}`;
}

// ---------------------------------------------------------------------------
// Descripciones realistas en español
// ---------------------------------------------------------------------------

function generateDescription(): string | null {
  if (!faker.datatype.boolean(0.5)) return null;
  return faker.helpers.arrayElement([
    `La comunidad no tiene acceso a agua potable desde hace ${faker.number.int({ min: 3, max: 21 })} días.`,
    `Varias familias perdieron sus viviendas tras las lluvias. Necesitan ${faker.helpers.arrayElement(["refugio", "alimentos", "ropa", "colchonetas"])}.`,
    `El sector está incomunicado por ${faker.helpers.arrayElement(["derrumbe", "deslave", "crecida del río"])} en la vía principal.`,
    `Hay ${faker.number.int({ min: 5, max: 50 })} niños con desnutrición aguda en el barrio.`,
    `No hay servicio eléctrico desde hace ${faker.number.int({ min: 5, max: 20 })} días, se necesita apoyo.`,
    `${faker.number.int({ min: 3, max: 15 })} personas mayores atrapadas sin poder evacuar.`,
    `La única vía de acceso está bloqueada por escombros.`,
    `Centro de salud no tiene insumos básicos para atender emergencias.`,
    `Familias enteras durmiendo a la intemperie tras el desalojo.`,
    `Se reportan ${faker.number.int({ min: 5, max: 40 })} casos de ${faker.helpers.arrayElement(["dengue", "malaria", "cólera", "diarrea aguda", "desnutrición"])} en la última semana.`,
    `Deslave afectó ${faker.number.int({ min: 5, max: 60 })} viviendas. Hay heridos.`,
    `Se necesita transporte para evacuar a ${faker.number.int({ min: 10, max: 100 })} personas del sector.`,
    `Filtraciones de aguas negras en la calle principal, riesgo sanitario crítico.`,
    `Bombona de agua comunal dañada, llevan ${faker.number.int({ min: 3, max: 15 })} días sin suministro.`,
    `Incendio forestal se acerca a las viviendas. Se requiere evacuación urgente.`,
    `${faker.number.int({ min: 10, max: 200 })} familias necesitan ${faker.helpers.arrayElement(["comida", "agua potable", "pañales", "medicinas", "lonas para techo"])} con urgencia.`,
  ]);
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------

async function main() {
  console.log("🌱 Seeding 1.000 reports…");

  const now = new Date();
  const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
  faker.seed(42);

  const batchSize = 100;
  let inserted = 0;

  for (let batch = 0; batch < 10; batch++) {
    const data: Array<{
      latitude: number;
      longitude: number;
      accuracyMeters: number | null;
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
      const sector = faker.helpers.arrayElement(SECTORS);
      const lat = +(sector.lat + faker.number.float({ min: -0.02, max: 0.02 })).toFixed(6);
      const lng = +(sector.lng + faker.number.float({ min: -0.02, max: 0.02 })).toFixed(6);

      const createdAt = faker.date.between({ from: thirtyDaysAgo, to: now });
      const updatedAt = faker.date.between({ from: createdAt, to: now });
      const stage = faker.helpers.arrayElement(STAGES);
      const verified = stage !== "NUEVO" && faker.datatype.boolean(0.6);

      data.push({
        latitude: lat,
        longitude: lng,
        accuracyMeters: faker.helpers.arrayElement([5, 10, 15, 20, 50, 100, null]),
        address: sector.address,
        needTypes: faker.helpers.arrayElements(NEED_TYPES, { min: 1, max: 3 }),
        urgency: faker.helpers.arrayElement(URGENCIES),
        description: generateDescription(),
        peopleCount: faker.helpers.arrayElement([1, 1, 1, 2, 2, 3, 3, 4, 5, 6, 8, 10, 15]),
        hasInjured: faker.datatype.boolean(0.15),
        hasChildren: faker.datatype.boolean(0.35),
        hasElderly: faker.datatype.boolean(0.3),
        access: faker.helpers.arrayElement(ACCESS_STATUSES),
        contactName: faker.person.fullName(),
        contactPhone: vePhone(),
        createdAt,
        updatedAt,
        verified,
        stage,
        discardReason: stage === "DESCARTADO" ? faker.helpers.arrayElement(DISCARD_REASONS) : null,
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
