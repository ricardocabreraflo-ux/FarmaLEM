-- Nota/observación libre por corte, para que administración deje comentarios
-- al revisar (por qué se rechazó, alguna aclaración, etc.) sin tener que
-- usar el modal completo de "Editar corte".

alter table farmalem.cuts
  add column if not exists notes text;
