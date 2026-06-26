import type { Metadata } from "next";
import { SiteHeader } from "@/components/site-header";

export const metadata: Metadata = {
  title: "Mapa de ayuda — Venezuela te necesita",
};

// Placeholder — el mapa interactivo llega en la Fase 3.
export default function MapaPage() {
  return (
    <>
      <SiteHeader />
      <main className="mx-auto flex w-full max-w-6xl flex-1 flex-col items-center justify-center px-4 py-24 text-center sm:px-6">
        <h1 className="text-2xl font-extrabold tracking-tight text-ceniza">
          Mapa de ayuda
        </h1>
        <p className="mt-2 max-w-md text-sm text-ceniza-2">
          El mapa con los puntos georreferenciados estará disponible próximamente.
          Por ahora puedes ver y crear solicitudes en la página principal.
        </p>
      </main>
    </>
  );
}
