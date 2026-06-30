import type { Metadata } from "next";
import { SiteHeader } from "@/components/site-header";
import { CentroManager } from "@/components/centro-manager";

// Página privada por enlace: no debe indexarse ni aparecer en buscadores.
export const metadata: Metadata = {
  title: "Gestionar centro de acopio",
  robots: { index: false, follow: false },
};

export default async function GestionarCentroPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ token?: string }>;
}) {
  const { id } = await params;
  const { token } = await searchParams;

  return (
    <>
      <SiteHeader />
      <CentroManager id={id} token={token ?? ""} />
    </>
  );
}
