"use client";

import type { StockLevel, SupplyType } from "@prisma/client";
import {
  stockLevelColor,
  stockLevelHint,
  stockLevelLabel,
  stockLevelOrder,
  supplyTypeLabel,
  supplyTypeOrder,
} from "@/lib/labels";
import { Input, Segmented } from "@/components/ui/form";

export type StockState = Record<SupplyType, { level: StockLevel; note: string }>;

// Estado inicial: los 12 ítems en NECESITA (default acordado).
export function initialStockState(): StockState {
  return Object.fromEntries(
    supplyTypeOrder.map((st) => [st, { level: "NECESITA", note: "" }]),
  ) as StockState;
}

// Construye el estado a partir de los ítems que llegan del API.
export function stockStateFromItems(
  items: { supplyType: SupplyType; level: StockLevel; note: string | null }[],
): StockState {
  const base = initialStockState();
  for (const it of items) {
    base[it.supplyType] = { level: it.level, note: it.note ?? "" };
  }
  return base;
}

const levelOptions = stockLevelOrder.map((l) => ({
  value: l,
  label: stockLevelLabel[l],
}));

export function CentroStockEditor({
  value,
  onChange,
}: {
  value: StockState;
  onChange: (next: StockState) => void;
}) {
  function setLevel(supplyType: SupplyType, level: StockLevel) {
    onChange({ ...value, [supplyType]: { ...value[supplyType], level } });
  }
  function setNote(supplyType: SupplyType, note: string) {
    onChange({ ...value, [supplyType]: { ...value[supplyType], note } });
  }

  return (
    <div className="flex flex-col gap-3">
      <p className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-ceniza-3">
        {stockLevelOrder.map((l) => (
          <span key={l} className="inline-flex items-center gap-1.5">
            <span
              aria-hidden
              className="size-2 rounded-full"
              style={{ background: stockLevelColor[l] }}
            />
            {stockLevelLabel[l]}
          </span>
        ))}
      </p>

      <ul className="flex flex-col gap-3">
        {supplyTypeOrder.map((st) => {
          const current = value[st];
          return (
            <li
              key={st}
              className="flex flex-col gap-2 rounded-[var(--radius-input)] border bg-superficie p-3"
              style={{ borderColor: "var(--borde-suave)" }}
            >
              <div className="flex items-center justify-between gap-2">
                <span className="text-sm font-semibold text-ceniza">
                  {supplyTypeLabel[st]}
                </span>
                <span className="text-[11px] text-ceniza-3">
                  {stockLevelHint[current.level]}
                </span>
              </div>
              <Segmented<StockLevel>
                options={levelOptions}
                value={current.level}
                onChange={(l) => setLevel(st, l)}
                colorFor={(l) => stockLevelColor[l]}
              />
              {st === "OTRO" ? (
                <Input
                  value={current.note}
                  onChange={(e) => setNote(st, e.target.value)}
                  placeholder="¿Qué otro insumo? (opcional)"
                  maxLength={300}
                />
              ) : null}
            </li>
          );
        })}
      </ul>
    </div>
  );
}
