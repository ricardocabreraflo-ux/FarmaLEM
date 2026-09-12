"use client";

import { useState } from "react";
import type { Supplier } from "@/lib/suppliers";
import { EditSupplierModal } from "@/components/admin/EditSupplierModal";

export function SuppliersList({ suppliers }: { suppliers: Supplier[] }) {
  const [editing, setEditing] = useState<Supplier | null>(null);

  return (
    <section className="mt-6 overflow-hidden rounded-2xl border border-admin-border bg-admin-surface">
      <table className="w-full text-left text-[0.86rem]">
        <thead>
          <tr className="border-b border-admin-border text-admin-ink-soft">
            <th className="px-5 py-3 font-medium">Proveedor</th>
            <th className="px-5 py-3 font-medium">Contacto</th>
            <th className="px-5 py-3 font-medium">Estado</th>
            <th className="px-5 py-3"></th>
          </tr>
        </thead>
        <tbody>
          {suppliers.length === 0 && (
            <tr>
              <td colSpan={4} className="px-5 py-8 text-center text-admin-ink-soft">
                Sin proveedores capturados.
              </td>
            </tr>
          )}
          {suppliers.map((s) => (
            <tr key={s.id} className="border-b border-admin-border last:border-0">
              <td className="px-5 py-3 font-semibold text-admin-ink">{s.name}</td>
              <td className="px-5 py-3 text-admin-ink-soft">{s.contact || "—"}</td>
              <td className="px-5 py-3">
                <span
                  className={`rounded-full px-2.5 py-1 text-[0.76rem] font-semibold ${
                    s.active ? "bg-admin-ok-bg text-admin-ok-text" : "bg-admin-bad-bg text-admin-bad-text"
                  }`}
                >
                  {s.active ? "Activo" : "Inactivo"}
                </span>
              </td>
              <td className="px-5 py-3 text-right">
                <button type="button" onClick={() => setEditing(s)} className="font-semibold text-admin-primary hover:underline">
                  Editar
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      {editing && <EditSupplierModal supplier={editing} onClose={() => setEditing(null)} />}
    </section>
  );
}
