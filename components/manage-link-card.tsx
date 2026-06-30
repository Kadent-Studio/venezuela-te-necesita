"use client";

import { useState } from "react";
import { IconCheck, IconWhatsApp } from "@/components/ui/icons";

// Construye la URL absoluta del enlace de gestión de un centro.
export function manageUrl(id: string, token: string): string {
  const origin = typeof window !== "undefined" ? window.location.origin : "";
  return `${origin}/centros/${id}/gestionar?token=${encodeURIComponent(token)}`;
}

export function ManageLinkCard({ id, token }: { id: string; token: string }) {
  const [copied, setCopied] = useState(false);
  const url = manageUrl(id, token);

  async function copy() {
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Sin portapapeles: el usuario puede copiar manualmente del campo.
    }
  }

  const waText = encodeURIComponent(
    `Enlace para gestionar el centro de acopio (mantén actualizado qué falta). No lo compartas públicamente:\n${url}`,
  );
  const waHref = `https://wa.me/?text=${waText}`;

  return (
    <div
      className="flex flex-col gap-3 rounded-[var(--radius-input)] border p-3"
      style={{
        borderColor: "var(--color-tierra)",
        background: "color-mix(in srgb, var(--color-tierra) 6%, var(--superficie))",
      }}
    >
      <span className="font-mono text-[10px] uppercase tracking-[0.16em] text-ceniza-3">
        Enlace de gestión (privado)
      </span>
      <input
        readOnly
        value={url}
        onFocus={(e) => e.currentTarget.select()}
        className="w-full rounded-[var(--radius-input)] border bg-polvo px-3 py-2 font-mono text-xs text-ceniza-2"
        aria-label="Enlace de gestión"
      />
      <div className="flex gap-2">
        <button
          type="button"
          onClick={copy}
          className="inline-flex h-10 flex-1 items-center justify-center gap-1.5 rounded-[var(--radius-input)] border text-sm font-semibold text-ceniza transition-colors hover:bg-[var(--borde-suave)]"
          style={{ borderColor: "var(--borde-fuerte)" }}
        >
          {copied ? <IconCheck className="size-4" /> : null}
          {copied ? "Copiado" : "Copiar enlace"}
        </button>
        <a
          href={waHref}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex h-10 flex-1 items-center justify-center gap-1.5 rounded-[var(--radius-input)] text-sm font-semibold text-white transition-opacity hover:opacity-90"
          style={{ background: "#25D366" }}
        >
          <IconWhatsApp className="size-4" />
          Compartir
        </a>
      </div>
    </div>
  );
}
