import type { PublicReportDTO } from "@/lib/types";
import { urgencyColor } from "@/lib/labels";
import { timeAgo } from "@/lib/time";
import {
  UrgencyTag,
  VerifiedBadge,
  AccessChip,
  NeedChips,
  StageBadge,
} from "@/components/ui/badges";
import { IconUsers, IconInjured, IconChild, IconElder, IconPin } from "@/components/ui/icons";

export function ReportCard({ report: r }: { report: PublicReportDTO }) {
  const spine = urgencyColor[r.urgency];

  return (
    <article
      className="flex flex-col overflow-hidden rounded-[var(--radius-card)] border bg-superficie"
      style={{ borderLeft: `4px solid ${spine}` }}
    >
      {r.photoUrl ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={r.photoUrl}
          alt={`Foto del lugar: ${r.address}`}
          loading="lazy"
          className="aspect-[16/9] w-full object-cover"
        />
      ) : null}

      <div className="flex flex-col gap-3 p-4">
        <header className="flex items-center justify-between gap-2">
          <UrgencyTag urgency={r.urgency} />
          <time
            className="font-mono text-xs text-ceniza-3"
            dateTime={r.createdAt}
          >
            {timeAgo(r.createdAt)}
          </time>
        </header>

        <NeedChips needTypes={r.needTypes} />

        <div className="flex flex-wrap items-center gap-x-3 gap-y-1.5 text-sm text-ceniza-2">
          <span className="inline-flex items-center gap-1.5 font-semibold text-ceniza">
            <IconUsers className="size-4 text-ceniza-3" />
            {r.peopleCount} {r.peopleCount === 1 ? "persona" : "personas"}
          </span>
          {r.hasInjured && (
            <span className="inline-flex items-center gap-1" title="Hay heridos">
              <IconInjured className="size-4" style={{ color: "var(--color-critico)" }} />
              Heridos
            </span>
          )}
          {r.hasChildren && (
            <span className="inline-flex items-center gap-1" title="Hay niños">
              <IconChild className="size-4 text-ceniza-3" />
              Niños
            </span>
          )}
          {r.hasElderly && (
            <span className="inline-flex items-center gap-1" title="Hay adultos mayores">
              <IconElder className="size-4 text-ceniza-3" />
              Adultos mayores
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

        <footer className="mt-1 flex items-center justify-between gap-2 border-t pt-3">
          <StageBadge stage={r.stage} />
          <div className="flex items-center gap-2">
            {r.verified && <VerifiedBadge />}
            <span className="font-mono text-[11px] text-ceniza-4">
              {r.latitude.toFixed(4)}, {r.longitude.toFixed(4)}
            </span>
          </div>
        </footer>
      </div>
    </article>
  );
}
