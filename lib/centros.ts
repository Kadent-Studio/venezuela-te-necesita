import type { StockLevel } from "@prisma/client";
import { stockLevelRank } from "@/lib/labels";
import type { CentroItemDTO } from "@/lib/types";

// Umbral de frescura: pasado este tiempo, el inventario se marca como
// posiblemente desactualizado (el default NECESITA haría ver todo "pedido").
export const STOCK_STALE_MS = 24 * 60 * 60 * 1000;

// Nivel representativo del centro = el ítem más accionable (URGENTE > … > SOBRADO).
// Determina el color del marcador y el orden en listas.
export function centroTopLevel(items: CentroItemDTO[]): StockLevel {
  let top: StockLevel = "SOBRADO";
  for (const it of items) {
    if (stockLevelRank[it.level] > stockLevelRank[top]) top = it.level;
  }
  return top;
}

// Cuántos ítems hay en cada nivel (para resúmenes rápidos).
export function countByLevel(
  items: CentroItemDTO[],
  level: StockLevel,
): number {
  return items.filter((i) => i.level === level).length;
}

export function isStockStale(lastStockUpdatedAt: string): boolean {
  const t = new Date(lastStockUpdatedAt).getTime();
  if (Number.isNaN(t)) return false;
  return Date.now() - t > STOCK_STALE_MS;
}
