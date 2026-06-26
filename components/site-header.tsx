"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { SolicitarAyudaButton } from "@/components/solicitar-ayuda-button";
import { UnVeMonogram } from "@/components/unve-monogram";
import { IconPin } from "@/components/ui/icons";

const NAV_LINKS = [
  { href: "/", label: "Reportes" },
  { href: "/mapa", label: "Mapa" },
] as const;

export function SiteHeader() {
  const pathname = usePathname();
  const isActive = (href: string) =>
    href === "/" ? pathname === "/" : pathname.startsWith(href);

  return (
    <header
      className="sticky top-0 z-30 border-b backdrop-blur-md pt-safe"
      style={{
        background: "color-mix(in srgb, var(--hueso) 82%, transparent)",
        borderColor: "var(--borde)",
      }}
    >
      <div className="mx-auto flex w-full max-w-7xl items-center justify-between gap-2 px-3 py-2.5 sm:gap-4 sm:px-8 sm:py-3 lg:px-12">
        <Link
          href="/"
          className="group flex min-w-0 items-center gap-2.5 rounded-md outline-none sm:gap-3"
          aria-label="Unidos Venezuela — inicio"
        >
          <UnVeMonogram className="size-9 shrink-0" />
          <span className="flex min-w-0 flex-col leading-tight">
            <span className="truncate text-[13px] font-extrabold tracking-tight text-ceniza sm:text-[15px]">
              Unidos <span className="text-tierra">Venezuela</span>
            </span>
            <span className="hidden text-[11px] font-medium uppercase tracking-[0.12em] text-ceniza-3 sm:block">
              Coordinación · sismo 24-J
            </span>
          </span>
        </Link>

        <nav
          className="flex shrink-0 items-center gap-1 sm:gap-2"
          aria-label="Principal"
        >
          {/* Mapa: icono en móvil (tap target 44px), pill en desktop */}
          <Link
            href="/mapa"
            aria-current={isActive("/mapa") ? "page" : undefined}
            aria-label="Mapa"
            className="inline-flex h-11 w-11 items-center justify-center rounded-[var(--radius-input)] text-ceniza-2 transition-colors sm:hidden"
            style={{
              background: isActive("/mapa") ? "var(--polvo)" : "transparent",
              color: isActive("/mapa") ? "var(--ceniza)" : "var(--ceniza-2)",
            }}
          >
            <IconPin className="size-5" />
          </Link>

          <ul className="mr-1 hidden items-center gap-1 sm:flex">
            {NAV_LINKS.map((link) => {
              const active = isActive(link.href);
              return (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    aria-current={active ? "page" : undefined}
                    className="relative inline-flex h-10 items-center rounded-[var(--radius-input)] px-3 text-sm font-semibold transition-colors"
                    style={{
                      color: active ? "var(--ceniza)" : "var(--ceniza-2)",
                      background: active ? "var(--polvo)" : "transparent",
                    }}
                  >
                    {link.label}
                  </Link>
                </li>
              );
            })}
          </ul>

          <span
            className="mx-1 hidden h-6 w-px sm:block"
            style={{ background: "var(--borde)" }}
            aria-hidden
          />

          <SolicitarAyudaButton variant="primary" />
        </nav>
      </div>
    </header>
  );
}
