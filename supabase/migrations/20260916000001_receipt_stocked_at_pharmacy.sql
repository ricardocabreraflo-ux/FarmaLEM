-- Segunda palomita para una recepción, aparte de "Sistema" (ya capturado en
-- SICAR X): "Farmacia" marca que la mercancía ya se acomodó físicamente en
-- el anaquel. Son dos cosas independientes — puede estar surtida en la
-- farmacia sin estar todavía capturada en el otro sistema, o al revés.

alter table farmalem.purchase_receipts
  add column if not exists stocked_at_pharmacy boolean not null default false;
