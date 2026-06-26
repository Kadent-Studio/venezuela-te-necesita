"use client";

import { useEffect, useState } from "react";
import { ReportForm } from "@/components/report-form";
import { IconPlus, IconX } from "@/components/ui/icons";

export function SolicitarAyudaButton({
  variant = "primary",
}: {
  variant?: "primary" | "hero";
}) {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    document.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [open]);

  const cls =
    variant === "hero"
      ? "inline-flex items-center justify-center gap-2 rounded-[var(--radius-input)] px-6 py-3.5 text-base font-bold"
      : "inline-flex items-center justify-center gap-2 rounded-[var(--radius-input)] px-4 h-10 text-sm font-bold";

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className={cls}
        style={{ background: "var(--color-tierra)", color: "var(--superficie)" }}
      >
        <IconPlus className="size-4" />
        Solicitar ayuda
      </button>

      {open && (
        <div
          className="fixed inset-0 z-[3000] flex items-end justify-center sm:items-start sm:py-10"
          role="dialog"
          aria-modal="true"
          aria-label="Solicitar ayuda"
        >
          <button
            type="button"
            aria-label="Cerrar"
            onClick={() => setOpen(false)}
            className="absolute inset-0 bg-[rgba(31,27,23,0.45)]"
          />
          <div className="relative z-10 flex max-h-[92vh] w-full max-w-xl flex-col overflow-hidden rounded-t-[var(--radius-modal)] border bg-superficie shadow-xl sm:rounded-[var(--radius-modal)]">
            <header className="flex items-center justify-between border-b px-5 py-4">
              <div>
                <h2 className="text-lg font-bold text-ceniza">Solicitar ayuda</h2>
                <p className="text-xs text-ceniza-3">
                  Indica dónde y qué se necesita. Toma un minuto.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setOpen(false)}
                aria-label="Cerrar"
                className="rounded-full p-1.5 text-ceniza-2 hover:bg-polvo"
              >
                <IconX className="size-5" />
              </button>
            </header>
            <div className="overflow-y-auto px-5 py-5">
              <ReportForm onSuccess={() => undefined} />
            </div>
          </div>
        </div>
      )}
    </>
  );
}
