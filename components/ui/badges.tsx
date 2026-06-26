import type { NeedType, Urgency, AccessStatus, Stage } from "@prisma/client";
import {
  needTypeLabel,
  urgencyLabel,
  urgencyColor,
  accessLabel,
  accessColor,
  stageLabel,
} from "@/lib/labels";
import { IconCheck } from "./icons";

// Fondo tenue derivado de un token de color (color-mix con el hueso).
function tint(token: string, pct = 12) {
  return `color-mix(in srgb, ${token} ${pct}%, var(--superficie))`;
}

export function UrgencyTag({ urgency }: { urgency: Urgency }) {
  const color = urgencyColor[urgency];
  return (
    <span
      className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-bold uppercase tracking-wide"
      style={{ color, background: tint(color, 14) }}
    >
      <span
        className="size-1.5 rounded-full"
        style={{ background: color }}
        aria-hidden
      />
      {urgencyLabel[urgency]}
    </span>
  );
}

export function VerifiedBadge() {
  return (
    <span
      className="inline-flex items-center gap-1 text-xs font-semibold"
      style={{ color: "var(--color-verificado)" }}
      title="Verificado por un coordinador"
    >
      <IconCheck className="size-3.5" />
      Verificado
    </span>
  );
}

export function AccessChip({ access }: { access: AccessStatus }) {
  const color = accessColor[access];
  return (
    <span
      className="inline-flex items-center gap-1.5 rounded-md px-2 py-1 text-xs font-medium"
      style={{ color: "var(--color-ceniza-2)", background: "var(--polvo)" }}
    >
      <span
        className="size-2 rounded-full"
        style={{ background: color }}
        aria-hidden
      />
      {accessLabel[access]}
    </span>
  );
}

export function NeedChips({ needTypes }: { needTypes: NeedType[] }) {
  return (
    <ul className="flex flex-wrap gap-1.5">
      {needTypes.map((n) => (
        <li
          key={n}
          className="rounded-md border px-2 py-0.5 text-xs font-semibold text-ceniza-2"
          style={{ borderColor: "var(--borde-fuerte)" }}
        >
          {needTypeLabel[n]}
        </li>
      ))}
    </ul>
  );
}

export function StageBadge({ stage }: { stage: Stage }) {
  const map: Record<Stage, { color: string; bg: string }> = {
    NUEVO: { color: "var(--color-ceniza-2)", bg: "var(--polvo)" },
    EN_ATENCION: {
      color: "var(--color-tierra-tinta)",
      bg: tint("var(--color-tierra)", 12),
    },
    RESUELTO: {
      color: "var(--color-bajo)",
      bg: tint("var(--color-bajo)", 12),
    },
    DESCARTADO: { color: "var(--color-ceniza-3)", bg: "var(--polvo)" },
  };
  const s = map[stage];
  return (
    <span
      className="inline-flex items-center rounded-full px-2 py-0.5 text-xs font-semibold"
      style={{ color: s.color, background: s.bg }}
    >
      {stageLabel[stage]}
    </span>
  );
}
