"use client";

import { useState } from "react";
import type { Profile } from "@/lib/profiles";
import type { Role } from "@/lib/roles";
import { EditEmployeeModal } from "@/components/admin/EditEmployeeModal";

interface Row extends Profile {
  referenceLetterUrl: string | null;
  sicadExamUrl: string | null;
}

export function EmployeesList({ employees, roles, pinConfigured }: { employees: Row[]; roles: Role[]; pinConfigured: boolean }) {
  const [editing, setEditing] = useState<Row | null>(null);

  return (
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
                  <button type="button" onClick={() => setEditing(e)} className="font-semibold text-admin-primary hover:underline">
                    Editar
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {editing && <EditEmployeeModal profile={editing} roles={roles} pinConfigured={pinConfigured} onClose={() => setEditing(null)} />}
    </section>
  );
}
