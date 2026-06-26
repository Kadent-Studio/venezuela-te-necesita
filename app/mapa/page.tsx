import type { Metadata } from "next";
import { SiteHeader } from "@/components/site-header";
import { ReportsMap } from "@/components/reports-map";

export const metadata: Metadata = {
  title: "Mapa de ayuda",
  description:
    "Explora el mapa interactivo con los puntos de ayuda activos tras el sismo del 24-J. Filtra por urgencia, tipo de necesidad y accesibilidad. Cada pin es una solicitud abierta.",
  openGraph: {
    title: "Mapa de ayuda — Unidos Venezuela",
    description:
      "Explora el mapa interactivo con los puntos de ayuda activos. Cada pin es una solicitud abierta. Filtra por urgencia, necesidad y accesibilidad.",
    url: "/mapa",
  },
  alternates: { canonical: "/mapa" },
};

export default function MapaPage() {
  return (
    <>
      <SiteHeader />
      <main className="flex flex-1">
        <ReportsMap />
      </main>
    </>
  );
}
