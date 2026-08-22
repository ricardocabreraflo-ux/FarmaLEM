# FarmaLEM · primera versión

Abre `index.html` en un navegador moderno.

## Accesos de demostración

- Administración: `administracion` / `Admin123!`
- Mariana Serrano: `mariana` / `Farma123!`
- Itzel: `itzel` / `Farma123!`

## Funciones incluidas

- Inicio de sesión por empleado y rol.
- Dashboard de ventas, efectivo, tarjeta y salidas.
- Captura y validación de cortes.
- Aprobación administrativa de cortes.
- Registro y autorización de salidas de efectivo.
- Catálogos editables de empleados y proveedores.
- Asistencia diaria y cálculo del sueldo con tarifa por empleado.
- Sueldo semanal editable; valor inicial de $1,700 por siete turnos.
- Turnos cubiertos con pago adicional y registro del cambio de turno.
- Días cerrados, descansos y faltas sin generación de sueldo.
- Bonos semanales calculados por ventas, meta y asistencia.
- Pirámide mensual editable con cuatro niveles para matutino y vespertino.
- Pérdida del bono únicamente en la semana donde existe una falta.
- Bonos extraordinarios (puntualidad, desempeño u otro concepto) como catálogo aparte, sin mezclarse con el cálculo automático de sueldos y bonos semanales.
- Comprobante mensual imprimible de sueldo más bono.
- Recepción de mercancía con exportación CSV.
- Finanzas y estado de resultados por periodo.
- Integración automática de cortes aprobados, proveedores, gastos, sueldos y bonos.
- Activación y desactivación de empleados sin perder su historial.
- Bitácora de movimientos administrativos.
- Diseño adaptable a celular y computadora.

## Alcance de esta entrega

Esta versión guarda la información en el navegador del dispositivo mediante almacenamiento local. Sirve para validar el flujo y las futuras pestañas, pero todavía no sincroniza datos entre varios celulares.

Antes del uso diario se debe conectar a una base de datos central, sustituir las contraseñas de demostración por autenticación segura y habilitar almacenamiento real de fotografías y comprobantes.

## Preparación de Supabase

El esquema aislado está en `supabase/farmalem-schema.sql`. Todas las tablas comienzan con `farmalem_` y el depósito privado de archivos se llama `farmalem-documents`, por lo que no se mezclan con las tablas de otros sistemas dentro del mismo proyecto.

1. Ejecuta `supabase/farmalem-schema.sql` en Supabase SQL Editor.
2. Copia `js/supabase-config.example.js` como `js/supabase-config.js`.
3. Coloca únicamente la publishable key o anon public key.
4. Nunca agregues la service role key ni la contraseña de la base al repositorio.

Después crea en Authentication > Users las cuentas internas `administracion@farmalem.local`, `mariana@farmalem.local` e `itzel@farmalem.local`, asignando tú sus contraseñas. Finalmente ejecuta `supabase/farmalem-users.sql` para vincularlas con sus perfiles y permisos.
