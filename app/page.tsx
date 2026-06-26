import { SiteHeader } from "@/components/site-header";
import { SolicitarAyudaButton } from "@/components/solicitar-ayuda-button";
import { ReportsFeed } from "@/components/reports-feed";

export default function Home() {
  return (
    <>
      <SiteHeader />
      <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-8 sm:px-6">
        <section className="mb-8 flex flex-col gap-4 border-b pb-8">
          <h1 className="max-w-2xl text-3xl font-extrabold leading-tight tracking-tight text-ceniza sm:text-4xl">
            Puntos que necesitan ayuda tras el terremoto
          </h1>
          <p className="max-w-2xl text-base leading-relaxed text-ceniza-2">
            Reporta dónde se necesita ayuda y ubica los puntos por urgencia y
            accesibilidad. Así la respuesta llega antes a quien más lo necesita.
          </p>
          <div className="flex flex-wrap items-center gap-3">
            <SolicitarAyudaButton variant="hero" />
            <a
              href="/mapa"
              className="inline-flex items-center rounded-[var(--radius-input)] border px-5 py-3.5 text-base font-semibold text-ceniza-2"
              style={{ borderColor: "var(--borde-fuerte)" }}
            >
              Ver el mapa
            </a>
          </div>
        </section>

        <section className="flex flex-col gap-5">
          <h2 className="text-sm font-bold uppercase tracking-wide text-ceniza-3">
            Solicitudes
          </h2>
          <ReportsFeed />
        </section>
      </main>

      <footer className="border-t">
        <div className="mx-auto w-full max-w-6xl px-4 py-6 text-xs text-ceniza-3 sm:px-6">
          Venezuela te necesita · Coordinación ciudadana de ayuda tras el sismo del
          24 de junio de 2026.
        </div>
      </footer>
    </>
  );
}
