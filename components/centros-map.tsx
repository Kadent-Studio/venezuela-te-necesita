"use client";

import dynamic from "next/dynamic";
import { useEffect, useMemo, useRef, useState } from "react";
import type { PublicCentroDTO } from "@/lib/types";
import { stockLevelColor, supplyTypeLabel } from "@/lib/labels";
import { centroTopLevel, isStockStale } from "@/lib/centros";
import { timeAgo } from "@/lib/time";
import { IconClock, IconPin, IconSearch, IconX } from "@/components/ui/icons";
import { StockChip } from "@/components/ui/stock";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  CentrosFilters,
  emptyCentroFilters,
  hasActiveCentroFilters,
  type CentroFilters,
} from "@/components/centros-filters";
import { CentroDetailsSheet } from "@/components/centro-details-sheet";
import { RegistrarCentroButton } from "@/components/registrar-centro-button";
import { useCentrosMap } from "@/lib/hooks";

const LeafletMap = dynamic(
  () => import("@/components/centros-map-leaflet").then((m) => m.CentrosMapLeaflet),
  {
    ssr: false,
    loading: () => <MapSkeleton />,
  },
);

function matchesFilters(c: PublicCentroDTO, f: CentroFilters): boolean {
  const { supplyType, level, scope } = f;
  if (scope && c.scope !== scope) return false;
  if (supplyType && level) {
    return c.items.some((i) => i.supplyType === supplyType && i.level === level);
  }
  if (supplyType) {
    return c.items.some(
      (i) =>
        i.supplyType === supplyType &&
        (i.level === "URGENTE" || i.level === "NECESITA"),
    );
  }
  if (level) {
    return c.items.some((i) => i.level === level);
  }
  return true;
}

export function CentrosMap() {
  const { data, isLoading, isError, refetch } = useCentrosMap();
  const centros = useMemo(() => data ?? [], [data]);
  const [query, setQuery] = useState("");
  const [filters, setFilters] = useState<CentroFilters>(emptyCentroFilters);
  const listRef = useRef<HTMLDivElement>(null);

  const reduceMotion = usePrefersReducedMotion();

  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [sheetOpen, setSheetOpen] = useState(false);

  const filtered = useMemo(() => {
    const q = normalize(query);
    let items = centros.filter((c) => matchesFilters(c, filters));
    if (!q) return items;
    items = items.filter((c) =>
      normalize(
        [
          c.name,
          c.address,
          c.description ?? "",
          c.encargadoName,
          c.items.map((i) => supplyTypeLabel[i.supplyType]).join(" "),
        ].join(" "),
      ).includes(q),
    );
    return items;
  }, [query, centros, filters]);

  const selected = centros.find((c) => c.id === selectedId) ?? null;
  const activeFilters = hasActiveCentroFilters(filters);

  function selectCentro(id: string) {
    setSelectedId(id);
    setSheetOpen(true);
    const row = listRef.current?.querySelector(`[data-centro-id="${id}"]`);
    row?.scrollIntoView({
      block: "nearest",
      behavior: reduceMotion ? "auto" : "smooth",
    });
  }

  return (
    <section className="mx-auto flex w-full max-w-[1600px] flex-1 flex-col gap-5 px-4 py-6 sm:gap-6 sm:px-8 sm:py-12 lg:px-12">
      <header className="flex flex-col gap-4 sm:gap-5">
        <div className="flex flex-col gap-3">
          <span className="inline-flex items-center gap-2 self-start font-mono text-[11px] uppercase tracking-[0.18em] text-ceniza-3">
            <span
              aria-hidden
              className="inline-block size-1.5 animate-pulse rounded-full"
              style={{ background: "var(--color-tierra)" }}
            />
            Centros de acopio · sismo 24-J
          </span>
          <div className="flex flex-wrap items-end justify-between gap-5">
            <h1 className="text-[clamp(1.625rem,6vw,2.75rem)] font-extrabold leading-[1.02] tracking-[-0.025em] text-ceniza">
              Dónde llevar donaciones
            </h1>
            <p className="max-w-md text-sm leading-relaxed text-ceniza-2">
              Filtra por insumo para ver qué centros lo necesitan con urgencia y
              cuáles ya están saturados. Así no se sobre-carga un solo ítem.
            </p>
          </div>
        </div>
        <div
          className="flex flex-col gap-3 rounded-[var(--radius-card)] border bg-superficie p-3 sm:flex-row sm:items-center sm:justify-between sm:p-4"
          style={{ borderColor: "var(--borde)" }}
        >
          <div className="flex flex-wrap items-center gap-x-3 gap-y-2">
            <span className="font-mono text-[10px] uppercase tracking-[0.18em] text-ceniza-3">
              Filtros
            </span>
            <CentrosFilters value={filters} onChange={setFilters} />
          </div>
          <RegistrarCentroButton variant="primary" />
        </div>
      </header>

      <div className="grid flex-1 grid-cols-1 gap-4 sm:gap-6 lg:grid-cols-[1fr_420px] lg:gap-7">
        <div className="flex h-[58vh] min-h-[400px] flex-col overflow-hidden rounded-[var(--radius-card)] border bg-superficie sm:h-[560px] lg:h-[640px]">
          <div className="flex flex-wrap items-center justify-between gap-3 border-b bg-hueso/60 px-4 py-3 sm:px-5 sm:py-4">
            <p className="text-sm text-ceniza-2">
              <span className="font-mono font-bold tabular-nums text-ceniza">
                {isLoading ? "—" : filtered.length}
              </span>
              <span className="text-ceniza-3">
                {" "}
                {isLoading
                  ? "cargando"
                  : `de ${centros.length} ${centros.length === 1 ? "centro" : "centros"}`}
              </span>
            </p>
          </div>
          <div className="relative flex-1">
            {isLoading ? (
              <MapSkeleton />
            ) : isError ? (
              <MapNotice
                title="No se pudo cargar el mapa"
                body="Revisa la conexión e intenta de nuevo."
                action="Reintentar"
                onAction={() => void refetch()}
              />
            ) : centros.length === 0 ? (
              <MapNotice
                title="Sin centros todavía"
                body="Registra el primero para que los donantes sepan dónde llevar ayuda."
              />
            ) : (
              <LeafletMap
                centros={filtered}
                selectedId={selectedId}
                reduceMotion={reduceMotion}
                onSelect={selectCentro}
              />
            )}
          </div>
        </div>

        <aside className="flex h-[70dvh] min-h-[420px] w-full flex-col overflow-hidden rounded-[var(--radius-card)] border bg-superficie sm:h-[560px] lg:h-[640px]">
          <div className="border-b bg-hueso/60 p-4 sm:p-5">
            <label className="flex h-12 items-center gap-2.5 rounded-[var(--radius-input)] border bg-polvo px-3.5 focus-within:outline focus-within:outline-2 focus-within:outline-offset-2 focus-within:outline-[var(--foco)]">
              <IconSearch className="size-4 shrink-0 text-ceniza-3" />
              <input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Buscar centro, sector o insumo"
                className="h-full min-w-0 flex-1 bg-transparent text-sm font-medium text-ceniza outline-none placeholder:text-ceniza-4"
              />
              {query ? (
                <button
                  type="button"
                  onClick={() => setQuery("")}
                  className="text-ceniza-3 hover:text-ceniza"
                  aria-label="Limpiar búsqueda"
                >
                  <IconX className="size-4" />
                </button>
              ) : null}
            </label>
          </div>

          <ScrollArea viewportRef={listRef} className="flex-1">
            <div className="p-3">
              {isLoading ? (
                <SidebarSkeleton />
              ) : isError ? (
                <SidebarNotice text="No se pudieron cargar los centros." />
              ) : filtered.length === 0 ? (
                <SidebarNotice
                  text={
                    query
                      ? "Ningún centro coincide con la búsqueda."
                      : activeFilters
                        ? "Ningún centro coincide con los filtros."
                        : "Aún no hay centros."
                  }
                />
              ) : (
                <div className="flex flex-col gap-2.5">
                  {filtered.map((centro) => (
                    <CentroListItem
                      key={centro.id}
                      centro={centro}
                      filterSupply={filters.supplyType}
                      selected={centro.id === selectedId}
                      onClick={() => selectCentro(centro.id)}
                    />
                  ))}
                </div>
              )}
            </div>
          </ScrollArea>
        </aside>
      </div>

      <CentroDetailsSheet
        centro={selected}
        open={sheetOpen}
        onOpenChange={setSheetOpen}
      />
    </section>
  );
}

function CentroListItem({
  centro,
  filterSupply,
  selected,
  onClick,
}: {
  centro: PublicCentroDTO;
  filterSupply: CentroFilters["supplyType"];
  selected: boolean;
  onClick: () => void;
}) {
  const top = centroTopLevel(centro.items);
  const color = stockLevelColor[top];
  const stale = isStockStale(centro.lastStockUpdatedAt);
  // Si hay filtro de insumo, muestra el nivel de ESE insumo; si no, el más urgente.
  const focus = filterSupply
    ? centro.items.find((i) => i.supplyType === filterSupply)
    : null;
  const chipLevel = focus?.level ?? top;
  const urgent = centro.items.filter((i) => i.level === "URGENTE");

  return (
    <button
      type="button"
      data-centro-id={centro.id}
      onClick={onClick}
      className="group w-full rounded-[var(--radius-input)] border p-3.5 text-left transition-[background-color,border-color,transform] duration-150 ease-out active:scale-[0.99]"
      style={
        selected
          ? {
              borderColor: color,
              background: `color-mix(in srgb, ${color} 8%, var(--superficie))`,
            }
          : { borderColor: "var(--borde-suave)", background: "var(--superficie)" }
      }
    >
      <div className="flex items-start justify-between gap-2">
        <p className="min-w-0 flex-1 text-sm font-semibold leading-snug text-ceniza">
          {centro.name}
        </p>
        <StockChip level={chipLevel} />
      </div>

      <p className="mt-1.5 line-clamp-1 text-xs text-ceniza-3">{centro.address}</p>

      {urgent.length > 0 ? (
        <p className="mt-2 line-clamp-1 text-xs text-ceniza-2">
          <span className="font-semibold" style={{ color: stockLevelColor.URGENTE }}>
            Urgente:
          </span>{" "}
          {urgent.map((i) => supplyTypeLabel[i.supplyType]).join(", ")}
        </p>
      ) : null}

      <div className="mt-3 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-ceniza-3">
        <span className="inline-flex items-center gap-1.5">
          <IconClock className="size-3.5" />
          {stale ? "desactualizado" : timeAgo(centro.lastStockUpdatedAt)}
        </span>
        <span className="inline-flex items-center gap-1.5 font-mono tabular-nums">
          <IconPin className="size-3.5" />
          {centro.latitude.toFixed(4)}, {centro.longitude.toFixed(4)}
        </span>
      </div>
    </button>
  );
}

function MapSkeleton() {
  return (
    <div className="flex h-full min-h-[420px] flex-col justify-end bg-polvo">
      <div className="grid h-full grid-cols-4 grid-rows-4 gap-px opacity-40">
        {Array.from({ length: 16 }).map((_, i) => (
          <div key={i} className="bg-superficie" />
        ))}
      </div>
    </div>
  );
}

function SidebarSkeleton() {
  return (
    <div className="flex flex-col gap-2.5">
      {Array.from({ length: 6 }).map((_, i) => (
        <div
          key={i}
          className="h-28 animate-pulse rounded-[var(--radius-input)] border bg-polvo"
        />
      ))}
    </div>
  );
}

function MapNotice({
  title,
  body,
  action,
  onAction,
}: {
  title: string;
  body: string;
  action?: string;
  onAction?: () => void;
}) {
  return (
    <div className="flex h-full min-h-[420px] items-center justify-center bg-polvo p-8 text-center">
      <div className="max-w-sm">
        <h2 className="text-base font-bold text-ceniza">{title}</h2>
        <p className="mt-1.5 text-sm text-ceniza-2">{body}</p>
        {action && onAction ? (
          <button
            type="button"
            onClick={onAction}
            className="mt-5 rounded-[var(--radius-input)] px-4 py-2 text-sm font-bold text-[var(--superficie)] transition-transform duration-150 ease-out active:scale-[0.98]"
            style={{ background: "var(--color-tierra)" }}
          >
            {action}
          </button>
        ) : null}
      </div>
    </div>
  );
}

function SidebarNotice({ text }: { text: string }) {
  return (
    <div className="flex h-48 items-center justify-center rounded-[var(--radius-input)] border border-dashed bg-polvo px-4 text-center text-sm text-ceniza-3">
      {text}
    </div>
  );
}

function normalize(value: string) {
  return value
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .toLowerCase()
    .trim();
}

function usePrefersReducedMotion() {
  const [reduced, setReduced] = useState(() =>
    typeof window === "undefined"
      ? false
      : window.matchMedia("(prefers-reduced-motion: reduce)").matches,
  );

  useEffect(() => {
    const media = window.matchMedia("(prefers-reduced-motion: reduce)");
    const onChange = () => setReduced(media.matches);
    media.addEventListener("change", onChange);
    return () => media.removeEventListener("change", onChange);
  }, []);

  return reduced;
}
