-- Marca manual de "ya lo capturé en el otro sistema" (SICAR X u otro) para
-- cada recepción, independiente de su estado Pendiente/Completa — sirve para
-- llevar control de qué tickets ya se pasaron aparte, sin mezclarlo con si
-- ya se terminaron de resolver sus renglones en FarmaLEM.

alter table farmalem.purchase_receipts
  add column if not exists entered_in_system boolean not null default false;
