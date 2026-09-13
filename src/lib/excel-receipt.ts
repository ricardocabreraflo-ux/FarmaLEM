import "server-only";
import * as XLSX from "xlsx";
import type { PurchaseReceipt, PurchaseReceiptLine } from "@/lib/purchase-receipts";

interface Row {
  supplierCode: string | null;
  barcode: string;
  name: string;
  pieces: number;
  salePrice: number | null;
  lot: string | null;
  expiresOn: string | null;
  unitCost: number;
  totalCost: number;
}

/**
 * Todos los renglones del ticket, resueltos o no — así lo que se exporta
 * siempre trae el ticket completo (para capturar en farmacia de inmediato)
 * aunque algunos renglones todavía no estén ligados a un código de barras.
 * El costo solo se agrega al archivo cuando showCost=true (ver build*), para
 * quien tiene permiso de verlo.
 */
function toRows(lines: PurchaseReceiptLine[]): Row[] {
  return lines.map((l) => {
    const packFactor = l.pack_factor || 1;
    const pieces = Math.round(l.quantity * packFactor * 1000) / 1000;
    const unitCost = Math.round((l.unit_price / packFactor) * 10000) / 10000;
    return {
      supplierCode: l.supplier_code,
      barcode: l.barcode,
      name: l.description.trim() || l.ticket_description || "",
      pieces,
      salePrice: l.sale_price,
      lot: l.lot,
      expiresOn: l.expires_on,
      unitCost,
      totalCost: Math.round(l.quantity * l.unit_price * 100) / 100,
    };
  });
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
 * BARRAS, DESCRIPCIÓN, PIEZAS, PRECIO, turnos) más LOTE y CADUCIDAD — sin
 * costo, para que lo pueda capturar personal sin ver a qué costo compramos.
 */
export function buildFarmaLEMWorkbook(receipt: PurchaseReceipt, lines: PurchaseReceiptLine[], supplierName: string, showCost: boolean) {
  const rows = toRows(lines);
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
  // COSTO y TOTAL van en E/F cuando showCost=true — esas dos columnas están
  // libres en los renglones de datos (solo se usan en la fila 1 para el
  // rótulo "TOTAL VENDIDO"), así que quedan justo junto a PIEZAS/PRECIO,
  // visibles sin tener que desplazarse a la derecha; el resto del personal
  // recibe el archivo sin esas dos columnas.
  const headers: Record<string, string> = {
    A3: "CLAVE CORTA",
    B3: "CODIGO DE BARRAS",
    C3: "DESCRPCION PRODUCTO",
    D3: "PIEZAS",
    G3: "PRECIO",
    Y3: "TOTAL PIEZAS VENDIDAS",
    AB3: "PIEZAS DISPONIBLES PARA VENTA",
    AC3: "LOTE",
    AD3: "CADUCIDAD",
    ...(showCost ? { E3: "COSTO", F3: "TOTAL" } : {}),
  };
  for (const [ref, v] of Object.entries(headers)) set(ref, v);

  const first = 4;
  rows.forEach((r, idx) => {
    const n = first + idx;
    set(`A${n}`, r.supplierCode ?? "");
    set(`B${n}`, r.barcode);
    set(`C${n}`, r.name);
    set(`D${n}`, r.pieces);
    set(`G${n}`, r.salePrice);
    set(`M${n}`, null, `SUM(H${n}:L${n})`);
    set(`S${n}`, null, `SUM(N${n}:R${n})`);
    set(`X${n}`, null, `SUM(T${n}:W${n})`);
    set(`Y${n}`, 0);
    set(`AB${n}`, null, `D${n}-Y${n}`);
    set(`AC${n}`, r.lot ?? "");
    set(`AD${n}`, fmtDate(r.expiresOn));
    if (showCost) {
      set(`E${n}`, r.unitCost);
      set(`F${n}`, r.totalCost);
    }
  });
  const last = first + rows.length - 1;
  const tRow = last + 1;
  set(`C${tRow}`, "PIEZAS");
  set(`D${tRow}`, null, `SUM(D${first}:D${last})`);
  if (showCost) set(`F${tRow}`, null, `SUM(F${first}:F${last})`);

  ws["!ref"] = `A1:AD${tRow}`;
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
  const widths: Record<string, number> = { A: 10, B: 16, C: 57, D: 7, E: 10, F: 10, G: 10, Y: 10, Z: 4, AA: 4, AB: 12, AC: 13, AD: 12 };
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

/**
 * Excel para SICAR X · importación de inventario inicial. Costo y Total
 * solo se agregan cuando showCost=true — quien no debe ver a qué costo
 * compramos recibe el archivo sin esas dos columnas.
 */
export function buildSicarXWorkbook(receipt: PurchaseReceipt, lines: PurchaseReceiptLine[], supplierName: string, showCost: boolean) {
  const rows = toRows(lines);
  const header = ["Clave", "Código de Barras", "Descripción", "Precio", "Existencia", "Lote", "Caducidad"];
  const cols = [{ wch: 16 }, { wch: 16 }, { wch: 55 }, { wch: 10 }, { wch: 11 }, { wch: 13 }, { wch: 12 }];
  if (showCost) {
    header.push("Costo", "Total");
    cols.push({ wch: 10 }, { wch: 10 });
  }
  const aoa: (string | number)[][] = [header];
  for (const r of rows) {
    const row: (string | number)[] = [r.supplierCode || r.barcode, r.barcode, r.name, r.salePrice ?? 0, r.pieces, r.lot ?? "", fmtDate(r.expiresOn)];
    if (showCost) row.push(r.unitCost, r.totalCost);
    aoa.push(row);
  }
  const ws = XLSX.utils.aoa_to_sheet(aoa);
  ws["!cols"] = cols;
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, "Inventario inicial");
  const buffer = XLSX.write(wb, { type: "buffer", bookType: "xlsx" }) as Buffer;
  return { buffer, filename: `SICARX_inventario_${sheetName(receipt)}_${supplierName}.xlsx` };
}
