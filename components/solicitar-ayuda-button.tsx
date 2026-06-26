"use client";

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { ReportForm } from "@/components/report-form";
import { IconPlus, IconX } from "@/components/ui/icons";

export function SolicitarAyudaButton({
  variant = "primary",
}: {
  variant?: "primary" | "hero";
}) {
  const [open, setOpen] = useState(false);
  const [mounted, setMounted] = useState(false);

  // Sólo permite portalear tras montar: evita hydration mismatch en SSR.
  useEffect(() => setMounted(true), []);

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

  // h-11 (44px) en mobile / h-10 desktop. Texto pleno: el CTA primario nunca
  // queda como icono solo en una app de emergencia — claridad antes que densidad.
  const cls =
    variant === "hero"
      ? "inline-flex items-center justify-center gap-2 rounded-[var(--radius-input)] px-6 h-12 sm:h-14 text-base sm:text-lg font-bold shadow-sm active:scale-[0.98] transition-transform"
      : "inline-flex items-center justify-center gap-1.5 rounded-[var(--radius-input)] px-3 h-11 sm:px-4 sm:h-10 text-sm font-bold shadow-sm active:scale-[0.98] transition-transform";

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className={cls}
        style={{ background: "var(--color-tierra)", color: "var(--superficie)" }}
      >
        <IconPlus className="size-4 shrink-0" />
        <span className="whitespace-nowrap">
          {/* "Ayuda" como etiqueta corta en pantallas estrechas; el ícono + sigue
              comunicando "agregar reporte". El texto completo aparece sm+. */}
          <span className="sm:hidden">Ayuda</span>
          <span className="hidden sm:inline">Solicitar ayuda</span>
        </span>
      </button>

      {open && mounted &&
        createPortal(
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
          <div className="relative z-10 flex max-h-[100dvh] h-[92dvh] w-full max-w-xl flex-col overflow-hidden rounded-t-[var(--radius-modal)] border bg-superficie shadow-xl sm:h-auto sm:max-h-[92vh] sm:rounded-[var(--radius-modal)]">
            {/* Handle de bottom-sheet: indicador visual de que se puede cerrar */}
            <div
              className="flex justify-center pt-2 sm:hidden"
              onClick={() => setOpen(false)}
              aria-hidden
            >
              <span
                className="block h-1 w-10 rounded-full"
                style={{ background: "var(--borde-fuerte)" }}
              />
            </div>
            <header className="flex items-center justify-between border-b px-4 py-3 sm:px-5 sm:py-4">
              <div className="min-w-0">
                <h2 className="text-lg font-bold text-ceniza">Solicitar ayuda</h2>
                <p className="truncate text-xs text-ceniza-3">
                  Indica dónde y qué se necesita. Toma un minuto.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setOpen(false)}
                aria-label="Cerrar"
                className="inline-flex size-11 shrink-0 items-center justify-center rounded-full text-ceniza-2 hover:bg-polvo sm:size-9"
              >
                <IconX className="size-5" />
              </button>
            </header>
            <div className="flex-1 overflow-y-auto overscroll-contain px-4 py-4 pb-safe sm:px-5 sm:py-5">
              <ReportForm onSuccess={() => undefined} />
            </div>
          </div>
        </div>,
        document.body,
      )}
    </>
  );
}
