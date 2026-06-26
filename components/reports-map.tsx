"use client";

import dynamic from "next/dynamic";
import { useEffect, useMemo, useRef, useState } from "react";
import type { NeedType } from "@prisma/client";
import type { PublicReportDTO } from "@/lib/types";
import {
  accessLabel,
  needTypeLabel,
  urgencyColor,
  urgencyLabel,
} from "@/lib/labels";
import { timeAgo } from "@/lib/time";
import { IconPin, IconSearch, IconUsers, IconX } from "@/components/ui/icons";
import { NeedChips, StageBadge } from "@/components/ui/badges";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  ReportsFilters,
  emptyFilters,
  hasActiveFilters,
  type ReportFilters,
} from "@/components/reports-filters";
import { useReportsMap } from "@/lib/hooks";

interface Stats {
  total: number;
  critical: number;
  inProgress: number;
  verified: number;
}

const LeafletMap = dynamic(
  () => import("@/components/reports-map-leaflet").then((m) => m.ReportsMapLeaflet),
  {
    ssr: false,
    loading: () => <MapSkeleton />,
  },
);

export function ReportsMap() {
  const { data: reportsData, isLoading, isError, refetch } = useReportsMap();
  const reports = reportsData ?? [];
  const [query, setQuery] = useState("");
  const [filters, setFilters] = useState<ReportFilters>(emptyFilters);
  const [stats, setStats] = useState<Stats | null>(null);
  const listRef = useRef<HTMLDivElement>(null);

  const reduceMotion = usePrefersReducedMotion();

  const [selectedId, setSelectedId] = useState<string | null>(null);
  if (reports.length > 0 && !reports.some((r) => r.id === selectedId)) {
    setSelectedId(reports[0].id);
  }

  useEffect(() => {
    let aborted = false;
    fetch("/api/reports/stats")
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => {
        if (!aborted && data) setStats(data);
      })
      .catch(() => {});
    return () => {
      aborted = true;
    };
  }, []);

  const filtered = useMemo(() => {
    const q = normalize(query);
    let items = reports;
    if (filters.urgency) items = items.filter((r) => r.urgency === filters.urgency);
    if (filters.needType)
      items = items.filter((r) => r.needTypes.includes(filters.needType!));
    if (filters.access) items = items.filter((r) => r.access === filters.access);
    if (!q) return items;
    return items.filter((report) => {
      const haystack = normalize(
        [
          report.address,
          report.description ?? "",
          report.needTypes.map((n) => needTypeLabel[n]).join(" "),
          urgencyLabel[report.urgency],
          accessLabel[report.access],
        ].join(" "),
      );
      return haystack.includes(q);
    });
  }, [query, reports, filters]);

  const selected = (reports ?? []).find((r) => r.id === selectedId) ?? null;

  function selectReport(id: string) {
    setSelectedId(id);
    const row = listRef.current?.querySelector(`[data-report-id="${id}"]`);
    row?.scrollIntoView({ block: "nearest", behavior: reduceMotion ? "auto" : "smooth" });
  }

  const activeFilters = hasActiveFilters(filters);

  return (
    <section className="mx-auto flex w-full max-w-[1600px] flex-1 flex-col gap-5 px-4 py-6 sm:gap-6 sm:px-8 sm:py-12 lg:px-12">
      <header className="flex flex-col gap-4 sm:gap-5">
        <div className="flex flex-col gap-3">
          <span className="inline-flex items-center gap-2 self-start font-mono text-[11px] uppercase tracking-[0.18em] text-ceniza-3">
            <span
              aria-hidden
              className="inline-block size-1.5 animate-pulse rounded-full"
              style={{ background: "var(--color-critico)" }}
            />
            Vista geográfica · sismo 24-J
          </span>
          <div className="flex flex-wrap items-end justify-between gap-5">
            <h1 className="text-[clamp(1.625rem,6vw,2.75rem)] font-extrabold leading-[1.02] tracking-[-0.025em] text-ceniza">
              Mapa de ayuda
            </h1>
            <p className="max-w-md text-sm leading-relaxed text-ceniza-2">
              Cada pin es una solicitud abierta. El color marca la urgencia; la
              foto, cuando existe, ayuda a verificar.
            </p>
          </div>
        </div>
        <div
          className="flex flex-col overflow-hidden rounded-[var(--radius-card)] border"
          style={{ borderColor: "var(--borde)" }}
        >
          <StatsStrip stats={stats} loadedCount={reports.length} loading={isLoading} />
          <div className="flex flex-wrap items-center gap-x-3 gap-y-2 border-t bg-superficie px-4 py-2.5 sm:px-5">
            <span className="font-mono text-[10px] uppercase tracking-[0.18em] text-ceniza-3">
              Filtros
            </span>
            <ReportsFilters value={filters} onChange={setFilters} />
          </div>
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
                  : `de ${reports.length} ${reports.length === 1 ? "punto" : "puntos"} visibles`}
              </span>
            </p>
            {selected && (
              <div
                className="inline-flex items-center gap-2 rounded-full px-3 py-1.5"
                style={{
                  background: `color-mix(in srgb, ${urgencyColor[selected.urgency]} 14%, var(--superficie))`,
                }}
              >
                <span
                  className="size-1.5 rounded-full"
                  style={{ background: urgencyColor[selected.urgency] }}
                />
                <span
                  className="font-mono text-[11px] font-bold uppercase tracking-[0.14em]"
                  style={{ color: urgencyColor[selected.urgency] }}
                >
                  {urgencyLabel[selected.urgency]}
                </span>
              </div>
            )}
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
            ) : reports.length === 0 ? (
              <MapNotice
                title={activeFilters ? "Sin coincidencias en el mapa" : "Sin puntos todavía"}
                body={
                  activeFilters
                    ? "Prueba a quitar algún filtro."
                    : "Cuando existan solicitudes verificables, aparecerán en esta vista."
                }
              />
            ) : (
              <LeafletMap
                reports={filtered}
                selectedId={selectedId}
                reduceMotion={reduceMotion}
                onSelect={selectReport}
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
                placeholder="Buscar sector, necesidad o acceso"
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
            <div className="mt-3 flex items-center justify-between font-mono text-[11px] uppercase tracking-[0.14em] text-ceniza-3">
              <span>
                <span className="font-bold tabular-nums text-ceniza-2">
                  {filtered.length}
                </span>{" "}
                visibles
              </span>
              <span className="hidden sm:inline">Click para enfocar</span>
            </div>
          </div>

          <ScrollArea viewportRef={listRef} className="flex-1">
            <div className="p-3">
              {isLoading ? (
                <SidebarSkeleton />
              ) : isError ? (
                <SidebarNotice text="No se pudieron cargar las solicitudes." />
              ) : filtered.length === 0 ? (
                <SidebarNotice
                  text={
                    query
                      ? "Ningún punto coincide con la búsqueda."
                      : activeFilters
                        ? "Ningún punto coincide con los filtros."
                        : "Aún no hay solicitudes."
                  }
                />
              ) : (
                <div className="flex flex-col gap-2.5">
                  {filtered.map((report) => (
                    <ReportListItem
                      key={report.id}
                      report={report}
                      selected={report.id === selectedId}
                      onClick={() => selectReport(report.id)}
                    />
                  ))}
                </div>
              )}
            </div>
          </ScrollArea>
        </aside>
      </div>
    </section>
  );
}

function StatsStrip({
  stats,
  loadedCount,
  loading,
}: {
  stats: Stats | null;
  loadedCount: number;
  loading: boolean;
}) {
  return (
    <div className="grid grid-cols-2 gap-px bg-[var(--borde)] sm:grid-cols-4">
      <Stat
        label="En vista"
        value={loading ? undefined : loadedCount}
        accent="var(--color-ceniza)"
      />
      <Stat
        label="Críticas"
        value={stats?.critical}
        accent="var(--color-critico)"
      />
      <Stat
        label="En atención"
        value={stats?.inProgress}
        accent="var(--color-tierra)"
      />
      <Stat
        label="Verificadas"
        value={stats?.verified}
        accent="var(--color-verificado)"
      />
    </div>
  );
}

function Stat({
  label,
  value,
  accent,
}: {
  label: string;
  value: number | undefined;
  accent: string;
}) {
  const ready = typeof value === "number";
  return (
    <div className="flex items-baseline justify-between gap-3 bg-superficie px-4 py-3 sm:px-5">
      <span className="inline-flex items-center gap-1.5 font-mono text-[10px] uppercase tracking-[0.16em] text-ceniza-3">
        <span
          aria-hidden
          className="size-1.5 rounded-full"
          style={{ background: accent }}
        />
        {label}
      </span>
      <span
        className="font-mono text-xl font-bold leading-none tabular-nums sm:text-2xl"
        style={{ color: accent }}
      >
        {ready ? value!.toLocaleString("es-VE") : "—"}
      </span>
    </div>
  );
}

function NeedThumb({
  urgency,
  primary,
}: {
  urgency: PublicReportDTO["urgency"];
  primary: NeedType;
}) {
  const color = urgencyColor[urgency];
  return (
    <div
      className="relative flex size-12 shrink-0 items-center justify-center overflow-hidden rounded-md"
      style={{
        background: `color-mix(in srgb, ${color} 14%, var(--superficie))`,
        color,
      }}
      aria-hidden
    >
      <svg
        viewBox="0 0 48 48"
        className="absolute inset-0 h-full w-full opacity-25"
        preserveAspectRatio="xMidYMid slice"
      >
        <g fill="none" stroke={color} strokeWidth={0.6}>
          <circle cx="40" cy="8" r="8" />
          <circle cx="40" cy="8" r="16" />
          <circle cx="40" cy="8" r="26" />
        </g>
      </svg>
      <NeedGlyphSm type={primary} />
    </div>
  );
}

function NeedGlyphSm({ type }: { type: NeedType }) {
  const cls = "relative size-6";
  switch (type) {
    case "RESCATE":
      return (
        <svg viewBox="0 0 24 24" className={cls} aria-hidden>
          <path
            d="M4 14c2-2 4-2 6 0s4 2 6 0 4-2 6 0M3 19h18M6 19v-3M18 19v-3"
            fill="none"
            stroke="currentColor"
            strokeWidth={1.8}
            strokeLinecap="round"
          />
        </svg>
      );
    case "MEDICO":
      return (
        <svg viewBox="0 0 24 24" className={cls} aria-hidden>
          <path d="M10 4h4v6h6v4h-6v6h-4v-6H4v-4h6z" fill="currentColor" />
        </svg>
      );
    case "AGUA":
      return (
        <svg viewBox="0 0 24 24" className={cls} aria-hidden>
          <path
            d="M12 3c0 0-7 7-7 12a7 7 0 0 0 14 0c0-5-7-12-7-12z"
            fill="currentColor"
          />
        </svg>
      );
    case "COMIDA":
      return (
        <svg viewBox="0 0 24 24" className={cls} aria-hidden>
          <path
            d="M12 3a8 8 0 0 0-8 8h16a8 8 0 0 0-8-8zM3 13h18l-1 2H4z M5 17h14l-1.5 4h-11z"
            fill="currentColor"
          />
        </svg>
      );
    case "REFUGIO":
      return (
        <svg viewBox="0 0 24 24" className={cls} aria-hidden>
          <path d="M3 12 12 4l9 8v8H3z" fill="currentColor" />
        </svg>
      );
    case "OTRO":
    default:
      return (
        <svg viewBox="0 0 24 24" className={cls} aria-hidden>
          <circle cx="12" cy="12" r="9" fill="currentColor" />
        </svg>
      );
  }
}

function ReportListItem({
  report,
  selected,
  onClick,
}: {
  report: PublicReportDTO;
  selected: boolean;
  onClick: () => void;
}) {
  const primary = report.needTypes[0] ?? "OTRO";
  return (
    <button
      type="button"
      data-report-id={report.id}
      onClick={onClick}
      className="group w-full rounded-[var(--radius-input)] border p-3.5 text-left transition-[background-color,border-color,transform] duration-150 ease-out active:scale-[0.99]"
      style={
        selected
          ? {
              borderColor: urgencyColor[report.urgency],
              background: `color-mix(in srgb, ${urgencyColor[report.urgency]} 8%, var(--superficie))`,
            }
          : {
              borderColor: "var(--borde-suave)",
              background: "var(--superficie)",
            }
      }
    >
      <div className="flex items-start gap-3">
        <NeedThumb urgency={report.urgency} primary={primary} />
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <span
              className="font-mono text-[10px] font-bold uppercase tracking-[0.14em]"
              style={{ color: urgencyColor[report.urgency] }}
            >
              {urgencyLabel[report.urgency]}
            </span>
            <span className="font-mono text-[11px] text-ceniza-3">
              {timeAgo(report.createdAt)}
            </span>
            <StageBadge stage={report.stage} />
          </div>
          <p className="mt-1.5 line-clamp-2 text-sm font-semibold leading-snug text-ceniza">
            {report.address}
          </p>
        </div>
      </div>

      <div className="mt-3">
        <NeedChips needTypes={report.needTypes} />
      </div>

      <div className="mt-3 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-ceniza-3">
        <span className="inline-flex items-center gap-1.5 font-semibold text-ceniza-2">
          <IconUsers className="size-3.5" />
          {report.peopleCount}
        </span>
        <span>{accessLabel[report.access]}</span>
        <span className="inline-flex items-center gap-1.5 font-mono tabular-nums">
          <IconPin className="size-3.5" />
          {report.latitude.toFixed(4)}, {report.longitude.toFixed(4)}
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
          className="h-32 animate-pulse rounded-[var(--radius-input)] border bg-polvo"
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
