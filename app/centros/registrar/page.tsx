import type { Metadata } from "next";
import Link from "next/link";
import { SiteHeader } from "@/components/site-header";
import { CentroForm } from "@/components/centro-form";

export const metadata: Metadata = {
  title: "Registrar centro de acopio",
  description:
    "Registra un centro de acopio: ubícalo en el mapa, asigna a una persona encargada y marca qué insumos necesita para coordinar las donaciones.",
  openGraph: {
    title: "Registrar centro de acopio — Unidos Venezuela",
    description:
      "Registra un centro de acopio tras el sismo del 24 de junio de 2026 e indica qué necesita.",
    url: "/centros/registrar",
  },
  alternates: { canonical: "/centros/registrar" },
};

// Respaldo del modal: misma experiencia para enlaces compartibles y sin JS.
export default function RegistrarCentroPage() {
  return (
    <>
      <SiteHeader />
      <main className="mx-auto w-full max-w-xl flex-1 px-4 py-6 sm:px-6 sm:py-8">
        <div className="mb-5 flex flex-col gap-1 sm:mb-6">
          <Link
            href="/centros"
            className="inline-flex h-9 w-fit items-center text-sm font-semibold text-ceniza-3 hover:text-ceniza"
          >
            ← Volver
          </Link>
          <h1 className="text-2xl font-extrabold tracking-tight text-ceniza">
            Registrar centro de acopio
          </h1>
          <p className="text-sm text-ceniza-2">
            Ubícalo, asigna un encargado y marca qué necesita.
          </p>
        </div>
        <div className="rounded-[var(--radius-card)] border bg-superficie p-4 sm:p-5">
          <CentroForm />
        </div>
      </main>
    </>
  );
}
