import type { NeedType } from "@prisma/client";
import type { PublicReportDTO } from "@/lib/types";
import { urgencyColor, urgencyLabel, needTypeLabel } from "@/lib/labels";
import { timeAgo } from "@/lib/time";
import {
  VerifiedBadge,
  AccessChip,
  NeedChips,
  StageBadge,
} from "@/components/ui/badges";
import {
  IconUsers,
  IconInjured,
  IconChild,
  IconElder,
  IconPin,
  IconCamera,
  IconNavigation,
} from "@/components/ui/icons";

// Icono dominante por tipo de necesidad para el placeholder.
function NeedGlyph({ type, className }: { type: NeedType; className?: string }) {
  switch (type) {
    case "RESCATE":
      return (
        <svg viewBox="0 0 24 24" className={className} aria-hidden>
          <path
            d="M4 14c2-2 4-2 6 0s4 2 6 0 4-2 6 0"
            fill="none"
            stroke="currentColor"
            strokeWidth={1.6}
            strokeLinecap="round"
          />
          <path
            d="M3 19h18M6 19v-3M18 19v-3"
            fill="none"
            stroke="currentColor"
            strokeWidth={1.6}
            strokeLinecap="round"
          />
        </svg>
      );
    case "MEDICO":
      return (
        <svg viewBox="0 0 24 24" className={className} aria-hidden>
          <path
            d="M10 4h4v6h6v4h-6v6h-4v-6H4v-4h6z"
            fill="currentColor"
          />
        </svg>
      );
    case "AGUA":
      return (
        <svg viewBox="0 0 24 24" className={className} aria-hidden>
          <path
            d="M12 3c0 0-7 7-7 12a7 7 0 0 0 14 0c0-5-7-12-7-12z"
            fill="currentColor"
          />
        </svg>
      );
    case "COMIDA":
      return (
        <svg viewBox="0 0 24 24" className={className} aria-hidden>
          <path
            d="M12 3a8 8 0 0 0-8 8h16a8 8 0 0 0-8-8zM3 13h18l-1 2H4z M5 17h14l-1.5 4h-11z"
            fill="currentColor"
          />
        </svg>
      );
    case "REFUGIO":
      return (
        <svg viewBox="0 0 24 24" className={className} aria-hidden>
          <path d="M3 12 12 4l9 8v8H3z" fill="currentColor" />
          <path d="M10 20v-5h4v5" fill="var(--superficie)" />
        </svg>
      );
    case "OTRO":
    default:
      return (
        <svg viewBox="0 0 24 24" className={className} aria-hidden>
          <circle cx="12" cy="12" r="9" fill="currentColor" />
          <path
            d="M12 8v5M12 16h.01"
            stroke="var(--superficie)"
            strokeWidth={2.2}
            strokeLinecap="round"
            fill="none"
          />
        </svg>
      );
  }
}

// Placeholder coloreado por urgencia con icono del tipo principal de necesidad.
// El color reemplaza al spine lateral como canal semántico de triaje.
function PhotoPlaceholder({
  urgency,
  primary,
}: {
  urgency: PublicReportDTO["urgency"];
  primary: NeedType;
}) {
  const color = urgencyColor[urgency];
  return (
    <div
      className="relative flex aspect-[16/10] w-full items-center justify-center overflow-hidden"
      style={{
        background: `color-mix(in srgb, ${color} 10%, var(--superficie))`,
      }}
      aria-hidden
    >
      {/* Anillos sísmicos concéntricos en color de urgencia */}
      <svg
        viewBox="0 0 200 125"
        className="absolute inset-0 h-full w-full opacity-[0.18]"
        preserveAspectRatio="xMidYMid slice"
      >
        <g
          fill="none"
          stroke={color}
          strokeWidth={1}
        >
          <circle cx="160" cy="20" r="18" />
          <circle cx="160" cy="20" r="36" />
          <circle cx="160" cy="20" r="58" />
          <circle cx="160" cy="20" r="84" />
          <circle cx="160" cy="20" r="116" />
        </g>
      </svg>
      <div
        className="relative size-16"
        style={{ color }}
      >
        <NeedGlyph type={primary} className="h-full w-full" />
      </div>
      <span
        className="absolute bottom-2 right-2 inline-flex items-center gap-1 font-mono text-[10px] uppercase tracking-[0.14em]"
        style={{ color: "color-mix(in srgb, " + color + " 70%, var(--ceniza))" }}
      >
        <IconCamera className="size-3" />
        Sin foto
      </span>
    </div>
  );
}

export function ReportCard({
  report: r,
  onSelect,
}: {
  report: PublicReportDTO;
  onSelect?: (id: string) => void;
}) {
  const color = urgencyColor[r.urgency];
  const primary = r.needTypes[0] ?? "OTRO";
  const selectable = Boolean(onSelect);

  return (
    <article
      className={
        "group flex flex-col overflow-hidden rounded-[var(--radius-card)] border bg-superficie transition-shadow hover:shadow-[0_8px_22px_rgba(31,27,23,0.08)]" +
        (selectable
          ? " cursor-pointer focus-within:ring-2 focus-within:ring-[var(--color-tierra)]"
          : "")
      }
      onClick={selectable ? () => onSelect?.(r.id) : undefined}
      onKeyDown={
        selectable
          ? (e) => {
              if (e.key === "Enter" || e.key === " ") {
                e.preventDefault();
                onSelect?.(r.id);
              }
            }
          : undefined
      }
      role={selectable ? "button" : undefined}
      tabIndex={selectable ? 0 : undefined}
      aria-label={selectable ? `Ver detalles de ${needTypeLabel[primary]}` : undefined}
    >
      <div className="relative">
        {r.photoUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={r.photoUrl}
            alt={`Foto del lugar: ${r.address}`}
            loading="lazy"
            className="aspect-[16/10] w-full object-cover"
          />
        ) : (
          <PhotoPlaceholder urgency={r.urgency} primary={primary} />
        )}

        {/* Etiqueta de urgencia anclada a la foto: canal de triaje principal */}
        <span
          className="absolute left-3 top-3 inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 font-mono text-[10px] font-bold uppercase tracking-[0.16em] text-[var(--superficie)] shadow-[0_1px_2px_rgba(31,27,23,0.25)]"
          style={{ background: color }}
        >
          <span aria-hidden className="size-1.5 rounded-full bg-[var(--superficie)]" />
          {urgencyLabel[r.urgency]}
        </span>

        {r.verified ? (
          <span
            className="absolute right-3 top-3 inline-flex items-center rounded-full bg-[var(--superficie)]/95 px-2 py-1 backdrop-blur"
            title="Verificado por un coordinador"
          >
            <VerifiedBadge />
          </span>
        ) : null}

        <time
          className="absolute bottom-2 left-3 font-mono text-[11px] text-ceniza"
          dateTime={r.createdAt}
          style={{
            background: "color-mix(in srgb, var(--superficie) 88%, transparent)",
            padding: "2px 6px",
            borderRadius: 4,
          }}
        >
          {timeAgo(r.createdAt)}
        </time>
      </div>

      <div className="flex flex-1 flex-col gap-3 p-4">
        <header className="flex items-baseline justify-between gap-3">
          <h3 className="text-base font-bold leading-tight text-ceniza">
            {needTypeLabel[primary]}
            {r.needTypes.length > 1 ? (
              <span className="ml-1.5 font-mono text-xs font-medium text-ceniza-3">
                +{r.needTypes.length - 1}
              </span>
            ) : null}
          </h3>
          <span
            className="inline-flex items-baseline gap-1 font-mono text-sm font-bold tabular-nums text-ceniza"
            title={`${r.peopleCount} ${r.peopleCount === 1 ? "persona" : "personas"}`}
          >
            <IconUsers className="size-4 self-center text-ceniza-3" />
            {r.peopleCount}
          </span>
        </header>

        {r.needTypes.length > 1 ? (
          <NeedChips needTypes={r.needTypes.slice(1)} />
        ) : null}

        <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-ceniza-2">
          {r.hasInjured && (
            <span
              className="inline-flex items-center gap-1 font-semibold"
              style={{ color: "var(--color-critico)" }}
            >
              <IconInjured className="size-3.5" />
              Heridos
            </span>
          )}
          {r.hasChildren && (
            <span className="inline-flex items-center gap-1">
              <IconChild className="size-3.5 text-ceniza-3" />
              Niños
            </span>
          )}
          {r.hasElderly && (
            <span className="inline-flex items-center gap-1">
              <IconElder className="size-3.5 text-ceniza-3" />
              Mayores
            </span>
          )}
        </div>

        <AccessChip access={r.access} />

        <p className="flex items-start gap-1.5 text-sm leading-snug text-ceniza-2">
          <IconPin className="mt-0.5 size-4 shrink-0 text-ceniza-3" />
          <span className="line-clamp-2">{r.address}</span>
        </p>

        {r.description ? (
          <p className="line-clamp-2 text-sm leading-snug text-ceniza-3">
            {r.description}
          </p>
        ) : null}

        <footer className="mt-auto flex items-center justify-between gap-2 border-t pt-3">
          <StageBadge stage={r.stage} />
          <a
            href={`https://www.google.com/maps/dir/?api=1&destination=${r.latitude},${r.longitude}&travelmode=driving`}
            target="_blank"
            rel="noopener noreferrer"
            onClick={(e) => e.stopPropagation()}
            className="inline-flex items-center gap-1.5 rounded-[var(--radius-input)] border px-2.5 py-1 text-xs font-semibold text-ceniza-2 transition-colors hover:bg-[color-mix(in_srgb,var(--ceniza)_6%,var(--superficie))] hover:text-ceniza"
            aria-label="Abrir ruta en Google Maps"
          >
            <IconNavigation className="size-3.5" />
            Cómo llegar
          </a>
        </footer>
      </div>
    </article>
  );
}
