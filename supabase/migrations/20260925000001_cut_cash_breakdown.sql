-- Guarda el conteo de billetes/monedas capturado en "Contar efectivo" (antes
-- solo se usaba para calcular el total y se descartaba) para poder revisarlo
-- después contra el total entregado.
alter table farmalem.cuts add column if not exists cash_breakdown jsonb;
