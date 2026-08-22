# FarmaLEM Dashboard — guía para continuar

## Objetivo

Aplicación web para administrar cortes diarios de una farmacia, asistencia, salarios, bonos semanales, salidas de efectivo, proveedores, compras y estado de resultados.

La interfaz actual funciona con HTML, CSS y JavaScript sin framework. La versión local usa `localStorage`; el siguiente trabajo es conectarla al proyecto independiente de Supabase llamado **FarmaLEM** y publicarla para múltiples computadoras.

## Archivos principales

- `index.html`: estructura y navegación.
- `css/styles.css`: diseño responsive.
- `js/app.js`: aplicación local completa.
- `js/supabase-config.example.js`: ejemplo de configuración pública.
- `supabase/farmalem-schema.sql`: tablas, RLS, almacenamiento y metas iniciales.
- `supabase/farmalem-users.sql`: vinculación de usuarios de Supabase con perfiles FarmaLEM.

## Reglas de negocio confirmadas

- Empleadas iniciales:
  - Mariana Serrano — matutino.
  - Itzel — vespertino.
- Sueldo semanal inicial: $1,700 por siete turnos.
- Pago por turno: sueldo semanal dividido entre turnos semanales.
- `Asistió` y `Cubrió turno` generan sueldo.
- `Falta`, `Descanso` y `Cerrado` no generan sueldo.
- Una falta elimina solamente el bono de la semana correspondiente.
- Bonos de agosto de 2026:
  - Matutino: metas $4,700 / $5,700 / $6,700 / $7,700.
  - Vespertino: metas $6,200 / $7,200 / $8,200 / $9,200.
  - Bonos: $150 / $300 / $450 / $600.
- Administración autoriza cortes, gastos y pagos a proveedores.
- Los empleados deben poder activarse, desactivarse y cambiar de turno sin perder historial.
- Fotografías de cortes, facturas y comprobantes deben conservarse.

## Próximos pasos

1. Obtener del proyecto Supabase **FarmaLEM** su Project URL y publishable/anon key.
2. Ejecutar `supabase/farmalem-schema.sql` en su SQL Editor.
3. Crear en Authentication los usuarios internos indicados en `README.md`.
4. Ejecutar `supabase/farmalem-users.sql`.
5. Reemplazar autenticación local y `localStorage` por Supabase Auth, tablas y Storage.
6. Mantener todas las tablas con prefijo `farmalem_` y el bucket `farmalem-documents`.
7. Nunca poner `service_role`, contraseñas de base de datos o tokens privados en el navegador o GitHub.
8. Importar datos históricos de Excel solamente después de validar el flujo nuevo.
9. Adaptar el CSV de compras al formato exacto de SICAR X cuando exista un archivo de ejemplo.

## Requisitos de seguridad

- Mantener RLS habilitado.
- Administración puede consultar y modificar todos los registros FarmaLEM.
- Cada empleada solamente puede consultar sus datos y crear sus propios cortes o salidas permitidas.
- Las fotografías deben permanecer privadas.
- No guardar contraseñas en `app.js`.
- No modificar tablas ajenas a FarmaLEM dentro de otros proyectos.

## Estado actual

La aplicación local está funcional y validada visualmente. Los scripts SQL están preparados, pero deben ejecutarse únicamente en el proyecto separado **FarmaLEM**, no en `lemus-store`.

`js/app.js` se limpió de código muerto que había quedado de iteraciones previas del diseño (tres versiones de la pantalla de bonos y dos de sueldos definidas con el mismo nombre, donde solo la última sobrevivía en silencio). El diseño final que quedó activo:

- **Sueldos** (`payroll`): se calculan automáticamente desde asistencia, no se capturan a mano.
- **Bonos semanales**: pirámide de cuatro niveles por turno (`bonusTiers` + `bonusWeeks`), calculada desde cortes y asistencia.
- **Bonos extraordinarios** (`bonuses`): catálogo manual (concepto + monto + estado) para casos fuera de la pirámide, en su propia pestaña `Bonos extraordinarios`; no se mezcla con el cálculo automático.

El esquema SQL ya reflejaba el diseño final para sueldos y bonos semanales; se agregó la tabla `farmalem_bonuses` (con RLS del mismo patrón que las demás) para que los bonos extraordinarios tengan dónde vivir cuando se conecte Supabase.
