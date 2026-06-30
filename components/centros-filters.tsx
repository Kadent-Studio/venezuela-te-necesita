"use client";

import { useState } from "react";
import type { CentroScope, StockLevel, SupplyType } from "@prisma/client";
import { Check, ChevronDown, X } from "lucide-react";
import {
  scopeLabel,
  stockLevelColor,
  stockLevelLabel,
  stockLevelOrder,
  supplyTypeLabel,
  supplyTypeOrder,
} from "@/lib/labels";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";

export interface CentroFilters {
  supplyType: SupplyType | null;
  level: StockLevel | null;
  scope: CentroScope | null;
}

export const emptyCentroFilters: CentroFilters = {
  supplyType: null,
  level: null,
  scope: null,
};

export function hasActiveCentroFilters(f: CentroFilters): boolean {
  return f.supplyType !== null || f.level !== null || f.scope !== null;
}

type Option<T extends string> = {
  value: T;
  label: string;
  dot?: string;
};

const supplyOptions: Option<SupplyType>[] = supplyTypeOrder.map((s) => ({
  value: s,
  label: supplyTypeLabel[s],
}));

const levelOptions: Option<StockLevel>[] = stockLevelOrder.map((l) => ({
  value: l,
  label: stockLevelLabel[l],
  dot: stockLevelColor[l],
}));

const scopeOptions: Option<CentroScope>[] = (
  ["VENEZUELA", "EXTERIOR"] as CentroScope[]
).map((s) => ({ value: s, label: scopeLabel[s] }));

export function CentrosFilters({
  value,
  onChange,
}: {
  value: CentroFilters;
  onChange: (next: CentroFilters) => void;
}) {
  const active = hasActiveCentroFilters(value);
  const activeCount =
    (value.supplyType ? 1 : 0) + (value.level ? 1 : 0) + (value.scope ? 1 : 0);

  return (
    <div className="flex flex-wrap items-center gap-2">
      <FacetPopover<CentroScope>
        name="Ámbito"
        options={scopeOptions}
        value={value.scope}
        onChange={(v) => onChange({ ...value, scope: v })}
      />
      <FacetPopover<SupplyType>
        name="Insumo"
        options={supplyOptions}
        value={value.supplyType}
        onChange={(v) => onChange({ ...value, supplyType: v })}
      />
      <FacetPopover<StockLevel>
        name="Nivel"
        options={levelOptions}
        value={value.level}
        onChange={(v) => onChange({ ...value, level: v })}
        renderOption={(opt) => (
          <span className="flex items-center gap-2">
            <span
              aria-hidden
              className="size-2 rounded-full"
              style={{ background: opt.dot }}
            />
            {opt.label}
          </span>
        )}
      />

      {active ? (
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={() => onChange(emptyCentroFilters)}
          className="ml-auto h-11 gap-1 px-3 text-[13px] font-semibold text-ceniza-2 hover:text-ceniza sm:h-8 sm:px-2 sm:text-xs"
        >
          <X className="size-3.5" />
          Limpiar {activeCount}
        </Button>
      ) : null}
    </div>
  );
}

function FacetPopover<T extends string>({
  name,
  options,
  value,
  onChange,
  renderOption,
}: {
  name: string;
  options: Option<T>[];
  value: T | null;
  onChange: (next: T | null) => void;
  renderOption?: (opt: Option<T>) => React.ReactNode;
}) {
  const [open, setOpen] = useState(false);
  const current = value ? options.find((o) => o.value === value) : null;
  const isActive = current != null;

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          type="button"
          variant="outline"
          size="sm"
          role="combobox"
          aria-expanded={open}
          className={cn(
            "h-11 sm:h-8 justify-between gap-2 rounded-full border-[var(--borde)] bg-transparent px-4 sm:px-3 text-[13px] sm:text-xs font-semibold text-ceniza-2 hover:bg-polvo hover:text-ceniza",
            isActive &&
              "border-ceniza bg-ceniza text-[var(--superficie)] hover:bg-ceniza hover:text-[var(--superficie)]",
          )}
        >
          <span className="flex items-center gap-2">
            {current?.dot ? (
              <span
                aria-hidden
                className="size-1.5 rounded-full"
                style={{ background: current.dot }}
              />
            ) : null}
            <span className="font-mono text-[10px] uppercase tracking-[0.14em] opacity-70">
              {name}
            </span>
            {current ? (
              <span className="font-sans text-xs font-bold normal-case tracking-normal">
                {current.label}
              </span>
            ) : null}
          </span>
          <ChevronDown className="size-3.5 opacity-60" />
        </Button>
      </PopoverTrigger>
      <PopoverContent align="start" sideOffset={6} className="w-60 p-0">
        <Command>
          <CommandInput
            placeholder={`Buscar ${name.toLowerCase()}…`}
            className="h-9"
          />
          <CommandList>
            <CommandEmpty>Sin coincidencias.</CommandEmpty>
            <CommandGroup>
              {options.map((opt) => {
                const selected = value === opt.value;
                return (
                  <CommandItem
                    key={opt.value}
                    value={opt.label}
                    onSelect={() => {
                      onChange(selected ? null : opt.value);
                      setOpen(false);
                    }}
                  >
                    {renderOption ? renderOption(opt) : opt.label}
                    <Check
                      className={cn(
                        "ml-auto size-4",
                        selected ? "opacity-100" : "opacity-0",
                      )}
                    />
                  </CommandItem>
                );
              })}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}
