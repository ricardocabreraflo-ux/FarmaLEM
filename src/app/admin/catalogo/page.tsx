import type { Metadata } from "next";
import { requireAdminSession } from "@/lib/admin-auth";
import { getProfileById } from "@/lib/profiles";
import { listProductCatalog, getCatalogInfo } from "@/lib/product-catalog";
import { listLatestCostByBarcode } from "@/lib/purchases";
import { AdminShell } from "@/components/admin/AdminShell";
import { CatalogUploadForm } from "@/components/admin/CatalogUploadForm";
import { ProductCatalogTable, type CatalogRow } from "@/components/admin/ProductCatalogTable";

export const metadata: Metadata = { title: "Catálogo de productos" };
export const dynamic = "force-dynamic";

function fmtDateTime(v: string | null) {
  if (!v) return null;
  return new Date(v).toLocaleString("es-MX", { day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" });
}

export default async function CatalogoPage() {
  const session = await requireAdminSession();

  const [profile, entries, info, costByBarcode] = await Promise.all([
    getProfileById(session.uid),
    listProductCatalog(),
    getCatalogInfo(),
    listLatestCostByBarcode(),
  ]);

  const rows: CatalogRow[] = entries.map((e) => ({
    barcode: e.barcode,
    description: e.description,
    department: e.department,
    category: e.category,
    unit: e.unit,
    salePrice: e.sale_price,
    salePriceNet: e.sale_price_net,
    cost: costByBarcode.get(e.barcode) ?? null,
  }));

  return (
    <AdminShell activeHref="/admin/catalogo" userName={profile?.full_name ?? "Sin nombre"} userRole={session.role}>
      <h1 className="font-display text-2xl text-admin-ink">Catálogo de productos</h1>
      <p className="mt-1.5 text-[0.86rem] text-admin-ink-soft">
        Referencia de precios de venta exportada de SICAR X, para consultar y comparar contra el costo cuando ya se conozca (por lo que se ha
        recibido en Recepción de mercancía). No representa existencias — solo es para armar el catálogo.
      </p>

      <section className="mt-5 rounded-2xl border border-admin-border bg-admin-surface p-5">
        <CatalogUploadForm />
        <p className="mt-3 text-[0.78rem] text-admin-ink-soft">
          {info.count > 0 ? (
            <>
              {info.count} productos cargados{fmtDateTime(info.updatedAt) ? ` · última actualización ${fmtDateTime(info.updatedAt)}` : ""}. Subir un
              archivo nuevo reemplaza todo el catálogo.
            </>
          ) : (
            "Todavía no hay catálogo cargado."
          )}
        </p>
      </section>

      <ProductCatalogTable rows={rows} />
    </AdminShell>
  );
}
