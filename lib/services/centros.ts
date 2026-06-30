import { randomBytes } from "node:crypto";
import { prisma } from "@/lib/prisma";
import { supplyTypeOrder } from "@/lib/labels";
import type {
  CreateCentroInput,
  ListCentrosQuery,
  UpdateCentroInput,
  UpdateCentroItemsInput,
} from "@/lib/schemas";
import type { PublicCentro } from "@/lib/serialize";
import { toPublicCentro, toPublicCentros } from "@/lib/serialize";
import { StockLevel, type Prisma } from "@prisma/client";
import { ServiceResult } from "./lib";

export interface PaginatedCentros {
  items: PublicCentro[];
  nextCursor: string | null;
}

// Enlace de gestión: token aleatorio de alta entropía (url-safe).
function generateManageToken(): string {
  return randomBytes(24).toString("base64url");
}

// ---------------------------------------------------------------------------
// Obtener un centro por ID
// ---------------------------------------------------------------------------

export async function getCentroById(
  id: string,
): Promise<ServiceResult<PublicCentro>> {
  const centro = await prisma.centro.findUnique({
    where: { id },
    include: { items: true },
  });

  if (!centro) {
    return { ok: false, error: "Centro no encontrado", status: 404 };
  }

  return { ok: true, data: toPublicCentro(centro) };
}

// ---------------------------------------------------------------------------
// Listar centros (paginado, con filtro opcional por ítem/nivel)
// ---------------------------------------------------------------------------

export async function listCentros(
  params: ListCentrosQuery,
): Promise<ServiceResult<PaginatedCentros>> {
  const { supplyType, level, scope, country, cursor, limit } = params;

  const where: Prisma.CentroWhereInput = {
    ...(supplyType
      ? { items: { some: { supplyType, ...(level ? { level } : {}) } } }
      : {}),
    ...(scope ? { scope } : {}),
    ...(country ? { country } : {}),
  };

  const rows = await prisma.centro.findMany({
    where,
    include: { items: true },
    orderBy: [{ createdAt: "desc" }, { id: "desc" }],
    take: limit + 1,
    ...(cursor ? { cursor: { id: cursor }, skip: 1 } : {}),
  });

  const hasMore = rows.length > limit;
  const items = hasMore ? rows.slice(0, limit) : rows;
  const nextCursor = hasMore ? items[items.length - 1].id : null;

  return { ok: true, data: { items: toPublicCentros(items), nextCursor } };
}

// ---------------------------------------------------------------------------
// Crear un centro (siembra los 12 ítems en NECESITA + genera enlace de gestión)
// ---------------------------------------------------------------------------

export async function createCentro(
  input: CreateCentroInput,
): Promise<ServiceResult<{ id: string; manageToken: string }>> {
  const { items: itemInputs, ...scalars } = input;

  // Sobrescrituras enviadas desde el formulario, por tipo de ítem.
  const overrides = new Map(itemInputs?.map((i) => [i.supplyType, i]) ?? []);

  // Siempre los 12 ítems del catálogo; por defecto NECESITA.
  const items = supplyTypeOrder.map((supplyType) => {
    const o = overrides.get(supplyType);
    return {
      supplyType,
      level: o?.level ?? StockLevel.NECESITA,
      note: o?.note ?? null,
    };
  });

  const manageToken = generateManageToken();

  const created = await prisma.centro.create({
    data: {
      ...scalars,
      manageToken,
      items: { create: items },
    },
    select: { id: true },
  });

  return { ok: true, data: { id: created.id, manageToken } };
}

// ---------------------------------------------------------------------------
// Verificación del enlace de gestión (token por centro, sin login)
// ---------------------------------------------------------------------------

async function assertManageToken(
  id: string,
  token: string | undefined,
): Promise<ServiceResult<true>> {
  if (!token) {
    return { ok: false, error: "Falta el enlace de gestión", status: 403 };
  }
  const centro = await prisma.centro.findUnique({
    where: { id },
    select: { manageToken: true },
  });
  if (!centro) {
    return { ok: false, error: "Centro no encontrado", status: 404 };
  }
  if (centro.manageToken !== token) {
    return { ok: false, error: "Enlace de gestión inválido", status: 403 };
  }
  return { ok: true, data: true };
}

// ---------------------------------------------------------------------------
// Actualizar campos operativos (encargado, vía token)
// ---------------------------------------------------------------------------

export async function updateCentro(
  id: string,
  token: string | undefined,
  data: UpdateCentroInput,
): Promise<ServiceResult<PublicCentro>> {
  const auth = await assertManageToken(id, token);
  if (!auth.ok) return auth;

  await prisma.centro.update({ where: { id }, data });
  return getCentroById(id);
}

// ---------------------------------------------------------------------------
// Actualizar niveles del semáforo (encargado, vía token)
// ---------------------------------------------------------------------------

export async function updateCentroItems(
  id: string,
  token: string | undefined,
  input: UpdateCentroItemsInput,
): Promise<ServiceResult<PublicCentro>> {
  const auth = await assertManageToken(id, token);
  if (!auth.ok) return auth;

  await prisma.$transaction([
    ...input.items.map((it) =>
      prisma.centroItem.updateMany({
        where: { centroId: id, supplyType: it.supplyType },
        data: { level: it.level, note: it.note ?? null },
      }),
    ),
    prisma.centro.update({
      where: { id },
      data: { lastStockUpdatedAt: new Date() },
    }),
  ]);

  return getCentroById(id);
}
