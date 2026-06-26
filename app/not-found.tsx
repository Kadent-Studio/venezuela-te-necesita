import type { Metadata } from "next";
import Link from "next/link";
import { SiteHeader } from "@/components/site-header";

export const metadata: Metadata = {
  title: "Página no encontrada",
  robots: { index: false, follow: false },
};

export default function NotFound() {
  return (
    <>
      <SiteHeader />
      <main className="flex flex-1 items-center justify-center px-4 py-16">
        <div className="flex max-w-md flex-col items-center gap-4 text-center">
          <p
            className="font-mono text-8xl font-bold leading-none tracking-tighter"
            style={{ color: "var(--color-critico)" }}
          >
            404
          </p>
          <h1 className="text-xl font-extrabold text-ceniza">
            Página no encontrada
          </h1>
          <p className="text-sm leading-relaxed text-ceniza-2">
            La página que buscas no existe o fue movida. Volvé al inicio para
            seguir ayudando.
          </p>
          <Link
            href="/"
            className="mt-2 inline-flex h-12 items-center justify-center rounded-[var(--radius-input)] bg-ceniza px-6 text-sm font-bold text-[var(--superficie)] transition-transform active:scale-[0.98]"
          >
            Ir al inicio
          </Link>
        </div>
      </main>
    </>
  );
}
