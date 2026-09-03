import { getResolvedNav } from "@/lib/panel-modules";
import { requireSession, type ProfileRole } from "@/lib/admin-auth";
import { getProfileById } from "@/lib/profiles";
import { AdminShellClient } from "@/components/admin/AdminShellClient";

/**
 * Envoltura del panel: resuelve qué módulos se muestran (según lo configurado
 * en /admin/configuracion) y le pasa el menú ya armado al componente cliente,
 * que es el que trae la interacción (colapsar, acordeón, etc.). Vuelve a leer
 * la sesión y el perfil (ya se leyeron antes en la página, pero eso vive en
 * cookies/DB, no en props) para saber el rol de permisos (role_id) de quien
 * la está viendo, sin tener que pasarlo a mano desde cada una de las
 * pantallas que usan AdminShell.
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
  const session = await requireSession();
  const profile = await getProfileById(session.uid);
  const navItems = await getResolvedNav(userRole === "admin", profile?.role_id ?? null);

  return (
    <AdminShellClient navItems={navItems} activeHref={activeHref} userName={userName} userRole={userRole}>
      {children}
    </AdminShellClient>
  );
}
