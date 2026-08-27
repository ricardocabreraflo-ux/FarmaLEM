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
| `NEXT_PUBLIC_SUPABASE_URL` | Ya está en `.env.example` (proyecto compartido "lemus-store", schema `farmalem` aislado) |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase → tu proyecto → Settings → API → `service_role` (secreta) |
| `MERCADOPAGO_ACCESS_TOKEN` | Mercado Pago → Tus integraciones → tu app → Credenciales de producción |
| `MERCADOPAGO_WEBHOOK_SECRET` | Mercado Pago → Tus integraciones → tu app → Webhooks → Firma secreta |
| `WHATSAPP_ACCESS_TOKEN` | Meta for Developers → tu app → WhatsApp → API Setup |
| `WHATSAPP_PHONE_NUMBER_ID` | Misma pantalla, junto al número de prueba/producción |
| `WHATSAPP_NOTIFY_NUMBER` | Tu número (a donde llega el aviso), formato `521XXXXXXXXXX` sin "+" |
| `WHATSAPP_TEMPLATE_NAME` | Nombre de tu plantilla aprobada (ver abajo). Vacío = `nuevo_pedido_farmalem` |
| `WHATSAPP_CUT_TEMPLATE_NAME` | Plantilla del aviso de corte capturado (ver abajo). Vacío = `corte_capturado_farmalem` |
| `ADMIN_PASSWORD` | La eliges tú — es la contraseña para entrar a `/admin` |
| `ADMIN_SESSION_SECRET` | Cadena aleatoria: `openssl rand -hex 32` |
| `NEXT_PUBLIC_SITE_URL` | Tu dominio real una vez desplegado (ej. `https://farmalem.mx`). Vacío en local. |

**En Mercado Pago**, registra el webhook apuntando a:
`https://TU-DOMINIO/api/webhooks/mercadopago` (tiene que ser una URL
pública — no funciona con `localhost` mientras desarrollas local; para
probar pagos de principio a fin necesitas tenerlo ya desplegado, o usar
un túnel como `ngrok`).

### Configurar el aviso por WhatsApp (paso a paso en Meta)

Con tu acceso a Facebook Business / WhatsApp Business:

1. Entra a [developers.facebook.com](https://developers.facebook.com/) →
   **Mis apps** → crea una app tipo "Negocio" (o usa una que ya tengas) →
   agrégale el producto **WhatsApp**.
2. En **WhatsApp → Configuración de la API** verás un número de prueba (o
   tu número real si ya lo migraste). Copia:
   - **Token de acceso temporal** (dura 24h — sirve para probar) o mejor,
     genera uno **permanente**: Configuración del negocio → Usuarios del
     sistema → crea uno → Generar token → marca el permiso
     `whatsapp_business_messaging` → ese va en `WHATSAPP_ACCESS_TOKEN`.
   - **Phone number ID** → `WHATSAPP_PHONE_NUMBER_ID`.
3. En **WhatsApp Manager → Plantillas de mensaje**, crea una nueva:
   - Nombre: `nuevo_pedido_farmalem`
   - Categoría: **Utilidad** (utility — aprueba más rápido que Marketing)
   - Idioma: Español (MX)
   - Cuerpo del mensaje, con 4 variables en este orden exacto:
     ```
     Nuevo pedido pagado en FarmaLEM

     Cliente: {{1}}
     Teléfono: {{2}}
     Total: ${{3}} MXN
     Folio: #{{4}}

     Revísalo en tu panel de pedidos.
     ```
   - Envíala a revisión — Meta suele aprobarla en minutos a un día.
4. Llena `WHATSAPP_NOTIFY_NUMBER` con tu número (el que debe recibir el
   aviso, no el del cliente).

Mientras la plantilla no esté aprobada o falten estas variables, los
pedidos se marcan como pagados normalmente — el aviso simplemente no se
manda (queda un registro en los logs del servidor), nunca bloquea el pago.

### Aviso de "corte capturado" (panel interno)

Mismo mecanismo, pero avisa a administración cada vez que se captura un
corte de caja en `/admin/cortes/nuevo`. Usa el mismo token, phone number
ID y número de destino de arriba — solo necesitas una plantilla nueva:

1. En **WhatsApp Manager → Plantillas de mensaje**, crea otra:
   - Nombre: `corte_capturado_farmalem`
   - Categoría: **Utilidad**
   - Idioma: Español (MX)
   - Cuerpo del mensaje, con 4 variables en este orden exacto:
     ```
     Nuevo corte capturado en FarmaLEM

     Empleado: {{1}}
     Turno: {{2}}
     Fecha: {{3}}
     Total: ${{4}} MXN

     Revísalo en tu panel de cortes.
     ```
   - Envíala a revisión.
2. Si usas un nombre distinto a `corte_capturado_farmalem`, ponlo en
   `WHATSAPP_CUT_TEMPLATE_NAME`.

Igual que con los pedidos: mientras la plantilla no esté aprobada, el
corte se guarda normalmente y el aviso solo se omite.

## Cómo funciona la tienda

1. El cliente arma su carrito (vive en `localStorage`, componente
   `CartProvider` en `src/lib/cart-context.tsx`).
2. En `/checkout` deja nombre y teléfono → se crea el pedido en Supabase
   (`farmalem.orders` / `farmalem.order_items`, estado `pendiente_pago`) y
   se genera una preferencia de Mercado Pago (Checkout Pro) — el cliente
   paga en Mercado Pago, no en este sitio.
3. Mercado Pago llama a `/api/webhooks/mercadopago` cuando el pago se
   confirma; el pedido pasa a `pagado` y te llega un WhatsApp automático
   (una sola vez por pedido, aunque Mercado Pago reenvíe el webhook).
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

## Panel de operaciones (`/admin`)

El panel ya no usa una sola contraseña compartida — cada persona tiene su
propio usuario, guardado en `farmalem.profiles` (tabla nueva, aparte de
`orders`/`order_items`, dentro del mismo schema aislado). La contraseña se
guarda con `scrypt` (`src/lib/password.ts`), nunca en texto plano.

Usuarios iniciales (cámbialos apenas puedas — el reset por interfaz llega en
la fase de "Empleados"):

| Usuario | Contraseña temporal | Rol |
|---|---|---|
| `administracion` | `Farma-Admin1` | admin |
| `mariana` | `Farma-Mariana1` | employee |
| `itzel` | `Farma-Itzel1` | employee |

El panel tiene su propia identidad visual (verde, tokens `--admin-*` en
`globals.css`) para distinguirlo de cara al cliente. Por ahora solo vive ahí
la sección **Pedidos** (lo que ya existía) dentro de un layout con menú
lateral (`AdminShell`) — Cortes de caja, Empleados, Asistencia, Sueldos,
Bonos, Proveedores, Recepción de mercancía y Estado de resultados se van
agregando como secciones nuevas del mismo menú, fase por fase.

## Pendientes

- Fotos reales de producto en `public/products/`.
- Productos reales para el estante de liquidación por caducidad.
- Llenar `.env.local` con las credenciales reales (ver tabla arriba) — sin
  esto el carrito funciona pero el pago y el panel de pedidos no.
- Registrar el webhook en Mercado Pago una vez que el sitio tenga dominio
  público.
- Configurar WhatsApp Business Cloud API en Meta y crear/aprobar la
  plantilla `nuevo_pedido_farmalem` (guía arriba) — el código ya está
  listo, solo falta esa configuración de tu lado.
- Calendario de días festivos: hoy "Día festivo" en Asistencia se marca a
  mano, día por día. Falta construir un calendario de festivos (fijos como
  1 de enero, y los que ustedes decidan) para que el sistema lo proponga
  solo en vez de tener que capturarlo manualmente cada vez.
- Reloj checador: hoy la Asistencia se captura a mano, turno por turno.
  Falta construir un reloj checador (entrada/salida real del empleado) para
  que la asistencia se registre sola en vez de capturarla manualmente cada
  día.
