import type { Metadata } from "next";
import Link from "next/link";
import { requireAdminSession } from "@/lib/admin-auth";
import { getProfileById, listProfiles } from "@/lib/profiles";
import { AdminShell } from "@/components/admin/AdminShell";

export const metadata: Metadata = { title: "Empleados" };
export const dynamic = "force-dynamic";

export default async function EmployeesPage() {
  const session = await requireAdminSession();
  const [profile, employees] = await Promise.all([getProfileById(session.uid), listProfiles()]);

  return (
    <AdminShell activeHref="/admin/empleados" userName={profile?.full_name ?? "Sin nombre"} userRole={session.role}>
      <div className="flex flex-wrap items-center justify-between gap-4">
        <h1 className="font-display text-2xl text-admin-ink">Empleados</h1>
        <Link
          href="/admin/empleados/nuevo"
          className="rounded-full bg-admin-primary px-5 py-2.5 text-[0.85rem] font-semibold text-white transition-transform duration-150 ease-out active:scale-[0.97]"
        >
          + Nuevo empleado
        </Link>
      </div>
      <p className="mt-1.5 text-[0.86rem] text-admin-ink-soft">Edita turnos, accesos y estado sin perder el historial.</p>

      <section className="mt-6 overflow-hidden rounded-2xl border border-admin-border bg-admin-surface">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-[0.86rem]">
            <thead>
              <tr className="border-b border-admin-border text-admin-ink-soft">
                <th className="px-5 py-3 font-medium">Nombre</th>
                <th className="px-5 py-3 font-medium">Usuario</th>
                <th className="px-5 py-3 font-medium">Turno</th>
                <th className="px-5 py-3 font-medium">Rol</th>
                <th className="px-5 py-3 font-medium">Estado</th>
                <th className="px-5 py-3"></th>
              </tr>
            </thead>
            <tbody>
              {employees.map((e) => (
                <tr key={e.id} className="border-b border-admin-border last:border-0">
                  <td className="px-5 py-3 font-semibold text-admin-ink">{e.full_name}</td>
                  <td className="px-5 py-3 text-admin-ink-soft">{e.username}</td>
                  <td className="px-5 py-3 text-admin-ink-soft">{e.shift}</td>
                  <td className="px-5 py-3 text-admin-ink-soft">{e.role === "admin" ? "Administración" : "Empleado"}</td>
                  <td className="px-5 py-3">
                    <span
                      className={`rounded-full px-2.5 py-1 text-[0.76rem] font-semibold ${
                        e.active ? "bg-admin-ok-bg text-admin-ok-text" : "bg-admin-bad-bg text-admin-bad-text"
                      }`}
                    >
                      {e.active ? "Activo" : "Inactivo"}
                    </span>
                  </td>
                  <td className="px-5 py-3 text-right">
                    <Link href={`/admin/empleados/${e.id}`} className="font-semibold text-admin-primary hover:underline">
                      Editar
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </AdminShell>
  );
}
