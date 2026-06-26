"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { PublicReportDTO, ReportListResponse } from "@/lib/types";
import { ReportCard } from "@/components/report-card";
import type { ReportFilters } from "@/components/reports-filters";

const PAGE = 20;

export function ReportsFeed({ filters }: { filters?: ReportFilters }) {
  const [items, setItems] = useState<PublicReportDTO[]>([]);
  const [cursor, setCursor] = useState<string | null>(null);
  const [done, setDone] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [started, setStarted] = useState(false);

  // Serializa filtros para usarlos como dependencia estable de efectos.
  const filterKey = filters
    ? `${filters.urgency ?? ""}|${filters.needType ?? ""}|${filters.access ?? ""}`
    : "";

  // No hace setState síncrono: la primera carga usa el estado inicial loading=true;
  // las cargas posteriores marcan loading desde sus manejadores (botón / observer).
  const load = useCallback(
    async (cur: string | null) => {
      try {
        const url = new URL("/api/reports", window.location.origin);
        url.searchParams.set("limit", String(PAGE));
        if (cur) url.searchParams.set("cursor", cur);
        if (filters?.urgency) url.searchParams.set("urgency", filters.urgency);
        if (filters?.needType) url.searchParams.set("needType", filters.needType);
        if (filters?.access) url.searchParams.set("access", filters.access);
        const res = await fetch(url);
        if (!res.ok) throw new Error();
        const data = (await res.json()) as ReportListResponse;
        setItems((prev) => (cur ? [...prev, ...data.items] : data.items));
        setCursor(data.nextCursor);
        setDone(!data.nextCursor);
        setError(false);
      } catch {
        setError(true);
      } finally {
        setLoading(false);
        setStarted(true);
      }
    },
    [filters],
  );

  const loadMore = useCallback(
    (cur: string) => {
      setLoading(true);
      setError(false);
      void load(cur);
    },
    [load],
  );

  const reload = useCallback(() => {
    setLoading(true);
    setError(false);
    void load(null);
  }, [load]);

  useEffect(() => {
    // Carga inicial y recarga al cambiar filtros: el setState ocurre en el
    // callback de la respuesta fetch (sistema externo), no de forma síncrona en
    // el cuerpo del efecto. filterKey resume los filtros para no disparar el
    // efecto por identidad de objeto.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void load(null);
  }, [load, filterKey]);

  // Scroll infinito.
  const sentinel = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const el = sentinel.current;
    if (!el || done || loading || error) return;
    const obs = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && cursor) loadMore(cursor);
      },
      { rootMargin: "400px" },
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, [cursor, done, loading, error, loadMore]);

  if (!started && loading) return <FeedSkeleton />;

  if (error && items.length === 0) {
    return (
      <Notice
        title="No se pudieron cargar las solicitudes"
        body="Revisa tu conexión e intenta de nuevo."
        action={<RetryButton onClick={reload} />}
      />
    );
  }

  if (started && items.length === 0) {
    const filtered =
      filters &&
      (filters.urgency || filters.needType || filters.access) !== null &&
      (filters.urgency || filters.needType || filters.access) !== undefined;
    return (
      <Notice
        title={
          filtered
            ? "Ningún punto coincide con los filtros"
            : "Aún no hay solicitudes"
        }
        body={
          filtered
            ? "Prueba a quitar alguno o limpiarlos todos."
            : "Cuando alguien reporte un punto que necesita ayuda, aparecerá aquí."
        }
      />
    );
  }

  return (
    <div className="flex flex-col gap-7">
      <div className="grid grid-cols-2 gap-3 sm:gap-6 lg:grid-cols-3 lg:gap-7">
        {items.map((r) => (
          <ReportCard key={r.id} report={r} />
        ))}
      </div>

      {!done && (
        <div ref={sentinel} className="flex justify-center py-2">
          <button
            type="button"
            onClick={() => cursor && loadMore(cursor)}
            disabled={loading}
            className="rounded-[var(--radius-input)] border px-4 py-2 text-sm font-semibold text-ceniza-2 disabled:opacity-60"
            style={{ borderColor: "var(--borde-fuerte)" }}
          >
            {loading ? "Cargando…" : "Cargar más"}
          </button>
        </div>
      )}

      {error && items.length > 0 && (
        <p className="text-center text-sm text-ceniza-3">
          No se pudo cargar más. <RetryLink onClick={() => cursor && loadMore(cursor)} />
        </p>
      )}
    </div>
  );
}

function FeedSkeleton() {
  return (
    <div className="grid grid-cols-2 gap-3 sm:gap-6 lg:grid-cols-3 lg:gap-7">
      {Array.from({ length: 6 }).map((_, i) => (
        <div
          key={i}
          className="h-80 animate-pulse rounded-[var(--radius-card)] border bg-superficie"
        />
      ))}
    </div>
  );
}

function Notice({
  title,
  body,
  action,
}: {
  title: string;
  body: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="flex flex-col items-center gap-2 rounded-[var(--radius-card)] border border-dashed bg-superficie px-6 py-16 text-center">
      <h3 className="text-base font-bold text-ceniza">{title}</h3>
      <p className="max-w-sm text-sm text-ceniza-2">{body}</p>
      {action}
    </div>
  );
}

function RetryButton({ onClick }: { onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="mt-2 rounded-[var(--radius-input)] px-4 py-2 text-sm font-semibold text-[var(--superficie)]"
      style={{ background: "var(--color-tierra)" }}
    >
      Reintentar
    </button>
  );
}

function RetryLink({ onClick }: { onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="font-semibold text-tierra underline underline-offset-2"
    >
      Reintentar
    </button>
  );
}
