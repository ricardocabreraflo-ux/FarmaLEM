-- Para poder cruzar por similitud de texto (p.ej. renglones de ticket
-- pendientes contra el catálogo de referencia, cuando la descripción no
-- coincide exacta).
create extension if not exists pg_trgm;
