"use client";

import { useState } from "react";
import { ReportForm } from "@/components/report-form";
import { IconPlus, IconX } from "@/components/ui/icons";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

export function SolicitarAyudaButton({
  variant = "primary",
}: {
  variant?: "primary" | "hero";
}) {
  const [open, setOpen] = useState(false);

  const cls =
    variant === "hero"
      ? "inline-flex items-center justify-center gap-2 rounded-[var(--radius-input)] px-6 h-12 sm:h-14 text-base sm:text-lg font-bold shadow-sm active:scale-[0.98] transition-transform"
      : "inline-flex items-center justify-center gap-1.5 rounded-[var(--radius-input)] px-3 h-11 sm:px-4 sm:h-10 text-sm font-bold shadow-sm active:scale-[0.98] transition-transform";

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <button
          type="button"
          className={cls}
          style={{
            background: "var(--color-tierra)",
            color: "var(--superficie)",
          }}
        >
          <IconPlus className="size-4 shrink-0" />
          <span className="whitespace-nowrap">
            <span className="sm:hidden">Ayuda</span>
            <span className="hidden sm:inline">Solicitar ayuda</span>
          </span>
        </button>
      </DialogTrigger>

      <DialogContent className="flex max-h-dvh h-[92dvh] w-full sm:max-w-xl flex-col overflow-hidden gap-0 border bg-superficie p-0 shadow-xl sm:top-[50%] sm:left-[50%] sm:h-auto sm:max-h-[92vh] sm:translate-x-[-50%] sm:translate-y-[-50%] max-sm:bottom-0 max-sm:top-auto max-sm:left-0 max-sm:right-0 max-sm:translate-x-0 max-sm:translate-y-0 max-sm:rounded-b-none">
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
        <DialogHeader className="border-b px-4 py-3 sm:px-5 sm:py-4 gap-0">
          <DialogTitle className="text-lg font-bold text-ceniza">
            Solicitar ayuda
          </DialogTitle>
          <DialogDescription className="truncate text-xs text-ceniza-3">
            Indica dónde y qué se necesita. Toma un minuto.
          </DialogDescription>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto overscroll-contain px-4 py-4 pb-safe sm:px-5 sm:py-5">
          <ReportForm onSuccess={() => setOpen(false)} />
        </div>
      </DialogContent>
    </Dialog>
  );
}
