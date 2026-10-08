-- Si una Entrada llegó después de la tolerancia (8:00am matutino, 3:00pm
-- vespertino) y con cuántos minutos — null en Salidas, y en Entradas de
-- turnos sin horario definido (Administración). Queda guardado al momento
-- de marcar para no tener que recalcularlo después con reglas que cambien.
alter table farmalem.time_clock_events add column if not exists is_late boolean;
alter table farmalem.time_clock_events add column if not exists late_minutes integer;
