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
