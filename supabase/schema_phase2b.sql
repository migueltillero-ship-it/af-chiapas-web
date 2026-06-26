-- ────────────────────────────────────────────────────────────────────────────
-- Alliance Française San Cristóbal · Fase 2B
-- Docentes, grupos con cupo, horarios y asignación al aprobar inscripción.
-- Ejecutar DESPUÉS de schema.sql en el SQL Editor de Supabase.
-- ────────────────────────────────────────────────────────────────────────────

-- 1. Docentes (extiende auth.users con perfil profesional)
create table if not exists public.docentes (
  id uuid primary key references auth.users(id) on delete cascade,
  nombre text not null,
  email text,
  telefono text,
  certificaciones text[],
  niveles_que_imparte text[],  -- ['A1','A2','B1','B2','C1','C2']
  activo boolean not null default true,
  creado_en timestamptz not null default now()
);

-- 2. Grupos (instancias activas de un curso)
do $$ begin
  create type estado_grupo as enum ('abierto','cerrado','en_curso','finalizado');
exception when duplicate_object then null; end $$;

create table if not exists public.grupos (
  id uuid primary key default gen_random_uuid(),
  codigo text unique not null,
  curso_id text not null,
  curso_nombre text,
  nivel text not null,
  formato formato_clase not null,
  ritmo ritmo_clase not null,
  sede sede_modo not null,
  docente_id uuid references public.docentes(id) on delete set null,
  cupo_max int not null default 15 check (cupo_max > 0),
  cupo_actual int not null default 0 check (cupo_actual >= 0),
  inicio_ciclo date not null,
  horario jsonb,
  estado estado_grupo not null default 'abierto',
  notas text,
  creado_en timestamptz not null default now()
);

create index if not exists idx_grupos_busqueda on public.grupos(curso_id, nivel, formato, ritmo, sede, estado);
create index if not exists idx_grupos_docente on public.grupos(docente_id);

-- 3. Asignación grupo en inscripciones
alter table public.inscripciones
  add column if not exists grupo_id uuid references public.grupos(id) on delete set null;

create index if not exists idx_inscripciones_grupo on public.inscripciones(grupo_id);

-- 4. Trigger: mantener cupo_actual sincronizado
create or replace function public.fn_grupo_cupo()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  if tg_op = 'UPDATE' then
    -- Asignación nueva o cambio de grupo
    if new.grupo_id is distinct from old.grupo_id then
      if new.grupo_id is not null then
        update public.grupos set cupo_actual = cupo_actual + 1
        where id = new.grupo_id;
      end if;
      if old.grupo_id is not null then
        update public.grupos set cupo_actual = greatest(0, cupo_actual - 1)
        where id = old.grupo_id;
      end if;
    end if;
  end if;
  return new;
end $$;

drop trigger if exists tr_grupo_cupo on public.inscripciones;
create trigger tr_grupo_cupo
after update on public.inscripciones
for each row execute function public.fn_grupo_cupo();

-- 5. Vista: grupos con cupo disponible (para el admin al asignar)
create or replace view public.v_grupos_disponibles as
select
  g.id,
  g.codigo,
  g.curso_id,
  g.curso_nombre,
  g.nivel,
  g.formato,
  g.ritmo,
  g.sede,
  g.cupo_max,
  g.cupo_actual,
  (g.cupo_max - g.cupo_actual) as cupo_disponible,
  g.inicio_ciclo,
  g.horario,
  g.estado,
  d.nombre as docente_nombre
from public.grupos g
left join public.docentes d on d.id = g.docente_id
where g.estado in ('abierto','en_curso')
order by g.inicio_ciclo asc, g.codigo;

-- ────────────────────────────────────────────────────────────────────────────
-- 6. RLS
-- ────────────────────────────────────────────────────────────────────────────

alter table public.docentes enable row level security;
alter table public.grupos enable row level security;

-- Docentes: ven y editan su propio perfil; admin todos
drop policy if exists "docente lee propio"   on public.docentes;
drop policy if exists "docente actualiza propio" on public.docentes;
drop policy if exists "admin lee docentes"   on public.docentes;
drop policy if exists "admin escribe docentes" on public.docentes;

create policy "docente lee propio"
  on public.docentes for select to authenticated
  using (id = auth.uid() or public.es_admin());

create policy "docente actualiza propio"
  on public.docentes for update to authenticated
  using (id = auth.uid()) with check (id = auth.uid());

create policy "admin escribe docentes"
  on public.docentes for all to authenticated
  using (public.es_admin()) with check (public.es_admin());

-- Grupos: admin total; docente lee los suyos
drop policy if exists "admin total grupos"   on public.grupos;
drop policy if exists "docente lee sus grupos" on public.grupos;

create policy "admin total grupos"
  on public.grupos for all to authenticated
  using (public.es_admin()) with check (public.es_admin());

create policy "docente lee sus grupos"
  on public.grupos for select to authenticated
  using (docente_id = auth.uid());
