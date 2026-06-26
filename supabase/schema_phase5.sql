-- ────────────────────────────────────────────────────────────────────────────
-- Alliance Française San Cristóbal · Fase 5
-- Eventos editables desde admin. Cualquiera lee, solo coordinación/admin
-- escriben. El sitio público los consume vía REST.
-- Ejecutar después de las fases previas.
-- ────────────────────────────────────────────────────────────────────────────

do $$ begin
  create type evento_modo as enum ('presencial','virtual','hibrido');
exception when duplicate_object then null; end $$;

create table if not exists public.eventos (
  id uuid primary key default gen_random_uuid(),
  titulo text not null,
  descripcion text,
  fecha date not null,
  hora time,
  lugar text,
  categoria text,
  modo evento_modo not null default 'presencial',
  entrada_libre boolean not null default true,
  url_inscripcion text,
  destacado boolean not null default false,
  publicado boolean not null default true,
  creado_en timestamptz not null default now(),
  actualizado_en timestamptz not null default now()
);

create index if not exists idx_eventos_fecha on public.eventos(fecha desc);
create index if not exists idx_eventos_publicado on public.eventos(publicado, fecha desc);

-- Trigger actualizado_en
create or replace function public.fn_eventos_touch()
returns trigger language plpgsql as $$
begin new.actualizado_en = now(); return new; end $$;
drop trigger if exists tr_eventos_touch on public.eventos;
create trigger tr_eventos_touch before update on public.eventos
for each row execute function public.fn_eventos_touch();

-- RLS
alter table public.eventos enable row level security;

drop policy if exists "publico lee eventos publicados" on public.eventos;
drop policy if exists "admin escribe eventos" on public.eventos;

create policy "publico lee eventos publicados"
  on public.eventos for select to anon, authenticated
  using (publicado = true);

create policy "admin escribe eventos"
  on public.eventos for all to authenticated
  using (public.es_admin()) with check (public.es_admin());

-- Semilla mínima (opcional, comentar antes de prod)
-- insert into public.eventos (titulo, fecha, hora, lugar, categoria, modo, entrada_libre)
-- values ('Fête de la Musique 2026', '2026-06-21', '18:00', 'San Cristóbal', 'Música', 'presencial', true);
