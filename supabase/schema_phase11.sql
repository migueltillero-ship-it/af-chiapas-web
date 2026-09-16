-- ────────────────────────────────────────────────────────────────────────────
-- Alliance Française San Cristóbal · Fase 11
-- Parámetros completos de grupo (fechas, horario estructurado, horas
-- presencial/virtual, costo, plataforma, método) + calendario de feriados.
-- Ejecutar después de las fases previas.
-- ────────────────────────────────────────────────────────────────────────────

alter table public.grupos
  add column if not exists fecha_cierre     date,
  add column if not exists dias_semana      int[],           -- 0=domingo … 6=sábado
  add column if not exists hora_inicio      time,
  add column if not exists hora_fin         time,
  add column if not exists horas_totales    int,
  add column if not exists horas_presencial int not null default 0,
  add column if not exists horas_virtual    int not null default 0,
  add column if not exists costo            numeric(10,2),
  add column if not exists moneda           text not null default 'MXN',
  add column if not exists plataforma       text,
  add column if not exists metodo           text;

-- Calendario de días feriados / no laborables (usado al agendar sesiones)
create table if not exists public.feriados (
  id uuid primary key default gen_random_uuid(),
  fecha date not null,
  nombre text not null,
  pais text not null default 'MX',
  creado_en timestamptz not null default now(),
  unique (fecha, pais)
);

create index if not exists idx_feriados_fecha on public.feriados(fecha);

alter table public.feriados enable row level security;

drop policy if exists "admin total feriados" on public.feriados;
create policy "admin total feriados"
  on public.feriados for all to authenticated
  using (public.es_admin()) with check (public.es_admin());

-- Semilla: feriados oficiales de México 2026 (para no agendar sesiones ahí)
insert into public.feriados (fecha, nombre, pais) values
  ('2026-01-01', 'Año Nuevo', 'MX'),
  ('2026-02-02', 'Día de la Constitución (observado)', 'MX'),
  ('2026-03-16', 'Natalicio de Benito Juárez (observado)', 'MX'),
  ('2026-05-01', 'Día del Trabajo', 'MX'),
  ('2026-09-16', 'Día de la Independencia', 'MX'),
  ('2026-11-16', 'Día de la Revolución (observado)', 'MX'),
  ('2026-12-25', 'Navidad', 'MX')
on conflict (fecha, pais) do nothing;
