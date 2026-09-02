import type { Metadata } from "next";
import { requireAdminSession } from "@/lib/admin-auth";
import { getProfileById } from "@/lib/profiles";
import { getBreakevenMargin } from "@/lib/breakeven";
import { hasDeletePin } from "@/lib/security-settings";
import { getModuleEditorStructure } from "@/lib/panel-modules";
import { AdminShell } from "@/components/admin/AdminShell";
import { BreakevenMarginForm } from "@/components/admin/BreakevenMarginForm";
import { DeletePinForm } from "@/components/admin/DeletePinForm";
import { PanelModulesEditor } from "@/components/admin/PanelModulesEditor";

export const metadata: Metadata = { title: "Configuración" };
export const dynamic = "force-dynamic";

export default async function ConfiguracionPage() {
  const session = await requireAdminSession();
  const [profile, marginPercent, pinSet, moduleEntries] = await Promise.all([
    getProfileById(session.uid),
    getBreakevenMargin(),
    hasDeletePin(),
    getModuleEditorStructure(),
  ]);

  return (
    <AdminShell activeHref="/admin/configuracion" userName={profile?.full_name ?? "Sin nombre"} userRole={session.role}>
      <h1 className="font-display text-2xl text-admin-ink">Configuración</h1>
      <p className="mt-1.5 text-[0.86rem] text-admin-ink-soft">Aquí se irán agregando las opciones del panel conforme se vayan definiendo.</p>

      <section className="mt-6 rounded-2xl border border-admin-border bg-admin-surface p-6">
        <h2 className="font-display text-base text-admin-ink">Panel de navegación</h2>
        <p className="mt-1 text-[0.84rem] text-admin-ink-soft">
          Activa o desactiva cada pantalla, decide cuáles ve el vendedor además del administrador, y cambia el orden con las flechas. Inicio y
          Configuración siempre están activos para no quedarte sin acceso al panel.
        </p>
        <PanelModulesEditor initialEntries={moduleEntries} />
      </section>

      <section className="mt-5 rounded-2xl border border-admin-border bg-admin-surface p-6">
        <h2 className="font-display text-base text-admin-ink">Punto de equilibrio</h2>
        <p className="mt-1 text-[0.84rem] text-admin-ink-soft">
          El panel no separa las ventas por categoría de producto, así que el punto de equilibrio usa este margen estimado en vez de calcularlo por
          categoría.
        </p>
        <div className="mt-4">
          <BreakevenMarginForm currentPercent={marginPercent} />
        </div>
      </section>

      <section className="mt-5 rounded-2xl border border-admin-border bg-admin-surface p-6">
        <h2 className="font-display text-base text-admin-ink">PIN de eliminación</h2>
        <p className="mt-1 text-[0.84rem] text-admin-ink-soft">
          {pinSet
            ? "Se pide para eliminar un empleado en Empleados. Solo se puede eliminar a alguien sin cortes, asistencia ni sueldos capturados."
            : "Todavía no está configurado — hasta que lo captures, no vas a poder eliminar empleados."}
        </p>
        <div className="mt-4">
          <DeletePinForm hasPin={pinSet} />
        </div>
      </section>
    </AdminShell>
  );
}
