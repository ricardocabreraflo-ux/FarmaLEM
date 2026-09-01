// Prueba rápida: genera los dos Excel con datos de ejemplo (npx tsx scripts/test-excel.ts salida/)
import * as XLSX from "xlsx";
import { buildFarmaLEMWorkbook, buildSicarXWorkbook } from "../src/lib/excel";
import type { Receipt, ReceiptItem } from "../src/lib/types";

const receipt: Receipt = {
  id: "r1", supplier_id: "s1", ticket_number: "30130", ticket_date: "2026-08-25", ticket_total: 5558.72, ticket_pieces: 253,
  ticket_savings: 31.95, status: "confirmada", photo_paths: [], notes: null, created_at: "", supplier: { id: "s1", name: "FARMAMIGO", legal_name: null, rfc: null },
};
const mk = (n: number, code: string, barcode: string, name: string, qty: number, price: number, factor: number, sale: number, lot: string, exp: string): ReceiptItem => ({
  id: `i${n}`, receipt_id: "r1", line_no: n, supplier_code: code, ticket_description: name, quantity: qty, unit_price: price,
  line_total: Math.round(qty * price * 100) / 100, lot, expires_on: exp, product_id: `p${n}`, pack_factor: factor, pieces: qty * factor,
  unit_cost: Math.round((price / factor) * 10000) / 10000, sale_price: sale,
  product: { id: `p${n}`, barcode, short_code: null, name, sale_price: sale, last_cost: price / factor, stock: 0 },
});
const items = [
  mk(1, "401586", "780083140595", "HIDROXIDO DE ALUMINIO Y MAGNESIO SOL. PLUSGEL", 5, 63.79, 1, 75, "26140517", "2028-03-07"),
  mk(2, "407090", "7506022327338", "JERINGA 0.5 ML. SENSIMEDICAL", 1, 244.75, 100, 5, "2512952803", "2030-12-16"),
  mk(3, "402644", "7501573902584", "OMEPRAZOL 20 MG C/ 14 CAPS SAROX", 20, 9.59, 1, 25, "SD2616", "2028-04-30"),
];
const out = process.argv[2] ?? ".";
const a = buildFarmaLEMWorkbook(receipt, items); XLSX.writeFile(a.wb, `${out}/${a.filename}`);
const b = buildSicarXWorkbook(receipt, items); XLSX.writeFile(b.wb, `${out}/${b.filename}`);
console.log("OK", a.filename, b.filename);
