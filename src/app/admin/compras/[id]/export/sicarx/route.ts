import { NextResponse } from "next/server";
import { requireSession } from "@/lib/admin-auth";
import { getProfileById } from "@/lib/profiles";
import { getReceipt, listReceiptLines } from "@/lib/purchase-receipts";
import { listSuppliers } from "@/lib/suppliers";
import { canAccessModule } from "@/lib/panel-modules";
import { buildSicarXWorkbook } from "@/lib/excel-receipt";

export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await requireSession();
  const { id } = await params;

  const isAdmin = session.role === "admin";
  const profile = await getProfileById(session.uid);
  const showCost = await canAccessModule("/admin/compras", isAdmin, profile?.role_id ?? null);

  const [receipt, lines, suppliers] = await Promise.all([getReceipt(id), listReceiptLines(id), listSuppliers()]);
  if (!receipt) return NextResponse.json({ error: "Recepción no encontrada" }, { status: 404 });

  const supplierName = suppliers.find((s) => s.id === receipt.supplier_id)?.name ?? "proveedor";
  const { buffer, filename } = buildSicarXWorkbook(receipt, lines, supplierName, showCost);

  return new NextResponse(new Uint8Array(buffer), {
    headers: {
      "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "Content-Disposition": `attachment; filename="${filename}"`,
    },
  });
}
