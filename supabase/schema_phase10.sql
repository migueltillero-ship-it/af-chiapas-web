-- ────────────────────────────────────────────────────────────────────────────
-- Alliance Française San Cristóbal · Fase 10
-- Egresos (gastos y pagos a docentes), para completar el panel de finanzas
-- junto a la tabla `pagos` (Fase 9) ya existente.
-- Ejecutar después de las fases previas.
-- ────────────────────────────────────────────────────────────────────────────

create table if not exists public.egresos (
  id uuid primary key default gen_random_uuid(),
  concepto text not null,
  categoria text,
  monto numeric(10,2) not null,
  moneda text not null default 'MXN',
  fecha date not null default current_date,
  docente_id uuid references public.docentes(id) on delete set null,
  notas text,
  registrado_por uuid references auth.users(id),
  creado_en timestamptz not null default now()
);

create index if not exists idx_egresos_fecha on public.egresos(fecha desc);
create index if not exists idx_egresos_docente on public.egresos(docente_id);

-- RLS: solo coordinación/admin
alter table public.egresos enable row level security;

drop policy if exists "admin total egresos" on public.egresos;
create policy "admin total egresos"
  on public.egresos for all to authenticated
  using (public.es_admin()) with check (public.es_admin());
