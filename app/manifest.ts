import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Unidos Venezuela — Coordinación de ayuda",
    short_name: "Unidos Venezuela",
    description:
      "Reporta y ubica puntos que necesitan ayuda tras el terremoto del 24 de junio de 2026 en Venezuela.",
    start_url: "/",
    display: "standalone",
    background_color: "#faf7f2",
    theme_color: "#faf7f2",
    orientation: "any",
    lang: "es-VE",
    icons: [
      {
        src: "/icon.svg",
        sizes: "any",
        type: "image/svg+xml",
        purpose: "any",
      },
      {
        src: "/apple-icon.svg",
        sizes: "180x180",
        type: "image/svg+xml",
        purpose: "any",
      },
    ],
    categories: ["emergency", "social", "maps"],
    iarc_rating_id: "no-age-rating",
    related_applications: [],
    prefer_related_applications: false,
  };
}
