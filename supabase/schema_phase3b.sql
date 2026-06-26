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
