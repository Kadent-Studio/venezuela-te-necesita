import type { Metadata, Viewport } from "next";
import { Public_Sans, IBM_Plex_Mono } from "next/font/google";
import "leaflet/dist/leaflet.css";
import "./globals.css";

const publicSans = Public_Sans({
  variable: "--font-public-sans",
  subsets: ["latin"],
  display: "swap",
});

const plexMono = IBM_Plex_Mono({
  variable: "--font-plex-mono",
  subsets: ["latin"],
  weight: ["400", "500", "600"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "Venezuela te necesita — Solicita y coordina ayuda",
  description:
    "Reporta y ubica puntos que necesitan ayuda tras el terremoto del 24 de junio de 2026 en Venezuela. Coordina la respuesta por urgencia y accesibilidad.",
};

// viewport-fit=cover habilita env(safe-area-inset-*) en iOS; maximumScale 5 mantiene
// el pellizco para accesibilidad (no deshabilitar zoom en una app de emergencia).
export const viewport: Viewport = {
  themeColor: "#faf7f2",
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
  viewportFit: "cover",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="es-VE"
      className={`${publicSans.variable} ${plexMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col bg-hueso text-ceniza">
        {children}
      </body>
    </html>
  );
}
