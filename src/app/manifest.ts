import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "FarmaLEM",
    short_name: "FarmaLEM",
    description: "Farmacia de barrio en Iztapalapa, CDMX. Catálogo, promociones y pedidos en línea.",
    start_url: "/",
    display: "standalone",
    background_color: "#fafbfc",
    theme_color: "#5385c0",
    lang: "es-MX",
    icons: [
      { src: "/icons/icon-192.png", sizes: "192x192", type: "image/png" },
      { src: "/icons/icon-512.png", sizes: "512x512", type: "image/png" },
      { src: "/icons/maskable-512.png", sizes: "512x512", type: "image/png", purpose: "maskable" },
    ],
  };
}
