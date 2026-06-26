"use client";

import dynamic from "next/dynamic";
import { useEffect, useMemo, useRef, useState } from "react";
import type { PublicReportDTO } from "@/lib/types";
import {
  accessLabel,
  needTypeLabel,
  urgencyColor,
  urgencyLabel,
} from "@/lib/labels";
import { timeAgo } from "@/lib/time";
import { IconPin, IconSearch, IconUsers } from "@/components/ui/icons";
import { NeedChips, StageBadge } from "@/components/ui/badges";
import { useReportsMap } from "@/lib/hooks";

const LeafletMap = dynamic(
  () => import("@/components/reports-map-leaflet").then((m) => m.ReportsMapLeaflet),
  {
    ssr: false,
    loading: () => <MapSkeleton />,
  },
);

export function ReportsMap() {
  const { data: reports, isLoading, isError, refetch } = useReportsMap();
  const [query, setQuery] = useState("");
  const listRef = useRef<HTMLDivElement>(null);

  const reduceMotion = usePrefersReducedMotion();

  // Primer reporte como seleccionado por defecto: se recalcula con los datos.
  const [selectedId, setSelectedId] = useState<string | null>(null);
  if (reports && reports.length > 0 && !reports.some((r) => r.id === selectedId)) {
    setSelectedId(reports[0].id);
  }

  const filtered = useMemo(() => {
    const q = normalize(query);
    const items = reports ?? [];
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
  }, [query, reports]);

  const selected = (reports ?? []).find((r) => r.id === selectedId) ?? null;

  function selectReport(id: string) {
    setSelectedId(id);
    const row = listRef.current?.querySelector(`[data-report-id="${id}"]`);
    row?.scrollIntoView({ block: "nearest", behavior: reduceMotion ? "auto" : "smooth" });
  }

  return (
    <section className="mx-auto flex w-full max-w-[1500px] flex-1 flex-col gap-4 px-4 py-4 sm:px-6 lg:h-[calc(100vh-88px)] lg:flex-row lg:overflow-hidden">
      <div className="flex min-h-[420px] flex-1 flex-col overflow-hidden rounded-[var(--radius-card)] border bg-superficie lg:min-h-0">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b bg-hueso/60 px-4 py-3">
          <div>
            <h1 className="text-lg font-extrabold tracking-tight text-ceniza">
              Mapa de ayuda
            </h1>
            <p className="text-sm text-ceniza-3">
              {isLoading
                ? "Cargando reportes..."
                : `${(reports ?? []).length} reportes cargados`}
            </p>
          </div>
          {selected && (
            <div className="flex items-center gap-2 rounded-[var(--radius-input)] border bg-superficie px-3 py-2">
              <span
                className="size-2.5 rounded-full"
                style={{ background: urgencyColor[selected.urgency] }}
              />
              <span className="text-sm font-semibold text-ceniza-2">
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
          ) : (reports ?? []).length === 0 ? (
            <MapNotice
              title="Sin puntos todavía"
              body="Cuando existan solicitudes verificables, aparecerán en esta vista."
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

      <aside className="flex min-h-[420px] w-full flex-col overflow-hidden rounded-[var(--radius-card)] border bg-superficie lg:min-h-0 lg:w-[390px]">
        <div className="border-b bg-hueso/60 p-4">
          <label className="flex h-11 items-center gap-2 rounded-[var(--radius-input)] border bg-polvo px-3 focus-within:outline focus-within:outline-2 focus-within:outline-offset-2 focus-within:outline-[var(--foco)]">
            <IconSearch className="size-4 shrink-0 text-ceniza-3" />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Buscar sector, necesidad o acceso"
              className="h-full min-w-0 flex-1 bg-transparent text-sm font-medium text-ceniza outline-none placeholder:text-ceniza-4"
            />
          </label>
          <div className="mt-3 flex items-center justify-between text-xs text-ceniza-3">
            <span>{filtered.length} visibles</span>
            <span>Click en un reporte para enfocar</span>
          </div>
        </div>

        <div ref={listRef} className="flex-1 overflow-y-auto p-2">
          {isLoading ? (
            <SidebarSkeleton />
          ) : isError ? (
            <SidebarNotice text="No se pudieron cargar las solicitudes." />
          ) : filtered.length === 0 ? (
            <SidebarNotice text="No hay reportes que coincidan con la búsqueda." />
          ) : (
            <div className="flex flex-col gap-2">
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
      </aside>
    </section>
  );
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
  return (
    <button
      type="button"
      data-report-id={report.id}
      onClick={onClick}
      className="group w-full rounded-[var(--radius-input)] border p-3 text-left transition-[background-color,border-color,transform] duration-150 ease-out active:scale-[0.99]"
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
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <span
              className="size-2.5 rounded-full"
              style={{ background: urgencyColor[report.urgency] }}
            />
            <span className="text-xs font-bold text-ceniza">
              {urgencyLabel[report.urgency]}
            </span>
            <span className="font-mono text-[11px] text-ceniza-3">
              {timeAgo(report.createdAt)}
            </span>
          </div>
          <p className="mt-2 line-clamp-2 text-sm font-semibold leading-snug text-ceniza">
            {report.address}
          </p>
        </div>
        <StageBadge stage={report.stage} />
      </div>

      <div className="mt-3">
        <NeedChips needTypes={report.needTypes} />
      </div>

      <div className="mt-3 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-ceniza-3">
        <span className="inline-flex items-center gap-1.5">
          <IconUsers className="size-3.5" />
          {report.peopleCount}
        </span>
        <span>{accessLabel[report.access]}</span>
        <span className="inline-flex items-center gap-1.5 font-mono">
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
    <div className="flex flex-col gap-2">
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
    <div className="flex h-full min-h-[420px] items-center justify-center bg-polvo p-6 text-center">
      <div className="max-w-sm">
        <h2 className="text-base font-bold text-ceniza">{title}</h2>
        <p className="mt-1 text-sm text-ceniza-2">{body}</p>
        {action && onAction ? (
          <button
            type="button"
            onClick={onAction}
            className="mt-4 rounded-[var(--radius-input)] px-4 py-2 text-sm font-bold text-[var(--superficie)] transition-transform duration-150 ease-out active:scale-[0.98]"
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
