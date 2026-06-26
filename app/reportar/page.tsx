import type { Metadata } from "next";
import Link from "next/link";
import { SiteHeader } from "@/components/site-header";
import { ReportForm } from "@/components/report-form";

export const metadata: Metadata = {
  title: "Solicitar ayuda — Venezuela te necesita",
  description:
    "Reporta un punto que necesita ayuda tras el terremoto del 24 de junio de 2026.",
};

// Respaldo del modal: misma experiencia para enlaces compartibles y clientes sin JS.
export default function ReportarPage() {
  return (
    <>
      <SiteHeader />
      <main className="mx-auto w-full max-w-xl flex-1 px-4 py-6 sm:px-6 sm:py-8">
        <div className="mb-5 flex flex-col gap-1 sm:mb-6">
          <Link
            href="/"
            className="inline-flex h-9 w-fit items-center text-sm font-semibold text-ceniza-3 hover:text-ceniza"
          >
            ← Volver
          </Link>
          <h1 className="text-2xl font-extrabold tracking-tight text-ceniza">
            Solicitar ayuda
          </h1>
          <p className="text-sm text-ceniza-2">
            Indica dónde y qué se necesita. Toma un minuto.
          </p>
        </div>
        <div className="rounded-[var(--radius-card)] border bg-superficie p-4 sm:p-5">
          <ReportForm />
        </div>
      </main>
    </>
  );
}
