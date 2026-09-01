export type Supplier = {
  id: string;
  name: string;
  legal_name: string | null;
  rfc: string | null;
};

export type Product = {
  id: string;
  barcode: string;
  short_code: string | null;
  name: string;
  sale_price: number;
  last_cost: number;
  stock: number;
};

export type SupplierProduct = {
  id: string;
  supplier_id: string;
  supplier_code: string;
  supplier_description: string | null;
  product_id: string;
  pack_factor: number;
  last_unit_price: number | null;
  product: Product | null;
};

export type Confianza = "alta" | "media" | "baja";

export type ParsedLine = {
  clave: string | null;
  descripcion: string;
  cantidad: number;
  precio_unitario: number;
  total: number;
  lote: string | null;
  caducidad: string | null;
  confianza: Confianza;
};

export type ParsedTicket = {
  proveedor: string | null;
  rfc: string | null;
  sucursal: string | null;
  ticket_numero: string | null;
  fecha: string | null;
  importe: number | null;
  ahorro: number | null;
  piezas: number | null;
  lineas: ParsedLine[];
  observaciones: string | null;
};

/** Estado de un renglón en la pantalla de recepción. */
export type MatchState = "catalogo" | "producto" | "nuevo";

export type DraftLine = {
  key: string;
  supplier_code: string;
  ticket_description: string;
  quantity: number;
  unit_price: number;
  lot: string;
  expires_on: string; // YYYY-MM-DD o ""
  confianza: Confianza;
  product_id: string | null;
  barcode: string;
  product_name: string;
  sale_price: number | null;
  pack_factor: number;
  match: MatchState;
};

export type Receipt = {
  id: string;
  supplier_id: string;
  ticket_number: string | null;
  ticket_date: string;
  ticket_total: number | null;
  ticket_pieces: number | null;
  ticket_savings: number | null;
  status: "borrador" | "confirmada" | "cancelada";
  photo_paths: string[];
  notes: string | null;
  created_at: string;
  supplier?: Supplier | null;
};

export type ReceiptItem = {
  id: string;
  receipt_id: string;
  line_no: number;
  supplier_code: string | null;
  ticket_description: string | null;
  quantity: number;
  unit_price: number;
  line_total: number;
  lot: string | null;
  expires_on: string | null;
  product_id: string | null;
  pack_factor: number;
  pieces: number;
  unit_cost: number;
  sale_price: number | null;
  product: Product | null;
};

export const money = (n: number | null | undefined) =>
  n == null ? "" : n.toLocaleString("es-MX", { style: "currency", currency: "MXN" });

export const round2 = (n: number) => Math.round(n * 100) / 100;
