import type { Metadata } from "next";
import { SiteHeader } from "@/components/site-header";
import { ReportsMap } from "@/components/reports-map";

export const metadata: Metadata = {
  title: "Mapa de ayuda — SOS Venezuela",
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
