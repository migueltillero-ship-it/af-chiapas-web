-- ═══════════════════════════════════════════════════════════════════
--  Alliance Française San Cristóbal · INSTALACIÓN COMPLETA
--
--  Los ocho esquemas del proyecto, en el orden correcto de dependencias,
--  reunidos en un solo archivo para poder aplicarlos de una sola vez
--  desde el SQL Editor de Supabase.
--
--  Cómo usarlo:
--    1. Supabase Studio → SQL Editor → New query
--    2. Pegar TODO este archivo
--    3. Run
--
--  Es seguro volver a ejecutarlo: los esquemas usan "if not exists" y
--  "on conflict do nothing" donde corresponde.
--
--  NO EDITAR A MANO. Se genera con:
--      python3 scripts/python/generar_instalacion.py
-- ═══════════════════════════════════════════════════════════════════


-- ───────────────────────────────────────────────────────────────
--  schema.sql — Inscripciones, perfiles y bitácora
-- ───────────────────────────────────────────────────────────────

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


-- ───────────────────────────────────────────────────────────────
--  schema_phase2b.sql — Docentes y grupos, con control de cupo
-- ───────────────────────────────────────────────────────────────

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


-- ───────────────────────────────────────────────────────────────
--  schema_phase3.sql — Consulta del alumno por folio y correo
-- ───────────────────────────────────────────────────────────────

-- ────────────────────────────────────────────────────────────────────────────
-- Alliance Française San Cristóbal · Fase 3
-- Portal del alumno: función RPC segura para consultar estado de inscripción
-- por folio + email. No requiere auth — el binomio folio+email es la prueba.
-- Ejecutar después de schema.sql y schema_phase2b.sql.
-- ────────────────────────────────────────────────────────────────────────────

create or replace function public.consulta_inscripcion(p_folio text, p_email text)
returns table(
  folio text,
  nombre text,
  email text,
  telefono text,
  estado estado_inscripcion,
  sede sede_modo,
  curso_id text,
  curso_nombre text,
  nivel text,
  formato formato_clase,
  ritmo ritmo_clase,
  grupo_codigo text,
  grupo_inicio date,
  grupo_horario jsonb,
  docente_nombre text,
  notas_admin text,
  creada_en timestamptz,
  validada_en timestamptz
) language sql security definer set search_path = public as $$
  select
    i.folio,
    i.nombre,
    i.email,
    i.telefono,
    i.estado,
    i.sede,
    i.curso_id,
    i.curso_nombre,
    i.nivel,
    i.formato,
    i.ritmo,
    g.codigo as grupo_codigo,
    g.inicio_ciclo as grupo_inicio,
    g.horario as grupo_horario,
    d.nombre as docente_nombre,
    case when i.estado in ('aprobada','rechazada') then i.notas_admin else null end as notas_admin,
    i.creada_en,
    i.validada_en
  from public.inscripciones i
  left join public.grupos g    on g.id = i.grupo_id
  left join public.docentes d  on d.id = g.docente_id
  where i.folio = p_folio
    and lower(trim(i.email)) = lower(trim(p_email))
  limit 1;
$$;

revoke all on function public.consulta_inscripcion(text, text) from public;
grant execute on function public.consulta_inscripcion(text, text) to anon, authenticated;

comment on function public.consulta_inscripcion(text, text) is
  'Permite al estudiante consultar el estado de su preinscripción presentando folio + email coincidentes. No expone datos de otros estudiantes.';


-- ───────────────────────────────────────────────────────────────
--  schema_phase3b.sql — Permisos del docente sobre sus grupos
-- ───────────────────────────────────────────────────────────────

-- ────────────────────────────────────────────────────────────────────────────
-- Alliance Française San Cristóbal · Fase 3B
-- Portal del docente: policies extendidas + función helper para sus grupos
-- Ejecutar después de schema.sql, schema_phase2b.sql y schema_phase3.sql.
-- ────────────────────────────────────────────────────────────────────────────

-- Helper: ¿el usuario actual es docente?
create or replace function public.es_docente()
returns boolean language sql security definer set search_path = public as $$
  select exists(select 1 from public.docentes where id = auth.uid() and activo = true);
$$;

-- Policy: docente lee las inscripciones aprobadas asignadas a sus grupos
drop policy if exists "docente lee alumnos de sus grupos" on public.inscripciones;
create policy "docente lee alumnos de sus grupos"
  on public.inscripciones for select to authenticated
  using (
    exists(
      select 1 from public.grupos g
      where g.id = inscripciones.grupo_id
        and g.docente_id = auth.uid()
    )
  );

-- Vista cómoda: alumnos de mis grupos (ordenados)
create or replace view public.v_mis_alumnos as
select
  i.id,
  i.folio,
  i.nombre,
  i.email,
  i.telefono,
  i.nivel,
  i.formato,
  i.ritmo,
  i.sede,
  i.estado,
  i.creada_en,
  i.validada_en,
  g.id          as grupo_id,
  g.codigo      as grupo_codigo,
  g.curso_id    as grupo_curso_id,
  g.curso_nombre as grupo_curso_nombre,
  g.nivel       as grupo_nivel,
  g.inicio_ciclo,
  g.horario     as grupo_horario
from public.inscripciones i
join public.grupos g on g.id = i.grupo_id
where g.docente_id = auth.uid()
  and i.estado = 'aprobada';

-- Vista de mis grupos (para el docente)
create or replace view public.v_mis_grupos as
select
  g.*,
  (select count(*) from public.inscripciones i where i.grupo_id = g.id and i.estado = 'aprobada') as alumnos_inscritos
from public.grupos g
where g.docente_id = auth.uid();


-- ───────────────────────────────────────────────────────────────
--  schema_phase5.sql — Eventos culturales editables
-- ───────────────────────────────────────────────────────────────

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


-- ───────────────────────────────────────────────────────────────
--  schema_phase6.sql — Catálogo de cursos editable
-- ───────────────────────────────────────────────────────────────

-- ────────────────────────────────────────────────────────────────────────────
-- Alliance Française San Cristóbal · Fase 6
-- Catálogo de cursos editable desde admin (reemplaza el JSON estático).
-- Ejecutar después de las fases previas.
-- ────────────────────────────────────────────────────────────────────────────

create table if not exists public.cursos (
  id text primary key,
  nombre text not null,
  subtitulo text,
  edad text,
  icono text default 'fa-book',
  color text default '#c9a44e',
  descripcion text,
  manual text,
  evaluacion text,
  orden int not null default 100,
  activo boolean not null default true,
  creado_en timestamptz not null default now(),
  actualizado_en timestamptz not null default now()
);

create table if not exists public.cursos_niveles (
  id uuid primary key default gen_random_uuid(),
  curso_id text not null references public.cursos(id) on delete cascade,
  codigo text not null,
  nombre text not null,
  descripcion text,
  horas_modulo int,
  orden int not null default 100
);

create table if not exists public.cursos_modalidades (
  id uuid primary key default gen_random_uuid(),
  curso_id text not null references public.cursos(id) on delete cascade,
  nombre text not null,
  sesiones text,
  horas_bimestre text,
  descripcion text,
  orden int not null default 100
);

create index if not exists idx_cursos_niveles_curso on public.cursos_niveles(curso_id, orden);
create index if not exists idx_cursos_modalidades_curso on public.cursos_modalidades(curso_id, orden);

create or replace function public.fn_cursos_touch()
returns trigger language plpgsql as $$
begin new.actualizado_en = now(); return new; end $$;
drop trigger if exists tr_cursos_touch on public.cursos;
create trigger tr_cursos_touch before update on public.cursos
for each row execute function public.fn_cursos_touch();

-- RLS
alter table public.cursos             enable row level security;
alter table public.cursos_niveles     enable row level security;
alter table public.cursos_modalidades enable row level security;

drop policy if exists "publico lee cursos activos"   on public.cursos;
drop policy if exists "admin escribe cursos"         on public.cursos;
drop policy if exists "publico lee niveles"          on public.cursos_niveles;
drop policy if exists "admin escribe niveles"        on public.cursos_niveles;
drop policy if exists "publico lee modalidades"      on public.cursos_modalidades;
drop policy if exists "admin escribe modalidades"    on public.cursos_modalidades;

create policy "publico lee cursos activos"
  on public.cursos for select to anon, authenticated
  using (activo = true);
create policy "admin escribe cursos"
  on public.cursos for all to authenticated
  using (public.es_admin()) with check (public.es_admin());

create policy "publico lee niveles"
  on public.cursos_niveles for select to anon, authenticated
  using (exists(select 1 from public.cursos c where c.id = cursos_niveles.curso_id and c.activo = true));
create policy "admin escribe niveles"
  on public.cursos_niveles for all to authenticated
  using (public.es_admin()) with check (public.es_admin());

create policy "publico lee modalidades"
  on public.cursos_modalidades for select to anon, authenticated
  using (exists(select 1 from public.cursos c where c.id = cursos_modalidades.curso_id and c.activo = true));
create policy "admin escribe modalidades"
  on public.cursos_modalidades for all to authenticated
  using (public.es_admin()) with check (public.es_admin());

-- Vista consolidada (lo que consume el sitio público)
create or replace view public.v_catalogo as
select
  c.id,
  c.nombre,
  c.subtitulo,
  c.edad,
  c.icono,
  c.color,
  c.descripcion,
  c.manual,
  c.evaluacion,
  c.orden,
  (select jsonb_agg(jsonb_build_object('codigo',n.codigo,'nombre',n.nombre,'descripcion',n.descripcion,'horas_modulo',n.horas_modulo) order by n.orden)
     from public.cursos_niveles n where n.curso_id = c.id) as niveles,
  (select jsonb_agg(jsonb_build_object('nombre',m.nombre,'sesiones',m.sesiones,'horas_bimestre',m.horas_bimestre,'descripcion',m.descripcion) order by m.orden)
     from public.cursos_modalidades m where m.curso_id = c.id) as modalidades
from public.cursos c
where c.activo = true
order by c.orden;

-- Semilla base (los 6 segmentos del JSON original)
insert into public.cursos (id, nombre, subtitulo, edad, icono, color, descripcion, orden) values
  ('adultos',    'Adultos',                 'Les Adultes',           '15 años en adelante',     'fa-user-graduate', '#00c896', 'Aprende francés con profesionales del idioma. Metodología comunicativa con preparación DELF integrada.', 10),
  ('junior',     'Jóvenes',                 'Junior',                '11 a 17 años',            'fa-user-friends',  '#c9a84c', 'Programa diseñado para adolescentes con contenidos de su entorno. Hasta DELF B2 Junior.', 20),
  ('ninos',      'Niños',                   'Les Enfants',           '4 a 11 años',             'fa-child',         '#ed2939', 'Inmersión lúdica con canciones, cuentos, juegos. Camino al DELF Prim.', 30),
  ('empresarial','Francés Empresarial',     'Pour les Professionnels','Profesionales y empresas','fa-briefcase',     '#002654', 'Programas B2B para empresas e instituciones. Impartimos en su sede o virtual.', 40),
  ('turismo',    'Gastronomía y Turismo',   'Cours Spécialisé',      'Servicios turísticos',    'fa-utensils',      '#9c27b0', 'Francés aplicado al sector turístico: hotelería, restaurantes, guías, recepción.', 50),
  ('delf_prep',  'Preparación DELF/DALF',   'Ateliers Intensifs',    'Candidatos a examen',     'fa-certificate',   '#ff9800', 'Talleres pre-examen con simulacros cronometrados y corrección personalizada.', 60)
on conflict (id) do nothing;


-- ───────────────────────────────────────────────────────────────
--  schema_phase7.sql — Sesiones y asistencias
-- ───────────────────────────────────────────────────────────────

-- ────────────────────────────────────────────────────────────────────────────
-- Alliance Française San Cristóbal · Fase 7
-- Sesiones de clase + asistencias. Docente marca presencia por alumno.
-- Ejecutar después de las fases previas.
-- ────────────────────────────────────────────────────────────────────────────

create table if not exists public.sesiones (
  id uuid primary key default gen_random_uuid(),
  grupo_id uuid not null references public.grupos(id) on delete cascade,
  fecha date not null,
  hora_inicio time,
  hora_fin time,
  tema text,
  notas text,
  creada_en timestamptz not null default now(),
  unique (grupo_id, fecha, hora_inicio)
);

create index if not exists idx_sesiones_grupo on public.sesiones(grupo_id, fecha desc);

do $$ begin
  create type estado_asistencia as enum ('presente','ausente','justificado','retardo');
exception when duplicate_object then null; end $$;

create table if not exists public.asistencias (
  id uuid primary key default gen_random_uuid(),
  sesion_id uuid not null references public.sesiones(id) on delete cascade,
  inscripcion_id uuid not null references public.inscripciones(id) on delete cascade,
  estado estado_asistencia not null default 'presente',
  nota text,
  registrada_por uuid references auth.users(id),
  registrada_en timestamptz not null default now(),
  unique (sesion_id, inscripcion_id)
);

create index if not exists idx_asistencias_inscripcion on public.asistencias(inscripcion_id);

-- RLS
alter table public.sesiones enable row level security;
alter table public.asistencias enable row level security;

drop policy if exists "docente y admin leen sesiones" on public.sesiones;
drop policy if exists "docente y admin escriben sesiones" on public.sesiones;
drop policy if exists "lectura asistencias" on public.asistencias;
drop policy if exists "escritura asistencias" on public.asistencias;

create policy "docente y admin leen sesiones"
  on public.sesiones for select to authenticated
  using (public.es_admin() or exists(
    select 1 from public.grupos g where g.id = sesiones.grupo_id and g.docente_id = auth.uid()
  ));

create policy "docente y admin escriben sesiones"
  on public.sesiones for all to authenticated
  using (public.es_admin() or exists(
    select 1 from public.grupos g where g.id = sesiones.grupo_id and g.docente_id = auth.uid()
  )) with check (public.es_admin() or exists(
    select 1 from public.grupos g where g.id = sesiones.grupo_id and g.docente_id = auth.uid()
  ));

create policy "lectura asistencias"
  on public.asistencias for select to authenticated
  using (public.es_admin() or exists(
    select 1 from public.sesiones s
    join public.grupos g on g.id = s.grupo_id
    where s.id = asistencias.sesion_id and g.docente_id = auth.uid()
  ));

create policy "escritura asistencias"
  on public.asistencias for all to authenticated
  using (public.es_admin() or exists(
    select 1 from public.sesiones s
    join public.grupos g on g.id = s.grupo_id
    where s.id = asistencias.sesion_id and g.docente_id = auth.uid()
  )) with check (public.es_admin() or exists(
    select 1 from public.sesiones s
    join public.grupos g on g.id = s.grupo_id
    where s.id = asistencias.sesion_id and g.docente_id = auth.uid()
  ));

-- Vista de tasa de asistencia por alumno en un grupo
create or replace view public.v_asistencia_alumno as
select
  a.inscripcion_id,
  s.grupo_id,
  count(*) as total,
  count(*) filter (where a.estado = 'presente') as presentes,
  count(*) filter (where a.estado = 'ausente') as ausentes,
  count(*) filter (where a.estado = 'justificado') as justificados,
  count(*) filter (where a.estado = 'retardo') as retardos,
  round(100.0 * count(*) filter (where a.estado in ('presente','justificado','retardo')) / nullif(count(*),0), 1) as tasa
from public.asistencias a
join public.sesiones s on s.id = a.sesion_id
group by a.inscripcion_id, s.grupo_id;

-- Función helper: agendar próximas N sesiones de un grupo desde su inicio
create or replace function public.agendar_sesiones(p_grupo_id uuid, p_dias int[], p_hora time, p_semanas int default 6)
returns int language plpgsql security definer set search_path = public as $$
declare
  v_inicio date;
  v_dia int;
  v_fecha date;
  v_creadas int := 0;
begin
  select inicio_ciclo into v_inicio from public.grupos where id = p_grupo_id;
  if v_inicio is null then return 0; end if;
  for v_semana in 0..(p_semanas-1) loop
    foreach v_dia in array p_dias loop
      v_fecha := v_inicio + (v_semana * 7) + ((v_dia - extract(dow from v_inicio)::int + 7) % 7);
      insert into public.sesiones (grupo_id, fecha, hora_inicio, tema)
      values (p_grupo_id, v_fecha, p_hora, null)
      on conflict (grupo_id, fecha, hora_inicio) do nothing;
      get diagnostics v_creadas = row_count;
    end loop;
  end loop;
  return v_creadas;
end $$;
grant execute on function public.agendar_sesiones(uuid, int[], time, int) to authenticated;


-- ───────────────────────────────────────────────────────────────
--  schema_phase9.sql — Pagos
-- ───────────────────────────────────────────────────────────────

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
