-- Palomita para marcar que el efectivo físico de ese corte ya se recogió —
-- para llevar control de flujo de efectivo real día a día, aparte de si el
-- corte ya está Aprobado (que solo dice que las cifras cuadran).

alter table farmalem.cuts
  add column if not exists cash_collected boolean not null default false;
