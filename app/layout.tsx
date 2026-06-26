import Providers from "@/components/providers";
import "leaflet/dist/leaflet.css";
import "leaflet.markercluster/dist/MarkerCluster.css";
import "leaflet.markercluster/dist/MarkerCluster.Default.css";
import type { Metadata, Viewport } from "next";
import { IBM_Plex_Mono, Public_Sans } from "next/font/google";
import { getBaseUrl } from "@/lib/url";
import { Analytics } from "@vercel/analytics/next";
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
  metadataBase: getBaseUrl(),
  title: {
    default: "Unidos Venezuela — Solicita y coordina ayuda",
    template: "%s — Unidos Venezuela",
  },
  description:
    "Reporta y ubica puntos que necesitan ayuda tras el terremoto del 24 de junio de 2026 en Venezuela. Coordina la respuesta ciudadana por urgencia y accesibilidad.",
  applicationName: "Unidos Venezuela",
  keywords: [
    "Venezuela",
    "terremoto",
    "ayuda",
    "sismo 24 junio 2026",
    "emergencia",
    "coordinación ciudadana",
    "mapa de ayuda",
    "solicitar ayuda",
    "reportar necesidad",
  ],
  creator: "Kadent Studio",
  publisher: "Kadent Studio",
  formatDetection: { telephone: true, date: true, address: true },
  category: "emergency",
  openGraph: {
    type: "website",
    siteName: "Unidos Venezuela",
    locale: "es_VE",
    title: "Unidos Venezuela — Solicita y coordina ayuda",
    description:
      "Reporta y ubica puntos que necesitan ayuda tras el sismo del 24-J. Coordinación ciudadana por urgencia.",
  },
  twitter: {
    card: "summary_large_image",
    title: "Unidos Venezuela — Solicita y coordina ayuda",
    description:
      "Reporta y ubica puntos que necesitan ayuda tras el terremoto del 24 de junio de 2026.",
  },
  alternates: {
    canonical: "/",
    languages: { "es-VE": "/" },
  },
  robots: {
    index: true,
    follow: true,
    "max-image-preview": "large",
    "max-snippet": -1,
    "max-video-preview": -1,
  },
  icons: {
    icon: [
      { url: "/icon.svg", type: "image/svg+xml" },
      { url: "/favicon.ico", sizes: "48x48" },
    ],
    apple: [{ url: "/apple-icon.svg", type: "image/svg+xml" }],
  },
  appleWebApp: {
    capable: true,
    title: "Unidos Venezuela",
    statusBarStyle: "default",
  },
  other: {
    "mobile-web-app-capable": "yes",
  },
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
  const baseUrl = getBaseUrl();

  return (
    <html
      lang="es-VE"
      className={`${publicSans.variable} ${plexMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col bg-hueso text-ceniza">
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@type": "WebSite",
              name: "Unidos Venezuela",
              url: baseUrl,
              description:
                "Coordinación ciudadana de ayuda tras el sismo del 24 de junio de 2026 en Venezuela.",
              about: {
                "@type": "Event",
                name: "Terremoto Venezuela 24 de junio de 2026",
              },
              potentialAction: {
                "@type": "SearchAction",
                target: {
                  "@type": "EntryPoint",
                  urlTemplate: `${baseUrl}/mapa?q={search_term_string}`,
                },
                "query-input": "required name=search_term_string",
              },
            }),
          }}
        />
        <Providers>{children}</Providers>
        <Analytics />
      </body>
    </html>
  );
}
