import type { Metadata } from "next";

// Manifest propio para que "Agregar a pantalla de inicio" desde /admin abra
// el panel de pedidos y no la tienda — sin esto, iOS usa el manifest raíz del
// sitio (start_url "/") sin importar en qué página estabas cuando lo agregaste.
export const metadata: Metadata = {
  manifest: "/admin-manifest.webmanifest",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "Pedidos",
  },
};

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return children;
}
