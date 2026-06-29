-- ────────────────────────────────────────────────────────────────────────────
-- Alliance Française San Cristóbal · Fase 9
-- Pagos: tabla pagos vinculada a inscripciones + Stripe Checkout
-- Ejecutar después de las fases previas.
-- ────────────────────────────────────────────────────────────────────────────

do $$ begin
  create type estado_pago as enum ('pendiente','procesando','pagado','rechazado','reembolsado');
exception when duplicate_object then null; end $$;

create table if not exists public.pagos (
  id uuid primary key default gen_random_uuid(),
  inscripcion_id uuid not null references public.inscripciones(id) on delete cascade,
  monto numeric(10,2) not null,
  moneda text not null default 'MXN',
  concepto text,
  estado estado_pago not null default 'pendiente',
  proveedor text default 'stripe',
  stripe_session_id text unique,
  stripe_payment_intent text,
  checkout_url text,
  pagado_en timestamptz,
  creado_en timestamptz not null default now(),
  actualizado_en timestamptz not null default now()
);

create index if not exists idx_pagos_inscripcion on public.pagos(inscripcion_id);
create index if not exists idx_pagos_estado on public.pagos(estado);

create or replace function public.fn_pagos_touch()
returns trigger language plpgsql as $$
begin new.actualizado_en = now(); return new; end $$;
drop trigger if exists tr_pagos_touch on public.pagos;
create trigger tr_pagos_touch before update on public.pagos
for each row execute function public.fn_pagos_touch();

alter table public.pagos enable row level security;

-- Admin total; alumno lee solo los pagos de SU inscripcion (vía RPC futura)
drop policy if exists "admin total pagos" on public.pagos;
create policy "admin total pagos"
  on public.pagos for all to authenticated
  using (public.es_admin()) with check (public.es_admin());

-- RPC para que el alumno consulte sus pagos por folio+email
create or replace function public.consulta_pagos(p_folio text, p_email text)
returns table(
  id uuid, monto numeric, moneda text, concepto text,
  estado estado_pago, checkout_url text, pagado_en timestamptz, creado_en timestamptz
) language sql security definer set search_path = public as $$
  select p.id, p.monto, p.moneda, p.concepto, p.estado, p.checkout_url, p.pagado_en, p.creado_en
  from public.pagos p
  join public.inscripciones i on i.id = p.inscripcion_id
  where i.folio = p_folio
    and lower(trim(i.email)) = lower(trim(p_email))
  order by p.creado_en desc;
$$;
revoke all on function public.consulta_pagos(text, text) from public;
grant execute on function public.consulta_pagos(text, text) to anon, authenticated;
