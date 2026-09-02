import { getResolvedNav } from "@/lib/panel-modules";
import type { ProfileRole } from "@/lib/admin-auth";
import { AdminShellClient } from "@/components/admin/AdminShellClient";

/**
 * Envoltura del panel: resuelve qué módulos se muestran (según lo configurado
 * en /admin/configuracion) y le pasa el menú ya armado al componente cliente,
 * que es el que trae la interacción (colapsar, acordeón, etc.).
 */
export async function AdminShell({
  activeHref,
  userName,
  userRole,
  children,
}: {
  activeHref: string;
  userName: string;
  userRole: ProfileRole;
  children: React.ReactNode;
}) {
  const navItems = await getResolvedNav(userRole === "admin");

  return (
    <AdminShellClient navItems={navItems} activeHref={activeHref} userName={userName} userRole={userRole}>
      {children}
    </AdminShellClient>
  );
}
