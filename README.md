# FarmaLEM

Sitio y tienda en línea de FarmaLEM: catálogo con promociones, carrito,
pago con Mercado Pago y panel privado de pedidos para recoger en sucursal.

**Stack:** Next.js (App Router) + React + TypeScript + Tailwind CSS v4 +
Supabase (pedidos) + Mercado Pago (Checkout Pro).

## Empezar

```bash
npm install
cp .env.example .env.local   # y llena los valores (ver abajo)
npm run dev
```

Abre [http://localhost:3000](http://localhost:3000).

```bash
npm run build   # build de producción
npm run lint    # ESLint
```

Sin `.env.local` configurado, el sitio se ve y navega normal — el
carrito funciona igual (es 100% del navegador), pero el checkout muestra
un mensaje de error claro en vez de cobrar, y `/admin` no deja entrar.
Nada truena de forma silenciosa.

## Variables de entorno

Copia `.env.example` a `.env.local` y llena:

| Variable | De dónde sale |
|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | Ya está en `.env.example` (proyecto compartido, schema `farmalem` aislado) |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase → tu proyecto → Settings → API → `service_role` (secreta) |
| `MERCADOPAGO_ACCESS_TOKEN` | Mercado Pago → Tus integraciones → tu app → Credenciales de producción |
| `MERCADOPAGO_WEBHOOK_SECRET` | Mercado Pago → Tus integraciones → tu app → Webhooks → Firma secreta |
| `ADMIN_PASSWORD` | La eliges tú — es la contraseña para entrar a `/admin` |
| `ADMIN_SESSION_SECRET` | Cadena aleatoria: `openssl rand -hex 32` |
| `NEXT_PUBLIC_SITE_URL` | Tu dominio real una vez desplegado (ej. `https://farmalem.mx`). Vacío en local. |

**En Mercado Pago**, registra el webhook apuntando a:
`https://TU-DOMINIO/api/webhooks/mercadopago` (tiene que ser una URL
pública — no funciona con `localhost` mientras desarrollas local; para
probar pagos de principio a fin necesitas tenerlo ya desplegado, o usar
un túnel como `ngrok`).

## Cómo funciona la tienda

1. El cliente arma su carrito (vive en `localStorage`, componente
   `CartProvider` en `src/lib/cart-context.tsx`).
2. En `/checkout` deja nombre y teléfono → se crea el pedido en Supabase
   (`farmalem.orders` / `farmalem.order_items`, estado `pendiente_pago`) y
   se genera una preferencia de Mercado Pago (Checkout Pro) — el cliente
   paga en Mercado Pago, no en este sitio.
3. Mercado Pago llama a `/api/webhooks/mercadopago` cuando el pago se
   confirma; el pedido pasa a `pagado`.
4. Tú ves y gestionas los pedidos en `/admin` (marcar "listo para
   recoger" / "entregado"), protegido con `ADMIN_PASSWORD`.
5. El cliente pasa a la sucursal a recoger — no hay envío ni control de
   existencia en vivo (se decidió así porque el punto de venta actual,
   Sicar X, no tiene una API pública a la que conectarse sin credenciales
   oficiales de ellos). Confirma la disponibilidad real al ver el pedido.

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
- Un producto con `precio: 0` se muestra como "Próximamente" y no se puede agregar al carrito (así están los 3 de ejemplo de liquidación).

### Fotos reales de producto

Mientras no exista la foto en `public/products/`, cada tarjeta muestra una
ilustración de reemplazo (blíster, frasco, jeringa, cubrebocas o caja de
liquidación, según el producto) — no es una foto real. En cuanto coloques
las fotos reales en `public/products/`, `ProductCard`/`ProductArt`
(`src/components/`) se puede cambiar para usar `<Image src={producto.imagen}>`
en lugar de la ilustración.

### Liquidación por caducidad

Los tres productos de ese estante en `productos.json` (`liquidacion-ejemplo-*`)
son placeholders con `precio: 0` — reemplázalos por tus productos reales
próximos a caducar, su precio real y su % de descuento real.

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
- Llenar `.env.local` con las credenciales reales (ver tabla arriba) — sin
  esto el carrito funciona pero el pago y el panel de pedidos no.
- Registrar el webhook en Mercado Pago una vez que el sitio tenga dominio
  público.
- Aviso por WhatsApp Business automático por cada pedido pagado (fase 2 —
  requiere configurar la app de WhatsApp Business Cloud API de Meta, con
  número verificado y plantilla de mensaje aprobada; por ahora los pedidos
  se ven en `/admin`).
