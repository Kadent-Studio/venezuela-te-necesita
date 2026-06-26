"use client";

import { useEffect, useState } from "react";
import { SolicitarAyudaButton } from "@/components/solicitar-ayuda-button";
import { ReportsFeed } from "@/components/reports-feed";
import {
  ReportsFilters,
  emptyFilters,
  type ReportFilters,
} from "@/components/reports-filters";

interface Stats {
  total: number;
  critical: number;
  inProgress: number;
  verified: number;
  urgency: { CRITICA: number; ALTA: number; MEDIA: number; BAJA: number };
}

export function HomeShell() {
  const [filters, setFilters] = useState<ReportFilters>(emptyFilters);
  const [stats, setStats] = useState<Stats | null>(null);

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

  return (
    <main className="mx-auto w-full max-w-7xl flex-1 px-4 py-8 sm:px-8 sm:py-16 lg:px-12">
      <Hero />

      <section className="flex flex-col gap-0 overflow-hidden rounded-[var(--radius-card)] border" style={{ borderColor: "var(--borde)" }}>
        <StatsStrip stats={stats} />
        <div className="flex flex-wrap items-center gap-x-3 gap-y-2 border-t bg-superficie px-4 py-2.5 sm:px-5">
          <span className="font-mono text-[10px] uppercase tracking-[0.18em] text-ceniza-3">
            Filtros
          </span>
          <ReportsFilters value={filters} onChange={setFilters} />
        </div>
      </section>

      <section className="mt-8 flex flex-col gap-6">
        <ReportsFeed filters={filters} />
      </section>
    </main>
  );
}

function Hero() {
  return (
    <section className="relative mb-10 overflow-hidden border-b pb-10 sm:mb-20 sm:pb-20">
      <div className="grid gap-8 lg:grid-cols-[1.4fr_1fr] lg:items-end lg:gap-16">
        <div className="flex flex-col gap-5 sm:gap-6">
          <span className="inline-flex items-center gap-2 self-start font-mono text-[10px] uppercase tracking-[0.18em] text-ceniza-3 sm:text-[11px]">
            <span
              aria-hidden
              className="inline-block size-1.5 animate-pulse rounded-full"
              style={{ background: "var(--color-critico)" }}
            />
            Operación en curso · sismo 24-J
          </span>
          <h1 className="max-w-3xl text-[clamp(1.875rem,7vw,4rem)] font-extrabold leading-[1] tracking-[-0.03em] text-ceniza sm:leading-[0.95]">
            Cada punto en este mapa{" "}
            <span className="italic text-tierra">es alguien esperando.</span>
          </h1>
          <p className="max-w-xl text-[15px] leading-relaxed text-ceniza-2 sm:text-base">
            Reporta dónde se necesita ayuda y ubica los puntos por urgencia y
            accesibilidad. Así la respuesta llega antes a quien más lo necesita.
          </p>
          {/* CTAs full-width apilados en mobile (thumb-zone), inline en desktop */}
          <div className="mt-1 flex flex-col gap-3 sm:mt-2 sm:flex-row sm:flex-wrap sm:items-center">
            <SolicitarAyudaButton variant="hero" />
            <a
              href="/mapa"
              className="inline-flex h-12 items-center justify-center rounded-[var(--radius-input)] border px-5 text-base font-semibold text-ceniza-2 hover:text-ceniza sm:h-14"
              style={{ borderColor: "var(--borde-fuerte)" }}
            >
              Ver el mapa
            </a>
          </div>
        </div>
        <HeroLegend />
      </div>
    </section>
  );
}

function HeroLegend() {
  const rows: { label: string; token: string; meaning: string }[] = [
    {
      label: "Crítica",
      token: "var(--color-critico)",
      meaning: "Vida en riesgo, atención inmediata",
    },
    {
      label: "Alta",
      token: "var(--color-alto)",
      meaning: "Necesidad urgente, horas",
    },
    {
      label: "Media",
      token: "var(--color-medio)",
      meaning: "Necesidad sostenida, un día",
    },
    {
      label: "Baja",
      token: "var(--color-bajo)",
      meaning: "Apoyo, puede esperar",
    },
  ];
  return (
    <aside
      className="self-end rounded-[var(--radius-card)] border bg-superficie p-4 sm:p-7"
      style={{ borderColor: "var(--borde)" }}
      aria-label="Leyenda de urgencia"
    >
      <h2 className="mb-3 font-mono text-[10px] uppercase tracking-[0.18em] text-ceniza-3 sm:mb-4 sm:text-[11px]">
        Cómo se lee la urgencia
      </h2>
      <ul className="flex flex-col gap-2.5 sm:gap-3">
        {rows.map((r) => (
          <li
            key={r.label}
            className="flex items-baseline gap-2.5 text-[13px] sm:gap-3 sm:text-sm"
          >
            <span
              aria-hidden
              className="size-2.5 shrink-0 translate-y-0.5 rounded-full"
              style={{ background: r.token }}
            />
            <span className="w-14 shrink-0 font-bold text-ceniza sm:w-16">
              {r.label}
            </span>
            <span className="text-ceniza-2">{r.meaning}</span>
          </li>
        ))}
      </ul>
    </aside>
  );
}

function StatsStrip({ stats }: { stats: Stats | null }) {
  return (
    <div
      aria-label="Resumen en vivo"
      className="grid grid-cols-2 gap-px bg-[var(--borde)] sm:grid-cols-4"
    >
      <Stat label="Puntos activos" value={stats?.total} accent="var(--color-ceniza)" />
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
        aria-live="polite"
      >
        {ready ? value!.toLocaleString("es-VE") : "—"}
      </span>
    </div>
  );
}
