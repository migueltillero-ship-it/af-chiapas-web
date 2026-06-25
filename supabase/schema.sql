-- ────────────────────────────────────────────────────────────────────────────
-- Alliance Française San Cristóbal · Fase 2A — Esquema inicial
-- Ejecutar en Supabase Studio → SQL Editor (proyecto recién creado)
-- ────────────────────────────────────────────────────────────────────────────

-- 1. Tipos enumerados
do $$ begin
  create type sede_modo as enum ('virtual','scsc');
exception when duplicate_object then null; end $$;

do $$ begin
  create type formato_clase as enum ('individual','grupal');
exception when duplicate_object then null; end $$;

do $$ begin
  create type ritmo_clase as enum ('regular','intensivo','superintensivo','sabatino','particular');
exception when duplicate_object then null; end $$;

do $$ begin
  create type estado_inscripcion as enum ('pendiente','en_revision','aprobada','rechazada','cancelada');
exception when duplicate_object then null; end $$;

do $$ begin
  create type rol_usuario as enum ('alumno','docente','coordinacion','admin');
exception when duplicate_object then null; end $$;

-- 2. Perfiles (extiende auth.users con rol y datos institucionales)
create table if not exists public.perfiles (
  id uuid primary key references auth.users(id) on delete cascade,
  nombre text,
  rol rol_usuario not null default 'coordinacion',
  telefono text,
  creado_en timestamptz not null default now()
);

-- 3. Inscripciones (lo que recibe el formulario público)
create table if not exists public.inscripciones (
  id uuid primary key default gen_random_uuid(),
  folio text unique not null,
  sede sede_modo not null,
  curso_id text not null,
  curso_nombre text,
  nivel text,
  formato formato_clase,
  ritmo ritmo_clase,
  inicio text,
  nombre text not null,
  email text not null,
  telefono text not null,
  fuente text,
  mensaje text,
  estado estado_inscripcion not null default 'pendiente',
  notas_admin text,
  validada_por uuid references auth.users(id),
  validada_en timestamptz,
  creada_en timestamptz not null default now()
);

create index if not exists idx_inscripciones_estado on public.inscripciones(estado);
create index if not exists idx_inscripciones_creada on public.inscripciones(creada_en desc);

-- 4. Bitácora de cambios de estado (auditoría)
create table if not exists public.inscripciones_bitacora (
  id uuid primary key default gen_random_uuid(),
  inscripcion_id uuid not null references public.inscripciones(id) on delete cascade,
  estado_anterior estado_inscripcion,
  estado_nuevo estado_inscripcion not null,
  nota text,
  cambiado_por uuid references auth.users(id),
  cambiado_en timestamptz not null default now()
);

-- 5. Trigger para alimentar bitácora
create or replace function public.fn_inscripciones_bitacora()
returns trigger language plpgsql as $$
begin
  if tg_op = 'UPDATE' and new.estado is distinct from old.estado then
    insert into public.inscripciones_bitacora(inscripcion_id, estado_anterior, estado_nuevo, nota, cambiado_por)
    values (new.id, old.estado, new.estado, new.notas_admin, new.validada_por);
  end if;
  return new;
end $$;

drop trigger if exists tr_inscripciones_bitacora on public.inscripciones;
create trigger tr_inscripciones_bitacora
after update on public.inscripciones
for each row execute function public.fn_inscripciones_bitacora();

-- 6. Vista de estadísticas para el dashboard
create or replace view public.v_inscripciones_stats as
select
  estado,
  count(*) as total,
  count(*) filter (where creada_en > now() - interval '7 days')  as ultimos_7d,
  count(*) filter (where creada_en > now() - interval '30 days') as ultimos_30d
from public.inscripciones
group by estado;

-- ────────────────────────────────────────────────────────────────────────────
-- 7. ROW LEVEL SECURITY
-- ────────────────────────────────────────────────────────────────────────────

alter table public.perfiles                   enable row level security;
alter table public.inscripciones              enable row level security;
alter table public.inscripciones_bitacora     enable row level security;

-- Helper: ¿el usuario actual es coordinación o admin?
create or replace function public.es_admin()
returns boolean language sql security definer set search_path = public as $$
  select exists(
    select 1 from public.perfiles
    where id = auth.uid() and rol in ('coordinacion','admin')
  );
$$;

-- Perfiles: cada usuario lee y edita el suyo; admin lee todos
drop policy if exists "perfil propio leer"     on public.perfiles;
drop policy if exists "perfil propio actualizar" on public.perfiles;
drop policy if exists "admin lee perfiles"     on public.perfiles;

create policy "perfil propio leer"
  on public.perfiles for select to authenticated
  using (id = auth.uid() or public.es_admin());

create policy "perfil propio actualizar"
  on public.perfiles for update to authenticated
  using (id = auth.uid()) with check (id = auth.uid());

-- Inscripciones:
-- * el público anónimo puede INSERTAR (formulario)
-- * solo coordinación/admin pueden leer y actualizar
drop policy if exists "publico crea preinscripciones" on public.inscripciones;
drop policy if exists "admin lee inscripciones"      on public.inscripciones;
drop policy if exists "admin actualiza inscripciones" on public.inscripciones;

create policy "publico crea preinscripciones"
  on public.inscripciones for insert to anon, authenticated
  with check (true);

create policy "admin lee inscripciones"
  on public.inscripciones for select to authenticated
  using (public.es_admin());

create policy "admin actualiza inscripciones"
  on public.inscripciones for update to authenticated
  using (public.es_admin()) with check (public.es_admin());

-- Bitácora: solo admin lee
drop policy if exists "admin lee bitacora" on public.inscripciones_bitacora;
create policy "admin lee bitacora"
  on public.inscripciones_bitacora for select to authenticated
  using (public.es_admin());

-- ────────────────────────────────────────────────────────────────────────────
-- 8. SEMBRADO DE EJEMPLO (opcional, comentar antes de producción)
-- ────────────────────────────────────────────────────────────────────────────
-- insert into public.inscripciones (folio, sede, curso_id, curso_nombre, formato, ritmo, nombre, email, telefono)
-- values
--   ('AF-260101-DEMO', 'virtual', 'adultos', 'Adultos', 'grupal', 'regular',
--    'Ejemplo Demo', 'demo@example.com', '+52 967 000 0000');
