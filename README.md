# FarmaLEM · Mercancías

Panel web para el módulo de **Mercancías** de FarmaLEM. Primera pantalla: **Recepción de mercancía**.

## Qué hace

1. Se suben las fotos del ticket del proveedor (por ejemplo Farmamigo).
2. Una Edge Function de Supabase (`parse-ticket`) lee las fotos con Claude y regresa los renglones:
   clave del proveedor, descripción, cantidad, precio, lote y caducidad.
3. Cada renglón se cruza con el **catálogo de equivalencias** del proveedor
   (`supplier_products`: clave del proveedor → código de barras, descripción FarmaLEM, precio de venta y factor de empaque).
   - Verde: se llenó solo.
   - Amarillo: producto nuevo; se captura código de barras, descripción y precio **una sola vez**.
4. Se valida la suma de renglones contra el importe del ticket y las unidades contra las piezas impresas.
5. Al confirmar, se guarda la recepción con sus renglones, se suben las fotos al bucket `tickets`,
   se actualiza stock y último costo de cada producto, y se aprenden las equivalencias nuevas.
6. Desde el detalle se exporta:
   - **Excel FarmaLEM**: mismo formato que la hoja actual (clave corta, código de barras, descripción, piezas, costo, total, precio, turnos) más lote y caducidad.
   - **Excel SICAR X**: formato de *inventario inicial* (clave, código de barras, descripción, costo, precio, existencia). Las columnas se ajustarán a la plantilla oficial de SICAR X.

## Estructura

```
supabase/migrations/   esquema (proveedores, productos, equivalencias, recepciones, renglones) + semilla Farmamigo
supabase/functions/parse-ticket/   lectura de fotos del ticket (Deno + @anthropic-ai/sdk)
src/                   app React + Vite (login, lista, nueva recepción, detalle/exportación)
scripts/test-excel.ts  genera los dos Excel con datos de ejemplo
```

## Puesta en marcha

1. Crear un proyecto en Supabase y aplicar las migraciones (`supabase db push` o pegarlas en el SQL Editor, en orden).
2. Desplegar la función y su secreto:
   ```bash
   supabase functions deploy parse-ticket
   supabase secrets set ANTHROPIC_API_KEY=sk-ant-...
   ```
3. Crear los usuarios del equipo en Authentication → Users (correo y contraseña).
4. Copiar `.env.example` a `.env` con la URL y la *anon key* del proyecto.
5. `npm install` y `npm run dev` para desarrollo, o conectar el repo a Netlify (ya trae `netlify.toml`).

## Modelo de datos

| Tabla | Para qué |
|---|---|
| `suppliers` | Proveedores (Farmamigo, etc.) |
| `products` | Catálogo FarmaLEM: código de barras, descripción, precio de venta, último costo, stock |
| `supplier_products` | Equivalencia clave-proveedor → producto, con factor de empaque (caja de 100 jeringas = 100) |
| `receipts` | Un ticket recibido: número, fecha, importe, piezas, fotos, estado |
| `receipt_items` | Renglones del ticket con lote, caducidad, piezas y costo por pieza calculados |
| `profiles` | Rol por usuario (admin / capturista) |

`confirm_receipt(uuid)` suma piezas al stock, actualiza costo y precio, y guarda las equivalencias nuevas.
