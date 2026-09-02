import "server-only";
import * as XLSX from "xlsx";
import type { PurchaseReceipt } from "@/lib/purchase-receipts";
import type { Purchase } from "@/lib/purchases";

interface Row {
  supplierCode: string | null;
  barcode: string;
  name: string;
  pieces: number;
  unitCost: number;
  salePrice: number | null;
  lot: string | null;
  expiresOn: string | null;
}

function toRows(items: Purchase[]): Row[] {
  return items.map((i) => ({
    supplierCode: i.supplier_code,
    barcode: i.barcode,
    name: i.description,
    pieces: Number(i.quantity),
    unitCost: Number(i.cost),
    salePrice: i.price != null ? Number(i.price) : null,
    lot: i.lot,
    expiresOn: i.expires_on,
  }));
}

function fmtDate(iso: string | null): string {
  if (!iso) return "";
  const [y, m, d] = iso.split("-");
  return `${d}/${m}/${y}`;
}

function sheetName(receipt: PurchaseReceipt): string {
  const [y, m, d] = receipt.ticket_date.split("-");
  return `${d}${m}${y.slice(2)}`;
}

/**
 * Excel con el mismo formato que ya usa FarmaLEM (CLAVE CORTA, CÓDIGO DE
 * BARRAS, DESCRIPCIÓN, PIEZAS, COSTO, TOTAL, PRECIO, turnos) más LOTE y
 * CADUCIDAD.
 */
export function buildFarmaLEMWorkbook(receipt: PurchaseReceipt, items: Purchase[], supplierName: string) {
  const rows = toRows(items);
  const ws: XLSX.WorkSheet = {};
  const set = (ref: string, v: string | number | null, f?: string) => {
    if (f) ws[ref] = { t: "n", f };
    else if (typeof v === "number") ws[ref] = { t: "n", v };
    else if (v != null && v !== "") ws[ref] = { t: "s", v };
  };

  set("E1", "TOTAL VENDIDO");
  set("F1", 0);
  set("H1", "TURNO MATUTINO FECHAS");
  set("N1", "TURNO VESPERTINO FECHAS");
  set("T1", "TURNO SABATINO FECHAS");
  set("A2", `RECEPCION DE MERCANCIA FARMALEM · ${supplierName} · TICKET ${receipt.ticket_number ?? ""} · ${fmtDate(receipt.ticket_date)}`);
  set("H2", 0);
  set("N2", 0);
  set("T2", 0);
  const headers: Record<string, string> = {
    A3: "CLAVE CORTA",
    B3: "CODIGO DE BARRAS",
    C3: "DESCRPCION PRODUCTO",
    D3: "PIEZAS",
    E3: "COSTO",
    F3: "TOTAL",
    G3: "PRECIO",
    Y3: "TOTAL PIEZAS VENDIDAS",
    AB3: "PIEZAS DISPONIBLES PARA VENTA",
    AC3: "LOTE",
    AD3: "CADUCIDAD",
  };
  for (const [ref, v] of Object.entries(headers)) set(ref, v);

  const first = 4;
  rows.forEach((r, idx) => {
    const n = first + idx;
    set(`A${n}`, r.supplierCode ?? "");
    set(`B${n}`, r.barcode);
    set(`C${n}`, r.name);
    set(`D${n}`, r.pieces);
    set(`E${n}`, r.unitCost);
    set(`F${n}`, null, `D${n}*E${n}`);
    set(`G${n}`, r.salePrice);
    set(`M${n}`, null, `SUM(H${n}:L${n})`);
    set(`S${n}`, null, `SUM(N${n}:R${n})`);
    set(`X${n}`, null, `SUM(T${n}:W${n})`);
    set(`Y${n}`, 0);
    set(`AB${n}`, null, `D${n}-Y${n}`);
    set(`AC${n}`, r.lot ?? "");
    set(`AD${n}`, fmtDate(r.expiresOn));
  });
  const last = first + rows.length - 1;
  const tRow = last + 1;
  set(`E${tRow}`, "SUMA");
  set(`F${tRow}`, null, `SUM(F${first}:F${last})`);
  set(`E${tRow + 1}`, "TICKET");
  set(`F${tRow + 1}`, receipt.ticket_total ?? 0);
  set(`E${tRow + 2}`, "DIFERENCIA");
  set(`F${tRow + 2}`, null, `F${tRow}-F${tRow + 1}`);
  set(`C${tRow}`, "PIEZAS");
  set(`D${tRow}`, null, `SUM(D${first}:D${last})`);

  ws["!ref"] = `A1:AD${tRow + 2}`;
  ws["!merges"] = [
    XLSX.utils.decode_range("F1:G1"),
    XLSX.utils.decode_range("H1:M1"),
    XLSX.utils.decode_range("N1:S1"),
    XLSX.utils.decode_range("T1:X1"),
    XLSX.utils.decode_range("A2:G2"),
    XLSX.utils.decode_range("H2:M2"),
    XLSX.utils.decode_range("N2:S2"),
    XLSX.utils.decode_range("T2:X2"),
  ];
  const cols: XLSX.ColInfo[] = [];
  const widths: Record<string, number> = { A: 10, B: 16, C: 57, D: 7, E: 9, F: 11, G: 10, Y: 10, Z: 4, AA: 4, AB: 12, AC: 13, AD: 12 };
  for (let c = 0; c < 30; c++) {
    const letter = XLSX.utils.encode_col(c);
    cols.push({ wch: widths[letter] ?? 4.5 });
  }
  ws["!cols"] = cols;

  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, sheetName(receipt));
  const buffer = XLSX.write(wb, { type: "buffer", bookType: "xlsx" }) as Buffer;
  return { buffer, filename: `Recepcion_${sheetName(receipt)}_${supplierName}.xlsx` };
}

/** Excel para SICAR X · importación de inventario inicial. */
export function buildSicarXWorkbook(receipt: PurchaseReceipt, items: Purchase[], supplierName: string) {
  const rows = toRows(items);
  const aoa: (string | number)[][] = [["Clave", "Código de Barras", "Descripción", "Costo", "Precio", "Existencia", "Lote", "Caducidad"]];
  for (const r of rows) {
    aoa.push([r.barcode, r.barcode, r.name, r.unitCost, r.salePrice ?? 0, r.pieces, r.lot ?? "", fmtDate(r.expiresOn)]);
  }
  const ws = XLSX.utils.aoa_to_sheet(aoa);
  ws["!cols"] = [{ wch: 16 }, { wch: 16 }, { wch: 55 }, { wch: 10 }, { wch: 10 }, { wch: 11 }, { wch: 13 }, { wch: 12 }];
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, "Inventario inicial");
  const buffer = XLSX.write(wb, { type: "buffer", bookType: "xlsx" }) as Buffer;
  return { buffer, filename: `SICARX_inventario_${sheetName(receipt)}_${supplierName}.xlsx` };
}
