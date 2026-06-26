"use client";

import { useRef, useEffect } from "react";
import { useReportsFeed } from "@/lib/hooks";
import { ReportCard } from "@/components/report-card";

export function ReportsFeed() {
  const {
    data,
    fetchNextPage,
    hasNextPage,
    isFetchNextPageError,
    isFetchingNextPage,
    isLoading,
    isError,
    error,
    refetch,
  } = useReportsFeed();

  const items = data?.pages.flatMap((p) => p.items) ?? [];

  // Scroll infinito.
  const sentinel = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const el = sentinel.current;
    if (!el || !hasNextPage || isFetchingNextPage || isFetchNextPageError) return;
    const obs = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) void fetchNextPage();
      },
      { rootMargin: "400px" },
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, [hasNextPage, isFetchingNextPage, isFetchNextPageError, fetchNextPage]);

  if (isLoading) return <FeedSkeleton />;

  if (isError && items.length === 0) {
    return (
      <Notice
        title="No se pudieron cargar las solicitudes"
        body={error?.message ?? "Revisa tu conexión e intenta de nuevo."}
        action={<RetryButton onClick={() => void refetch()} />}
      />
    );
  }

  if (!isLoading && items.length === 0) {
    return (
      <Notice
        title="Aún no hay solicitudes"
        body="Cuando alguien reporte un punto que necesita ayuda, aparecerá aquí."
      />
    );
  }

  return (
    <div className="flex flex-col gap-5">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {items.map((r) => (
          <ReportCard key={r.id} report={r} />
        ))}
      </div>

      {hasNextPage && (
        <div ref={sentinel} className="flex justify-center py-2">
          <button
            type="button"
            onClick={() => void fetchNextPage()}
            disabled={isFetchingNextPage}
            className="rounded-[var(--radius-input)] border px-4 py-2 text-sm font-semibold text-ceniza-2 disabled:opacity-60"
            style={{ borderColor: "var(--borde-fuerte)" }}
          >
            {isFetchingNextPage ? "Cargando…" : "Cargar más"}
          </button>
        </div>
      )}

      {isFetchNextPageError && items.length > 0 && (
        <p className="text-center text-sm text-ceniza-3">
          No se pudo cargar más.{" "}
          <RetryLink onClick={() => void fetchNextPage()} />
        </p>
      )}
    </div>
  );
}

function FeedSkeleton() {
  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {Array.from({ length: 6 }).map((_, i) => (
        <div
          key={i}
          className="h-52 animate-pulse rounded-[var(--radius-card)] border bg-superficie"
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
