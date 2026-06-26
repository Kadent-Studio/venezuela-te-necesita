import type { Metadata } from "next";
import { SiteHeader } from "@/components/site-header";
import { HomeShell } from "@/components/home-shell";

export const metadata: Metadata = {
  description:
    "Encuentra y reporta puntos que necesitan ayuda tras el terremoto del 24 de junio de 2026. Filtra por urgencia, tipo de necesidad y accesibilidad.",
  openGraph: {
    title: "Unidos Venezuela — Cada punto es alguien esperando",
    description:
      "Reporta dónde se necesita ayuda y ubica los puntos por urgencia y accesibilidad. Así la respuesta llega antes a quien más lo necesita.",
    url: "/",
  },
  alternates: { canonical: "/" },
};

export default function Home() {
  return (
    <>
      <SiteHeader />
      <HomeShell />

      <footer className="border-t pb-safe">
        <div className="mx-auto flex w-full max-w-7xl flex-col gap-3 px-4 py-8 text-xs text-ceniza-3 sm:flex-row sm:items-center sm:justify-between sm:px-8 lg:px-12">
          <p>
            Unidos Venezuela · Coordinación ciudadana de ayuda tras el sismo
            del 24 de junio de 2026.
          </p>
          <p className="text-ceniza-2">
            Realizado por el equipo de desarrollo de{" "}
            <a
              href="https://kadent.studio"
              target="_blank"
              rel="noopener noreferrer"
              className="font-semibold text-ceniza hover:text-tierra"
            >
              Kadent Studio
            </a>
          </p>
        </div>
      </footer>
    </>
  );
}
