alter table farmalem.time_clock_events add column if not exists is_early_exit boolean;
alter table farmalem.time_clock_events add column if not exists early_exit_minutes integer;
