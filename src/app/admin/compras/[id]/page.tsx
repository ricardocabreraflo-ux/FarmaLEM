import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { requireAdminSession } from "@/lib/admin-auth";
import { getProfileById } from "@/lib/profiles";
import { listSuppliers } from "@/lib/suppliers";
import { getReceipt, getReceiptPhotoUrls } from "@/lib/purchase-receipts";
import { listPurchasesForReceipt } from "@/lib/purchases";
import { AdminShell } from "@/components/admin/AdminShell";

export const metadata: Metadata = { title: "Detalle de recepción" };
export const dynamic = "force-dynamic";

function fmtMoney(n: number | null) {
  return n == null ? "—" : new Intl.NumberFormat("es-MX", { style: "currency", currency: "MXN" }).format(n);
}

function fmtDate(v: string | null) {
  if (!v) return "—";
  return new Date(`${v}T12:00:00`).toLocaleDateString("es-MX", { day: "2-digit", month: "short", year: "numeric" });
}

export default async function ReceiptDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const session = await requireAdminSession();
  const { id } = await params;

  const [profile, receipt, suppliers] = await Promise.all([getProfileById(session.uid), getReceipt(id), listSuppliers()]);
  if (!receipt) notFound();

  const [items, photoUrls] = await Promise.all([listPurchasesForReceipt(id), getReceiptPhotoUrls(receipt.photo_paths)]);
  const supplierName = suppliers.find((s) => s.id === receipt.supplier_id)?.name ?? "—";

  const sumaRenglones = items.reduce((sum, i) => sum + i.quantity * i.cost, 0);
  const totalPiezas = items.reduce((sum, i) => sum + i.quantity, 0);
  const diff = receipt.ticket_total != null ? sumaRenglones - receipt.ticket_total : null;

  return (
    <AdminShell activeHref="/admin/compras" userName={profile?.full_name ?? "Sin nombre"} userRole={session.role}>
      <Link href="/admin/compras" className="text-[0.85rem] font-semibold text-admin-primary hover:underline">
        &larr; Volver a Recepción de mercancía
      </Link>

      <div className="mt-2 flex flex-wrap items-center justify-between gap-4">
        <h1 className="font-display text-2xl text-admin-ink">
          {supplierName} &middot; Ticket {receipt.ticket_number || "s/n"}
        </h1>
        <div className="flex gap-2">
          <Link href={`/admin/compras/${id}/export/farmalem`} className="rounded-full border border-admin-border px-5 py-2.5 text-[0.85rem] font-semibold text-admin-ink">
            Excel FarmaLEM
          </Link>
          <Link href={`/admin/compras/${id}/export/sicarx`} className="rounded-full border border-admin-border px-5 py-2.5 text-[0.85rem] font-semibold text-admin-ink">
            Excel SICAR X
          </Link>
        </div>
      </div>
      <p className="mt-1.5 text-[0.86rem] text-admin-ink-soft">{fmtDate(receipt.ticket_date)}</p>

      <section className="mt-5 grid grid-cols-1 gap-3 sm:grid-cols-4">
        <div className="rounded-2xl border border-admin-border bg-admin-surface p-4">
          <span className="text-[0.78rem] text-admin-ink-soft">Importe del ticket</span>
          <p className="mt-1 font-display text-lg text-admin-ink">{fmtMoney(receipt.ticket_total)}</p>
        </div>
        <div className="rounded-2xl border border-admin-border bg-admin-surface p-4">
          <span className="text-[0.78rem] text-admin-ink-soft">Suma de renglones</span>
          <p className="mt-1 font-display text-lg text-admin-ink">{fmtMoney(sumaRenglones)}</p>
        </div>
        <div className="rounded-2xl border border-admin-border bg-admin-surface p-4">
          <span className="text-[0.78rem] text-admin-ink-soft">Diferencia</span>
          <p className={`mt-1 font-display text-lg ${diff == null ? "text-admin-ink" : Math.abs(diff) <= 1 ? "text-admin-ok-text" : "text-admin-bad-text"}`}>
            {diff == null ? "—" : fmtMoney(diff)}
          </p>
        </div>
        <div className="rounded-2xl border border-admin-border bg-admin-surface p-4">
          <span className="text-[0.78rem] text-admin-ink-soft">Piezas recibidas</span>
          <p className="mt-1 font-display text-lg text-admin-ink">{totalPiezas}</p>
        </div>
      </section>

      {receipt.notes && <p className="mt-4 rounded-lg bg-admin-primary-soft px-4 py-3 text-[0.85rem] text-admin-primary-deep">{receipt.notes}</p>}

      {photoUrls.length > 0 && (
        <section className="mt-5">
          <h2 className="font-display text-base text-admin-ink">Fotos del ticket</h2>
          <div className="mt-2 flex flex-wrap gap-3">
            {photoUrls.map((url, i) => (
              <a key={i} href={url} target="_blank" rel="noreferrer" className="h-28 w-28 overflow-hidden rounded-lg border border-admin-border">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={url} alt={`Foto ${i + 1}`} className="h-full w-full object-cover" />
              </a>
            ))}
          </div>
        </section>
      )}

      <section className="mt-6 overflow-hidden rounded-2xl border border-admin-border bg-admin-surface">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-[0.86rem]">
            <thead>
              <tr className="border-b border-admin-border text-admin-ink-soft">
                <th className="px-4 py-3 font-medium">Clave prov.</th>
                <th className="px-4 py-3 font-medium">Código de barras</th>
                <th className="px-4 py-3 font-medium">Descripción</th>
                <th className="px-4 py-3 text-right font-medium">Piezas</th>
                <th className="px-4 py-3 text-right font-medium">Costo</th>
                <th className="px-4 py-3 text-right font-medium">Total</th>
                <th className="px-4 py-3 text-right font-medium">Precio</th>
                <th className="px-4 py-3 font-medium">Lote</th>
                <th className="px-4 py-3 font-medium">Caducidad</th>
              </tr>
            </thead>
            <tbody>
              {items.length === 0 && (
                <tr>
                  <td colSpan={9} className="px-4 py-8 text-center text-admin-ink-soft">
                    Sin renglones
                  </td>
                </tr>
              )}
              {items.map((i) => (
                <tr key={i.id} className="border-b border-admin-border last:border-0">
                  <td className="px-4 py-3 text-admin-ink-soft">{i.supplier_code ?? "—"}</td>
                  <td className="px-4 py-3 text-admin-ink-soft">{i.barcode}</td>
                  <td className="px-4 py-3 font-semibold text-admin-ink">{i.description}</td>
                  <td className="px-4 py-3 text-right font-data tabular-nums text-admin-ink">{i.quantity}</td>
                  <td className="px-4 py-3 text-right font-data tabular-nums text-admin-ink-soft">{fmtMoney(i.cost)}</td>
                  <td className="px-4 py-3 text-right font-data tabular-nums text-admin-ink">{fmtMoney(i.quantity * i.cost)}</td>
                  <td className="px-4 py-3 text-right font-data tabular-nums text-admin-ink-soft">{fmtMoney(i.price)}</td>
                  <td className="px-4 py-3 text-admin-ink-soft">{i.lot ?? "—"}</td>
                  <td className="px-4 py-3 text-admin-ink-soft">{fmtDate(i.expires_on)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </AdminShell>
  );
}
