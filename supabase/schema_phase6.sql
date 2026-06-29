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
