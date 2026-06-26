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
