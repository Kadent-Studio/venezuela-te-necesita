import type { Metadata } from "next";
import { SiteHeader } from "@/components/site-header";
import { CentrosMap } from "@/components/centros-map";

export const metadata: Metadata = {
  title: "Centros de acopio",
  description:
    "Mapa de centros de acopio tras el sismo del 24-J. Filtra por insumo para saber qué necesita cada centro y cuál está saturado, y dona sin sobre-cargar un solo ítem.",
  openGraph: {
    title: "Centros de acopio — Unidos Venezuela",
    description:
      "Encuentra dónde llevar donaciones. Cada centro muestra qué le falta y qué le sobra, para distribuir la ayuda mejor.",
    url: "/centros",
  },
  alternates: { canonical: "/centros" },
};

export default function CentrosPage() {
  return (
    <>
      <SiteHeader />
      <main className="flex flex-1">
        <CentrosMap />
      </main>
    </>
  );
}
