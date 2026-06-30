"use client";

import dynamic from "next/dynamic";
import { useState } from "react";
import type { PublicCentroDTO } from "@/lib/types";
import {
  scopeLabel,
  stockLevelColor,
  stockLevelHint,
  stockLevelLabel,
  stockLevelRank,
  supplyTypeLabel,
} from "@/lib/labels";
import { centroTopLevel, isStockStale } from "@/lib/centros";
import { timeAgo } from "@/lib/time";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { VerifiedBadge } from "@/components/ui/badges";
import { StockChip } from "@/components/ui/stock";
import {
  IconClock,
  IconNavigation,
  IconPhone,
  IconPin,
  IconWhatsApp,
} from "@/components/ui/icons";

const CentroLocationMap = dynamic(
  () =>
    import("@/components/centro-location-map").then((m) => m.CentroLocationMap),
  {
    ssr: false,
    loading: () => (
      <div className="h-full w-full animate-pulse bg-polvo" aria-hidden />
    ),
  },
);

export function CentroDetailsSheet({
  centro,
  open,
  onOpenChange,
}: {
  centro: PublicCentroDTO | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side="right"
        className="overflow-y-auto p-0"
        aria-describedby={centro ? undefined : "sheet-empty"}
      >
        {centro ? (
          <CentroDetailsBody centro={centro} />
        ) : (
          <div className="flex h-full items-center justify-center p-8 text-sm text-ceniza-3">
            <SheetTitle className="sr-only">Detalles</SheetTitle>
            <SheetDescription id="sheet-empty">
              No hay un centro seleccionado.
            </SheetDescription>
          </div>
        )}
      </SheetContent>
    </Sheet>
  );
}

function CentroDetailsBody({ centro: c }: { centro: PublicCentroDTO }) {
  const [imageOpen, setImageOpen] = useState(false);
  const top = centroTopLevel(c.items);
  const color = stockLevelColor[top];
  const stale = isStockStale(c.lastStockUpdatedAt);
  const directionsUrl = `https://www.google.com/maps/dir/?api=1&destination=${c.latitude},${c.longitude}&travelmode=driving`;

  // Teléfono para contactar: el del encargado o, en su defecto, la línea general.
  const contactPhone = c.encargadoPhone ?? c.phone;
  const contactName = c.encargadoName ?? c.contactHandle;
  const telHref = contactPhone
    ? `tel:${contactPhone.replace(/[^\d+]/g, "")}`
    : null;
  const waHref = contactPhone
    ? `https://wa.me/${contactPhone.replace(/\D/g, "")}`
    : null;
  const hasContact = Boolean(contactName || contactPhone || c.contactHandle);
  const place = [c.city, c.state, c.country].filter(Boolean).join(", ");

  // Semáforo ordenado: lo accionable arriba (URGENTE), lo saturado al final.
  const items = [...c.items].sort(
    (a, b) => stockLevelRank[b.level] - stockLevelRank[a.level],
  );

  return (
    <div className="flex h-full flex-col">
      {/* Foto / banda */}
      <div className="relative">
        {c.photoUrl ? (
          <button
            type="button"
            onClick={() => setImageOpen(true)}
            className="block w-full cursor-zoom-in"
            aria-label="Abrir imagen a tamaño completo"
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={c.photoUrl}
              alt={`Foto del centro: ${c.name}`}
              className="aspect-[16/10] w-full object-cover"
            />
          </button>
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
          {stockLevelLabel[top]}
        </span>
      </div>

      <SheetHeader>
        <div className="flex items-baseline justify-between gap-3">
          <SheetTitle>{c.name}</SheetTitle>
          {c.verified ? <VerifiedBadge /> : null}
        </div>
        {place ? (
          <p className="flex items-center gap-1.5 text-sm text-ceniza-2">
            <IconPin className="size-3.5 text-ceniza-3" />
            {place}
            {c.scope ? (
              <span className="ml-1 rounded-full bg-polvo px-2 py-0.5 text-[11px] font-semibold text-ceniza-3">
                {scopeLabel[c.scope]}
              </span>
            ) : null}
          </p>
        ) : null}
        <SheetDescription className="flex items-center gap-1.5">
          <IconClock className="size-3.5" />
          <span>Actualizado {timeAgo(c.lastStockUpdatedAt)}</span>
        </SheetDescription>
        {stale ? (
          <p
            className="mt-1 rounded-[var(--radius-input)] px-2.5 py-1.5 text-xs font-medium"
            style={{
              color: "var(--color-alto)",
              background: "color-mix(in srgb, var(--color-alto) 10%, var(--superficie))",
            }}
          >
            Información posiblemente desactualizada. Confirma con el encargado
            antes de llevar donaciones.
          </p>
        ) : null}
      </SheetHeader>

      <div className="flex flex-1 flex-col gap-5 px-6 py-5">
        {/* Semáforo */}
        <Section title="Qué necesitan">
          <ul className="flex flex-col divide-y" style={{ borderColor: "var(--borde-suave)" }}>
            {items.map((it) => (
              <li
                key={it.supplyType}
                className="flex items-center justify-between gap-3 py-2"
              >
                <span className="flex min-w-0 flex-col">
                  <span className="truncate text-sm font-medium text-ceniza">
                    {supplyTypeLabel[it.supplyType]}
                    {it.note ? (
                      <span className="text-ceniza-3"> · {it.note}</span>
                    ) : null}
                  </span>
                  <span className="text-[11px] text-ceniza-3">
                    {stockLevelHint[it.level]}
                  </span>
                </span>
                <StockChip level={it.level} />
              </li>
            ))}
          </ul>
        </Section>

        {/* Recibe (texto libre de la fuente) */}
        {c.receivesNote ? (
          <Section title="Recibe">
            <p className="whitespace-pre-line text-sm leading-relaxed text-ceniza-2">
              {c.receivesNote}
            </p>
          </Section>
        ) : null}

        {/* Horario */}
        {c.horario ? (
          <Section title="Horario">
            <p className="flex items-center gap-1.5 text-sm text-ceniza-2">
              <IconClock className="size-4 text-ceniza-3" />
              {c.horario}
            </p>
          </Section>
        ) : null}

        {/* Ubicación */}
        <Section title="Ubicación">
          <p className="flex items-start gap-1.5 text-sm leading-snug text-ceniza-2">
            <IconPin className="mt-0.5 size-4 shrink-0 text-ceniza-3" />
            <span>{c.address}</span>
          </p>
          <p className="mt-1 font-mono text-[11px] tabular-nums text-ceniza-4">
            {c.latitude.toFixed(5)}, {c.longitude.toFixed(5)}
          </p>
          <a
            href={directionsUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="mt-2 block aspect-[16/10] w-full overflow-hidden rounded-[var(--radius-input)] border"
            style={{ borderColor: "var(--borde-fuerte)" }}
            aria-label="Abrir la ubicación en Google Maps"
          >
            <CentroLocationMap latitude={c.latitude} longitude={c.longitude} />
          </a>
        </Section>

        {/* Descripción */}
        {c.description ? (
          <Section title="Descripción">
            <p className="whitespace-pre-line text-sm leading-relaxed text-ceniza-2">
              {c.description}
            </p>
          </Section>
        ) : null}

        {/* Contacto (público) — encargado, teléfono o handle, lo que haya */}
        {hasContact ? (
          <Section title="Contacto">
            <div
              className="flex flex-col gap-3 rounded-[var(--radius-input)] border p-3"
              style={{ borderColor: "var(--borde-fuerte)" }}
            >
              <div className="flex flex-col gap-0.5">
                {contactName ? (
                  <span className="text-sm font-semibold text-ceniza">
                    {contactName}
                  </span>
                ) : null}
                {contactPhone ? (
                  <a
                    href={telHref ?? undefined}
                    className="font-mono text-sm tabular-nums text-ceniza-2 underline-offset-2 hover:underline"
                  >
                    {contactPhone}
                  </a>
                ) : null}
                {c.contactHandle && c.contactHandle !== contactName ? (
                  <span className="text-sm text-ceniza-3">{c.contactHandle}</span>
                ) : null}
              </div>
              {contactPhone ? (
                <div className="flex gap-2">
                  <a
                    href={telHref ?? undefined}
                    className="inline-flex h-10 flex-1 items-center justify-center gap-1.5 rounded-[var(--radius-input)] border text-sm font-semibold text-ceniza transition-colors hover:bg-[var(--borde-suave)]"
                    style={{ borderColor: "var(--borde-fuerte)" }}
                  >
                    <IconPhone className="size-4 text-ceniza-3" />
                    Llamar
                  </a>
                  <a
                    href={waHref ?? undefined}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex h-10 flex-1 items-center justify-center gap-1.5 rounded-[var(--radius-input)] text-sm font-semibold text-white transition-opacity hover:opacity-90"
                    style={{ background: "#25D366" }}
                  >
                    <IconWhatsApp className="size-4" />
                    WhatsApp
                  </a>
                </div>
              ) : null}
            </div>
          </Section>
        ) : null}
      </div>

      {/* Footer */}
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

      {c.photoUrl ? (
        <Dialog open={imageOpen} onOpenChange={setImageOpen}>
          <DialogContent
            showCloseButton={false}
            className="max-w-[calc(100%-2rem)] border-0 bg-transparent p-0 shadow-none sm:max-w-[90vw]"
          >
            <button
              type="button"
              onClick={() => setImageOpen(false)}
              className="absolute top-4 right-4 z-10 flex size-10 items-center justify-center rounded-full bg-black/50 text-white transition-colors hover:bg-black/70"
              aria-label="Cerrar imagen"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="20"
                height="20"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M18 6 6 18" />
                <path d="m6 6 12 12" />
              </svg>
            </button>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={c.photoUrl}
              alt={`Foto del centro: ${c.name}`}
              className="max-h-[85vh] w-full rounded-xl object-contain"
            />
          </DialogContent>
        </Dialog>
      ) : null}
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
