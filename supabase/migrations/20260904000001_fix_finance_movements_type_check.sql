-- The type check constraint was stale: it only allowed
-- 'Ingreso' | 'Costo de venta' | 'Gasto operativo', but the app has used
-- 'Gasto fijo' | 'Gasto variable' | 'Merma' since Estado de resultados
-- shipped. Inserting any of those (e.g. via Gastos fijos y variables ->
-- "Registrar este mes") violated the constraint and crashed the request.
alter table farmalem.finance_movements drop constraint finance_movements_type_check;
alter table farmalem.finance_movements
  add constraint finance_movements_type_check
  check (type = any (array['Ingreso', 'Costo de venta', 'Gasto fijo', 'Gasto variable', 'Merma']));
