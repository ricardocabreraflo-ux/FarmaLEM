import { NextResponse } from "next/server";
import { requireAdminSession } from "@/lib/admin-auth";
import { listPurchases } from "@/lib/purchases";

function csvQuote(value: string | number | null | undefined): string {
  return `"${String(value ?? "").replaceAll('"', '""')}"`;
}

export async function GET() {
  await requireAdminSession();
  const purchases = await listPurchases();

  const headers = ["CLAVE CORTA", "CODIGO DE BARRAS", "DESCRIPCION PRODUCTO", "PIEZAS", "COSTO", "TOTAL", "PRECIO", "FACTURA"];
  const rows = purchases.map((p) => [
    p.short_code,
    p.barcode,
    p.description,
    p.quantity,
    p.cost,
    (p.quantity * p.cost).toFixed(2),
    p.price,
    p.invoice,
  ]);

  const csv = "﻿" + [headers, ...rows].map((row) => row.map(csvQuote).join(",")).join("\r\n");
  const filename = `compras-farmalem-${new Date().toISOString().slice(0, 10)}.csv`;

  return new NextResponse(csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="${filename}"`,
    },
  });
}
