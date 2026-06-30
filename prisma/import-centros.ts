import { randomBytes } from "node:crypto";
import { readFileSync } from "node:fs";
import { config as loadEnv } from "dotenv";
import { PrismaClient } from "@prisma/client/index";
import {
  StockLevel,
  type CentroScope,
  type Prisma,
  type SupplyType,
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

const adapter = new PrismaNeon({ connectionString: databaseUrl });
const prisma = new PrismaClient({ adapter });

// ---------------------------------------------------------------------------
// Parser CSV mínimo (maneja comillas y comas/saltos dentro de campos)
// ---------------------------------------------------------------------------

function parseCsv(text: string): string[][] {
  const rows: string[][] = [];
  let field = "";
  let row: string[] = [];
  let inQuotes = false;
  for (let i = 0; i < text.length; i++) {
    const c = text[i];
    if (inQuotes) {
      if (c === '"') {
        if (text[i + 1] === '"') {
          field += '"';
          i++;
        } else inQuotes = false;
      } else field += c;
    } else if (c === '"') inQuotes = true;
    else if (c === ",") {
      row.push(field);
      field = "";
    } else if (c === "\n") {
      row.push(field);
      rows.push(row);
      row = [];
      field = "";
    } else if (c !== "\r") field += c;
  }
  if (field.length || row.length) {
    row.push(field);
    rows.push(row);
  }
  return rows;
}

// ---------------------------------------------------------------------------
// Helpers de mapeo
// ---------------------------------------------------------------------------

const SUPPLY_TYPES: SupplyType[] = [
  "AGUA",
  "ALIMENTOS",
  "MEDICINAS",
  "PANALES",
  "HIGIENE",
  "ROPA",
  "COLCHONES",
  "AGUA_ASEO",
  "COCINA",
  "ENERGIA",
  "LIMPIEZA",
  "OTRO",
];

const clean = (v: string | undefined): string | null => {
  const t = (v ?? "").trim();
  return t.length ? t : null;
};

function toScope(ambito: string | null): CentroScope | null {
  if (!ambito) return null;
  const a = ambito.toLowerCase();
  if (a.startsWith("venez")) return "VENEZUELA";
  if (a.startsWith("exter")) return "EXTERIOR";
  return null;
}

function toDate(v: string | null): Date | null {
  if (!v) return null;
  const d = new Date(v);
  return Number.isNaN(d.getTime()) ? null : d;
}

function toNumber(v: string | null): number | null {
  if (!v) return null;
  const n = Number(v);
  return Number.isFinite(n) ? n : null;
}

function manageToken(): string {
  return randomBytes(24).toString("base64url");
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------

async function main() {
  const file = process.argv[2] ?? "data/acopios.csv";
  const source = process.argv[3] ?? "acopios-csv";

  const rows = parseCsv(readFileSync(file, "utf8"));
  const header = rows[0].map((h) => h.trim());
  const idx = Object.fromEntries(header.map((h, i) => [h, i]));
  const dataRows = rows.slice(1).filter((r) => r.length > 1);

  console.log(`📥 Importando ${dataRows.length} filas de ${file} (source="${source}")`);

  let created = 0;
  let updated = 0;
  let skipped = 0;

  for (const r of dataRows) {
    const get = (col: string) => clean(r[idx[col]]);

    const lat = toNumber(get("lat"));
    const lng = toNumber(get("lng"));
    const name = get("nombre");
    const address = get("direccion") ?? get("ciudad");

    // Sin coordenadas o sin datos mínimos no se puede ubicar en el mapa.
    if (lat == null || lng == null || !name || !address) {
      skipped++;
      continue;
    }

    const scope = toScope(get("ambito"));
    const externalId = get("id");

    const scalars: Omit<Prisma.CentroCreateInput, "manageToken" | "items"> = {
      name,
      scope,
      country:
        get("pais") ?? (scope === "VENEZUELA" ? "Venezuela" : null),
      state: get("estado"),
      city: get("ciudad"),
      latitude: lat,
      longitude: lng,
      address,
      receivesNote: get("recibe"),
      phone: get("telefono"),
      contactHandle: get("contacto"),
      sourceHandle: get("aporte"),
      horario: get("horario"),
      verified: (get("status") ?? "").toLowerCase() === "verificado",
      verificationsCount: toNumber(get("verificaciones")) ?? 0,
      endsAt: toDate(get("fecha_fin")),
      source,
      externalId,
    };

    const createdAt = toDate(get("created_at"));
    if (createdAt) scalars.createdAt = createdAt;

    if (externalId) {
      const existing = await prisma.centro.findUnique({
        where: { source_externalId: { source, externalId } },
        select: { id: true },
      });
      if (existing) {
        await prisma.centro.update({
          where: { id: existing.id },
          data: scalars, // no toca items ni manageToken
        });
        updated++;
        continue;
      }
    }

    await prisma.centro.create({
      data: {
        ...scalars,
        manageToken: manageToken(),
        items: {
          create: SUPPLY_TYPES.map((supplyType) => ({
            supplyType,
            level: StockLevel.NECESITA,
          })),
        },
      },
    });
    created++;
  }

  console.log(
    `✅ Listo — creados: ${created}, actualizados: ${updated}, omitidos: ${skipped}`,
  );
}

main()
  .catch((e) => {
    console.error("❌ Import falló:", e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
