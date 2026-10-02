"use client";

import { useState } from "react";
import { ShortExpiryFlagCheckbox } from "@/components/admin/ShortExpiryFlagCheckbox";
import { ShortExpiryItemModal } from "@/components/admin/ShortExpiryItemModal";
import type { ShortExpiryItem } from "@/lib/short-expiry";

function fmtDate(v: string) {
  return new Date(`${v}T12:00:00`).toLocaleDateString("es-MX", { day: "2-digit", month: "short", year: "numeric" });
}

function expiryClass(expiresOn: string) {
  const today = new Date().toISOString().slice(0, 10);
  const limit = new Date();
  limit.setMonth(limit.getMonth() + 1);
  const soon = limit.toISOString().slice(0, 10);
  if (expiresOn <= today) return "bg-admin-bad-bg text-admin-bad-text";
  if (expiresOn <= soon) return "bg-admin-pending-bg text-admin-pending-text";
  return "text-admin-ink-soft";
}

export function ShortExpiryList({
  items,
  isAdmin,
  monthOpen,
  nameById,
}: {
  items: ShortExpiryItem[];
  isAdmin: boolean;
  monthOpen: boolean;
  nameById: Map<string, string>;
}) {
  const [openId, setOpenId] = useState<string | null>(null);
  const openItem = items.find((i) => i.id === openId) ?? null;

  return (
    <section className="overflow-hidden rounded-2xl border border-admin-border bg-admin-surface">
      <div className="overflow-x-auto">
        <table className="w-full text-left text-[0.86rem]">
          <thead>
            <tr className="border-b border-admin-border text-admin-ink-soft">
              <th className="px-4 py-3 font-medium">Anaquel</th>
              <th className="px-4 py-3 font-medium">Producto</th>
              <th className="px-4 py-3 font-medium">Caduca</th>
              <th className="px-4 py-3 text-right font-medium">Físicas</th>
              <th className="px-4 py-3 text-right font-medium">Vendidas</th>
              <th className="px-4 py-3 text-right font-medium">Restantes</th>
              <th className="px-4 py-3 font-medium">Desc.</th>
              <th className="px-4 py-3 text-center font-medium">Sistema</th>
              <th className="px-4 py-3 text-center font-medium">Baja</th>
              <th className="px-4 py-3 font-medium">Reportó</th>
              <th className="px-4 py-3"></th>
            </tr>
          </thead>
          <tbody>
            {items.length === 0 && (
              <tr>
                <td colSpan={11} className="px-4 py-8 text-center text-admin-ink-soft">
                  Sin productos registrados este mes todavía
                </td>
              </tr>
            )}
            {items.map((item) => (
              <tr key={item.id} className={`border-b border-admin-border last:border-0 ${item.remaining === 0 ? "opacity-60" : ""}`}>
                <td className="px-4 py-3 text-admin-ink-soft">
                  {item.shelf}
                  {item.carried_from_prev_month && <span className="block text-[0.7rem]">arrastrado</span>}
                </td>
                <td className="px-4 py-3 font-semibold text-admin-ink">
                  {item.description}
                  {item.barcode && <span className="block text-[0.72rem] font-normal text-admin-ink-soft">{item.barcode}</span>}
                </td>
                <td className="px-4 py-3">
                  <span className={`rounded-full px-2 py-1 text-[0.78rem] font-semibold ${expiryClass(item.expires_on)}`}>{fmtDate(item.expires_on)}</span>
                </td>
                <td className="px-4 py-3 text-right text-admin-ink">{item.physical_pieces}</td>
                <td className="px-4 py-3 text-right text-admin-ink">{item.sold}</td>
                <td className="px-4 py-3 text-right font-semibold text-admin-ink">{item.remaining}</td>
                <td className="px-4 py-3 text-admin-ink-soft">
                  {item.discount_pct ? `${item.discount_pct}%` : "—"}
                  {item.two_for_one && <span className="ml-1 rounded-full bg-admin-pending-bg px-1.5 py-0.5 text-[0.7rem] text-admin-pending-text">2x1</span>}
                </td>
                <td className="px-4 py-3 text-center">
                  <ShortExpiryFlagCheckbox id={item.id} field="in_system" initialValue={item.in_system} disabled={!monthOpen} />
                </td>
                <td className="px-4 py-3 text-center">
                  {isAdmin ? (
                    <ShortExpiryFlagCheckbox id={item.id} field="removed_from_system" initialValue={item.removed_from_system} disabled={!monthOpen} />
                  ) : item.removed_from_system ? (
                    "Sí"
                  ) : (
                    "—"
                  )}
                </td>
                <td className="px-4 py-3 text-admin-ink-soft">{nameById.get(item.reported_by) ?? "—"}</td>
                <td className="px-4 py-3 text-right">
                  <button type="button" onClick={() => setOpenId(item.id)} className="text-[0.82rem] font-semibold text-admin-primary hover:underline">
                    Gestionar
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {openItem && <ShortExpiryItemModal item={openItem} isAdmin={isAdmin} monthOpen={monthOpen} nameById={nameById} onClose={() => setOpenId(null)} />}
    </section>
  );
}
