# FarmaLEM

Sitio web de FarmaLEM — catálogo y promociones, no tienda en línea (los
pedidos reales se resuelven en la tienda ya existente en
[farmalem.sicarx.shop](https://farmalem.sicarx.shop)).

**Stack:** Next.js (App Router) + React + TypeScript + Tailwind CSS v4.

## Empezar

```bash
npm install
npm run dev
```

Abre [http://localhost:3000](http://localhost:3000).

```bash
npm run build   # build de producción
npm run lint    # ESLint
```

## Cómo actualizar el catálogo

Todo el catálogo vive en **`src/data/productos.json`**. Para agregar,
quitar o editar un producto, edita ese archivo — las góndolas de
promociones (`ProductGrid`) se generan solas a partir de él, agrupadas por
`promocion.grupo`. No hace falta tocar ningún componente.

Esquema de cada producto:

```jsonc
{
  "id": "paracetamol-500",
  "nombre": "Paracetamol 500 mg",
  "sustanciaActiva": "Paracetamol",
  "marca": "Quitadol / Acetif / Avivia",
  "precio": 12.0,
  "promocion": { "tipo": "3x2", "grupo": "Analgésicos y Antiinflamatorios" },
  "categoria": "Analgésicos y Antiinflamatorios",
  "descripcionUso": "Alivia el dolor y baja la fiebre.",
  "imagen": "/products/paracetamol-500.jpg"
}
```

- `promocion.tipo`: `"3x2"`, `"5x4"` o `"liquidacion"` (con `descuento` en %).
- `descripcionUso`: una sola línea, tipo empaque — nada de dosis clínicas.

### Fotos reales de producto

Mientras no exista la foto en `public/products/`, cada tarjeta muestra una
ilustración de reemplazo (blíster, frasco, jeringa, cubrebocas o caja de
liquidación, según el producto) — no es una foto real. En cuanto coloques
las fotos reales en `public/products/`, `ProductCard`/`ProductArt`
(`src/components/`) se puede cambiar para usar `<Image src={producto.imagen}>`
en lugar de la ilustración.

### Liquidación por caducidad

Los tres productos de ese estante en `productos.json` (`liquidacion-ejemplo-*`)
son placeholders — reemplázalos por tus productos reales próximos a caducar
y su % de descuento real.

## Datos de contacto y marca

Teléfono, WhatsApp, redes sociales, dirección y horario están centralizados
en **`src/lib/site.ts`** — un solo cambio ahí se refleja en todo el sitio
(header, footer, ubicación, botón flotante).

## Colores y tipografía

Los tokens de marca (azul/turquesa reales, extraídos del logo) viven en
**`src/app/globals.css`** como variables CSS (`--brand-*`), expuestas a
Tailwind vía `@theme inline`. El logo real está en `public/logo.png`.

## Pendientes

- Fotos reales de producto en `public/products/`.
- Productos reales para el estante de liquidación por caducidad.
- Confirmar el horario de la sucursal (por ahora: Lun–Sáb 8:00–21:00, Dom 9:00–15:00).
