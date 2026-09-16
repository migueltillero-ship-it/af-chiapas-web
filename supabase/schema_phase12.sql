-- ────────────────────────────────────────────────────────────────────────────
-- Alliance Française San Cristóbal · Fase 12
-- Portal del alumno con cuenta propia (correo + contraseña): autoregistro,
-- evaluaciones, validación de nivel por el docente, y solicitud de
-- constancias/certificados (servicio de pago aparte, facturado por AF).
-- Ejecutar después de las fases previas.
-- ────────────────────────────────────────────────────────────────────────────

-- 1. Helper: correo del usuario autenticado actual (para políticas RLS que
--    comparan contra inscripciones.email, igual que ya hace consulta_inscripcion).
create or replace function public.mi_email()
returns text language sql stable security definer set search_path = public as $$
  select lower(trim(email)) from auth.users where id = auth.uid()
$$;

-- 2. Autoregistro: un visitante ya autenticado (recién hizo signUp) puede
--    crear su propio perfil, pero solo con rol 'alumno' — nunca admin/docente.
drop policy if exists "alumno crea su propio perfil" on public.perfiles;
create policy "alumno crea su propio perfil"
  on public.perfiles for insert to authenticated
  with check (id = auth.uid() and rol = 'alumno');

-- 3. El alumno lee sus propias inscripciones, su grupo, sus sesiones,
--    su asistencia y sus pagos — por coincidencia de correo (RLS policies
--    adicionales; se combinan con las ya existentes de admin/docente).
drop policy if exists "alumno lee sus inscripciones" on public.inscripciones;
create policy "alumno lee sus inscripciones"
  on public.inscripciones for select to authenticated
  using (lower(trim(email)) = public.mi_email());

-- Nota: NO se puede consultar inscripciones directamente aquí — la policy
-- "docente lee alumnos de sus grupos" (Fase 3B) sobre inscripciones consulta
-- grupos, y esa policy sobre grupos consultaría inscripciones de vuelta:
-- recursión infinita. Se rompe el ciclo con una función security definer,
-- que lee inscripciones sin pasar por su RLS (igual que mi_email()).
create or replace function public.es_mi_grupo(p_grupo_id uuid)
returns boolean language sql stable security definer set search_path = public as $$
  select exists(
    select 1 from public.inscripciones i
    where i.grupo_id = p_grupo_id and lower(trim(i.email)) = public.mi_email()
  )
$$;

drop policy if exists "alumno lee su grupo" on public.grupos;
create policy "alumno lee su grupo"
  on public.grupos for select to authenticated
  using (public.es_mi_grupo(grupos.id));

drop policy if exists "alumno lee sesiones de su grupo" on public.sesiones;
create policy "alumno lee sesiones de su grupo"
  on public.sesiones for select to authenticated
  using (exists(
    select 1 from public.inscripciones i
    where i.grupo_id = sesiones.grupo_id
      and i.estado = 'aprobada'
      and lower(trim(i.email)) = public.mi_email()
  ));

drop policy if exists "alumno lee su asistencia" on public.asistencias;
create policy "alumno lee su asistencia"
  on public.asistencias for select to authenticated
  using (exists(
    select 1 from public.inscripciones i
    where i.id = asistencias.inscripcion_id and lower(trim(i.email)) = public.mi_email()
  ));

drop policy if exists "alumno lee docente de su grupo" on public.docentes;
create policy "alumno lee docente de su grupo"
  on public.docentes for select to authenticated
  using (exists(
    select 1 from public.grupos g where g.docente_id = docentes.id and public.es_mi_grupo(g.id)
  ));

drop policy if exists "alumno lee sus pagos" on public.pagos;
create policy "alumno lee sus pagos"
  on public.pagos for select to authenticated
  using (exists(
    select 1 from public.inscripciones i
    where i.id = pagos.inscripcion_id and lower(trim(i.email)) = public.mi_email()
  ));

-- 4. Evaluaciones (continua y final — ambas cuentan para el resultado total).
--    Estructura deliberadamente flexible (título + calificación + comentario)
--    hasta tener la rúbrica exacta por método/nivel.
do $$ begin
  create type tipo_evaluacion as enum ('continua','final');
exception when duplicate_object then null; end $$;

create table if not exists public.evaluaciones (
  id uuid primary key default gen_random_uuid(),
  inscripcion_id uuid not null references public.inscripciones(id) on delete cascade,
  tipo tipo_evaluacion not null default 'continua',
  titulo text not null,
  calificacion numeric(5,2),
  comentario text,
  fecha date not null default current_date,
  registrada_por uuid references auth.users(id),
  creado_en timestamptz not null default now()
);

create index if not exists idx_evaluaciones_inscripcion on public.evaluaciones(inscripcion_id);

alter table public.evaluaciones enable row level security;

drop policy if exists "admin total evaluaciones" on public.evaluaciones;
create policy "admin total evaluaciones"
  on public.evaluaciones for all to authenticated
  using (public.es_admin()) with check (public.es_admin());

drop policy if exists "docente gestiona evaluaciones de sus grupos" on public.evaluaciones;
create policy "docente gestiona evaluaciones de sus grupos"
  on public.evaluaciones for all to authenticated
  using (exists(
    select 1 from public.inscripciones i join public.grupos g on g.id = i.grupo_id
    where i.id = evaluaciones.inscripcion_id and g.docente_id = auth.uid()
  )) with check (exists(
    select 1 from public.inscripciones i join public.grupos g on g.id = i.grupo_id
    where i.id = evaluaciones.inscripcion_id and g.docente_id = auth.uid()
  ));

drop policy if exists "alumno lee sus evaluaciones" on public.evaluaciones;
create policy "alumno lee sus evaluaciones"
  on public.evaluaciones for select to authenticated
  using (exists(
    select 1 from public.inscripciones i
    where i.id = evaluaciones.inscripcion_id and lower(trim(i.email)) = public.mi_email()
  ));

-- 5. Validación de nivel: el docente marca si el alumno demostró las
--    competencias del nivel, con comentario. Una fila por inscripción/ciclo.
create table if not exists public.validaciones_nivel (
  id uuid primary key default gen_random_uuid(),
  inscripcion_id uuid not null unique references public.inscripciones(id) on delete cascade,
  validado boolean not null default false,
  comentario_docente text,
  validado_por uuid references auth.users(id),
  validado_en timestamptz,
  actualizado_en timestamptz not null default now()
);

create or replace function public.fn_validaciones_touch()
returns trigger language plpgsql as $$
begin new.actualizado_en = now(); return new; end $$;
drop trigger if exists tr_validaciones_touch on public.validaciones_nivel;
create trigger tr_validaciones_touch before update on public.validaciones_nivel
for each row execute function public.fn_validaciones_touch();

alter table public.validaciones_nivel enable row level security;

drop policy if exists "admin total validaciones" on public.validaciones_nivel;
create policy "admin total validaciones"
  on public.validaciones_nivel for all to authenticated
  using (public.es_admin()) with check (public.es_admin());

drop policy if exists "docente valida sus grupos" on public.validaciones_nivel;
create policy "docente valida sus grupos"
  on public.validaciones_nivel for all to authenticated
  using (exists(
    select 1 from public.inscripciones i join public.grupos g on g.id = i.grupo_id
    where i.id = validaciones_nivel.inscripcion_id and g.docente_id = auth.uid()
  )) with check (exists(
    select 1 from public.inscripciones i join public.grupos g on g.id = i.grupo_id
    where i.id = validaciones_nivel.inscripcion_id and g.docente_id = auth.uid()
  ));

drop policy if exists "alumno lee su validacion" on public.validaciones_nivel;
create policy "alumno lee su validacion"
  on public.validaciones_nivel for select to authenticated
  using (exists(
    select 1 from public.inscripciones i
    where i.id = validaciones_nivel.inscripcion_id and lower(trim(i.email)) = public.mi_email()
  ));

-- 6. Catálogo de constancias/certificados — servicio de pago aparte de las
--    colegiaturas. Sin semilla: coordinación define nombre y costo reales
--    desde el panel antes de que los alumnos puedan solicitarlos.
create table if not exists public.tipos_constancia (
  id uuid primary key default gen_random_uuid(),
  nombre text not null,
  descripcion text,
  costo numeric(10,2) not null default 0,
  moneda text not null default 'MXN',
  activo boolean not null default true,
  creado_en timestamptz not null default now()
);

alter table public.tipos_constancia enable row level security;

drop policy if exists "publico lee tipos de constancia activos" on public.tipos_constancia;
create policy "publico lee tipos de constancia activos"
  on public.tipos_constancia for select to authenticated
  using (activo = true or public.es_admin());

drop policy if exists "admin escribe tipos de constancia" on public.tipos_constancia;
create policy "admin escribe tipos de constancia"
  on public.tipos_constancia for all to authenticated
  using (public.es_admin()) with check (public.es_admin());

-- 7. Solicitudes de constancia/certificado hechas por el alumno.
do $$ begin
  create type estado_solicitud as enum ('solicitada','en_proceso','pagada','emitida','cancelada');
exception when duplicate_object then null; end $$;

create table if not exists public.solicitudes_constancia (
  id uuid primary key default gen_random_uuid(),
  inscripcion_id uuid not null references public.inscripciones(id) on delete cascade,
  tipo_id uuid not null references public.tipos_constancia(id),
  estado estado_solicitud not null default 'solicitada',
  notas text,
  creado_en timestamptz not null default now(),
  actualizado_en timestamptz not null default now()
);

create index if not exists idx_solicitudes_inscripcion on public.solicitudes_constancia(inscripcion_id);

create or replace function public.fn_solicitudes_touch()
returns trigger language plpgsql as $$
begin new.actualizado_en = now(); return new; end $$;
drop trigger if exists tr_solicitudes_touch on public.solicitudes_constancia;
create trigger tr_solicitudes_touch before update on public.solicitudes_constancia
for each row execute function public.fn_solicitudes_touch();

alter table public.solicitudes_constancia enable row level security;

drop policy if exists "admin total solicitudes" on public.solicitudes_constancia;
create policy "admin total solicitudes"
  on public.solicitudes_constancia for all to authenticated
  using (public.es_admin()) with check (public.es_admin());

drop policy if exists "alumno crea su solicitud" on public.solicitudes_constancia;
create policy "alumno crea su solicitud"
  on public.solicitudes_constancia for insert to authenticated
  with check (exists(
    select 1 from public.inscripciones i
    where i.id = solicitudes_constancia.inscripcion_id and lower(trim(i.email)) = public.mi_email()
  ));

drop policy if exists "alumno lee sus solicitudes" on public.solicitudes_constancia;
create policy "alumno lee sus solicitudes"
  on public.solicitudes_constancia for select to authenticated
  using (exists(
    select 1 from public.inscripciones i
    where i.id = solicitudes_constancia.inscripcion_id and lower(trim(i.email)) = public.mi_email()
  ));
