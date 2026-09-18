-- ────────────────────────────────────────────────────────────────────────────
-- Alliance Française San Cristóbal · Fase 13
-- Rastreo de "Inscríbete conmigo": cuando un visitante hace clic en el botón
-- de un docente desde la sección "Conoce a nuestro equipo", guardamos qué
-- docente y qué modalidad (particular/grupo) pidió, para que coordinación
-- pueda identificar y atender esas solicitudes específicamente.
-- Ejecutar después de las fases previas.
-- ────────────────────────────────────────────────────────────────────────────

alter table public.inscripciones
  add column if not exists docente_solicitado text,
  add column if not exists docente_modalidad text;
