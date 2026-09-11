import { NextResponse } from "next/server";
import { requireAdminSession } from "@/lib/admin-auth";
import { getReceipt, listReceiptLines } from "@/lib/purchase-receipts";
import { listSuppliers } from "@/lib/suppliers";
import { buildFarmaLEMWorkbook } from "@/lib/excel-receipt";

export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  await requireAdminSession();
  const { id } = await params;

  const [receipt, lines, suppliers] = await Promise.all([getReceipt(id), listReceiptLines(id), listSuppliers()]);
  if (!receipt) return NextResponse.json({ error: "Recepción no encontrada" }, { status: 404 });

  const supplierName = suppliers.find((s) => s.id === receipt.supplier_id)?.name ?? "proveedor";
  const { buffer, filename } = buildFarmaLEMWorkbook(receipt, lines, supplierName);

  return new NextResponse(new Uint8Array(buffer), {
    headers: {
      "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "Content-Disposition": `attachment; filename="${filename}"`,
    },
  });
}
