import Link from "next/link";
import { SolicitarAyudaButton } from "@/components/solicitar-ayuda-button";

export function SiteHeader() {
  return (
    <header
      className="sticky top-0 z-30 border-b backdrop-blur"
      style={{ background: "color-mix(in srgb, var(--hueso) 88%, transparent)" }}
    >
      <div className="mx-auto flex w-full max-w-6xl items-center justify-between gap-4 px-4 py-3 sm:px-6">
        <Link href="/" className="flex items-center gap-2.5">
          <span
            className="block size-6 rounded-[5px]"
            style={{
              background:
                "linear-gradient(135deg, var(--color-critico) 0 50%, var(--color-alto) 50% 100%)",
            }}
            aria-hidden
          />
          <span className="flex flex-col leading-none">
            <span className="text-sm font-extrabold tracking-tight text-ceniza">
              Venezuela te necesita
            </span>
            <span className="text-[11px] text-ceniza-3">
              Coordinación de ayuda · sismo 24-J
            </span>
          </span>
        </Link>

        <nav className="flex items-center gap-2 sm:gap-4">
          <Link
            href="/mapa"
            className="hidden px-2 text-sm font-semibold text-ceniza-2 hover:text-ceniza sm:block"
          >
            Mapa
          </Link>
          <SolicitarAyudaButton variant="primary" />
        </nav>
      </div>
    </header>
  );
}
