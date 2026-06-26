"use client";

import type { PublicReportDTO } from "@/lib/types";
import {
  urgencyColor,
  urgencyLabel,
  needTypeLabel,
  accessLabel,
} from "@/lib/labels";
import { timeAgo } from "@/lib/time";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import {
  VerifiedBadge,
  NeedChips,
  StageBadge,
  AccessChip,
} from "@/components/ui/badges";
import {
  IconUsers,
  IconInjured,
  IconChild,
  IconElder,
  IconPin,
  IconNavigation,
} from "@/components/ui/icons";

export function ReportDetailsSheet({
  report,
  open,
  onOpenChange,
}: {
  report: PublicReportDTO | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side="right"
        className="overflow-y-auto p-0"
        aria-describedby={report ? undefined : "sheet-empty"}
      >
        {report ? (
          <ReportDetailsBody report={report} />
        ) : (
          <div className="flex h-full items-center justify-center p-8 text-sm text-ceniza-3">
            <SheetTitle className="sr-only">Detalles</SheetTitle>
            <SheetDescription id="sheet-empty">
              No hay un reporte seleccionado.
            </SheetDescription>
          </div>
        )}
      </SheetContent>
    </Sheet>
  );
}

function ReportDetailsBody({ report: r }: { report: PublicReportDTO }) {
  const color = urgencyColor[r.urgency];
  const primary = r.needTypes[0] ?? "OTRO";
  const directionsUrl = `https://www.google.com/maps/dir/?api=1&destination=${r.latitude},${r.longitude}&travelmode=driving`;

  return (
    <div className="flex h-full flex-col">
      {/* Tira de urgencia + foto */}
      <div className="relative">
        {r.photoUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={r.photoUrl}
            alt={`Foto del lugar: ${r.address}`}
            className="aspect-[16/10] w-full object-cover"
          />
        ) : (
          <div
            className="aspect-[16/10] w-full"
            style={{
              background: `color-mix(in srgb, ${color} 12%, var(--superficie))`,
            }}
            aria-hidden
          />
        )}
        <span
          className="absolute left-4 top-4 inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 font-mono text-[10px] font-bold uppercase tracking-[0.16em] text-[var(--superficie)] shadow-[0_1px_2px_rgba(31,27,23,0.25)]"
          style={{ background: color }}
        >
          <span aria-hidden className="size-1.5 rounded-full bg-[var(--superficie)]" />
          {urgencyLabel[r.urgency]}
        </span>
      </div>

      <SheetHeader>
        <div className="flex items-baseline justify-between gap-3">
          <SheetTitle>{needTypeLabel[primary]}</SheetTitle>
          <time
            className="font-mono text-[11px] text-ceniza-3"
            dateTime={r.createdAt}
          >
            {timeAgo(r.createdAt)}
          </time>
        </div>
        <SheetDescription className="flex items-center gap-2">
          <StageBadge stage={r.stage} />
          {r.verified ? <VerifiedBadge /> : null}
        </SheetDescription>
      </SheetHeader>

      <div className="flex flex-1 flex-col gap-5 px-6 py-5">
        {/* Necesidades */}
        <Section title="Necesidades">
          <NeedChips needTypes={r.needTypes} />
        </Section>

        {/* Personas afectadas */}
        <Section title="Personas">
          <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-sm">
            <span className="inline-flex items-center gap-1.5 font-mono font-bold tabular-nums text-ceniza">
              <IconUsers className="size-4 text-ceniza-3" />
              {r.peopleCount}{" "}
              <span className="font-sans font-normal text-ceniza-2">
                {r.peopleCount === 1 ? "persona" : "personas"}
              </span>
            </span>
            {r.hasInjured && (
              <span
                className="inline-flex items-center gap-1 text-xs font-semibold"
                style={{ color: "var(--color-critico)" }}
              >
                <IconInjured className="size-3.5" />
                Heridos
              </span>
            )}
            {r.hasChildren && (
              <span className="inline-flex items-center gap-1 text-xs text-ceniza-2">
                <IconChild className="size-3.5 text-ceniza-3" />
                Niños
              </span>
            )}
            {r.hasElderly && (
              <span className="inline-flex items-center gap-1 text-xs text-ceniza-2">
                <IconElder className="size-3.5 text-ceniza-3" />
                Mayores
              </span>
            )}
          </div>
        </Section>

        {/* Acceso */}
        <Section title="Acceso">
          <div className="flex items-center gap-2">
            <AccessChip access={r.access} />
            <span className="text-xs text-ceniza-3">{accessLabel[r.access]}</span>
          </div>
        </Section>

        {/* Ubicación */}
        <Section title="Ubicación">
          <p className="flex items-start gap-1.5 text-sm leading-snug text-ceniza-2">
            <IconPin className="mt-0.5 size-4 shrink-0 text-ceniza-3" />
            <span>{r.address}</span>
          </p>
          <p className="mt-1 font-mono text-[11px] tabular-nums text-ceniza-4">
            {r.latitude.toFixed(5)}, {r.longitude.toFixed(5)}
          </p>
        </Section>

        {/* Descripción */}
        {r.description ? (
          <Section title="Descripción">
            <p className="whitespace-pre-line text-sm leading-relaxed text-ceniza-2">
              {r.description}
            </p>
          </Section>
        ) : null}

        {/* Contacto — privado, no expuesto en API pública */}
        <Section title="Contacto">
          <div
            className="rounded-[var(--radius-input)] border border-dashed p-3 text-xs text-ceniza-3"
            style={{ borderColor: "var(--borde-fuerte)" }}
          >
            La información de contacto solo es visible para coordinadores
            autorizados. Si eres parte del equipo de respuesta, inicia sesión
            para verla.
          </div>
        </Section>
      </div>

      {/* Footer pegado abajo */}
      <div className="sticky bottom-0 mt-auto flex flex-col gap-2 border-t bg-superficie/95 px-6 py-4 backdrop-blur">
        <a
          href={directionsUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex h-11 items-center justify-center gap-2 rounded-[var(--radius-input)] text-sm font-semibold text-[var(--superficie)] transition-opacity hover:opacity-90"
          style={{ background: "var(--color-tierra)" }}
        >
          <IconNavigation className="size-4" />
          Cómo llegar en Google Maps
        </a>
      </div>
    </div>
  );
}

function Section({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section className="flex flex-col gap-2">
      <h4 className="font-mono text-[10px] uppercase tracking-[0.18em] text-ceniza-3">
        {title}
      </h4>
      {children}
    </section>
  );
}
