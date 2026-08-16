import type { Metadata } from "next";
import { Bricolage_Grotesque, Lexend } from "next/font/google";
import { site } from "@/lib/site";
import { CartProvider } from "@/lib/cart-context";
import "./globals.css";

const bricolage = Bricolage_Grotesque({
  variable: "--font-bricolage",
  subsets: ["latin"],
  weight: ["600", "700", "800"],
});

const lexend = Lexend({
  variable: "--font-lexend",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
});

export const metadata: Metadata = {
  metadataBase: new URL(site.url),
  title: {
    default: "FarmaLEM — Siéntete bien con nosotros",
    template: "%s · FarmaLEM",
  },
  description:
    "Farmacia de barrio en Iztapalapa, CDMX. Promociones 3X2 y 5X4, precios claros y atención cercana. Consulta nuestro catálogo y compra en línea.",
  openGraph: {
    title: "FarmaLEM — Siéntete bien con nosotros",
    description:
      "Promociones 3X2 y 5X4, precios claros y atención cercana. Tu farmacia de barrio en Iztapalapa, CDMX.",
    url: site.url,
    siteName: "FarmaLEM",
    locale: "es_MX",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="es-MX" className={`${bricolage.variable} ${lexend.variable} h-full antialiased`}>
      <body className="min-h-full flex flex-col bg-paper text-ink">
        <CartProvider>{children}</CartProvider>
      </body>
    </html>
  );
}
