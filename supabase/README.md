# Supabase — Fase 2A

Backend para validación administrativa de preinscripciones de la Alliance Française San Cristóbal.

## Configuración inicial (5 minutos)

### 1. Crear proyecto

1. Entra a [supabase.com](https://supabase.com) → **New project**
2. Nombre: `af-san-cristobal`
3. Region: **South America (São Paulo)** o **US East**
4. Guarda la **Database password** en un lugar seguro
5. Espera ~2 min a que se aprovisione

### 2. Aplicar el esquema

1. Supabase Studio → **SQL Editor**
2. Pega el contenido de `supabase/schema.sql`
3. **Run** — debería crear tipos, tablas, RLS, triggers y vista

### 3. Copiar credenciales públicas

1. Supabase Studio → **Settings → API**
2. Copia:
   - **Project URL**
   - **anon public** key (la pública — la `service_role` NUNCA va en el frontend)
3. Pega en `src/config/supabase.js` (reemplaza los placeholders)

### 4. Crear el primer usuario administrador

1. Supabase Studio → **Authentication → Users → Add user**
2. Email + password — ej. `direccionsancristobal@alianzafr.edu.mx`
3. **SQL Editor** corre:

   ```sql
   insert into public.perfiles (id, nombre, rol)
   select id, 'Tu Nombre', 'admin'
   from auth.users
   where email = 'direccionsancristobal@alianzafr.edu.mx';
   ```

### 5. Verificar

- Abre `https://migueltillero-ship-it.github.io/af-chiapas-web/admin/`
- Inicia sesión con el email/password del paso 4
- Deberías ver el dashboard vacío (sin inscripciones todavía)

## Flujo en producción

```
Estudiante                 Sitio público              Supabase           Panel admin
    │                          │                         │                    │
    │── llena formulario ─────▶│                         │                    │
    │                          │── INSERT inscripciones ▶│                    │
    │                          │   (RLS: anon allowed)   │                    │
    │                          │── EmailJS notifica ─────│──── al admin ─────▶│
    │◀──── confirmación  ──────│                         │                    │
    │      + folio + WhatsApp                            │                    │
    │                                                    │                    │
    │                                                    │◀─── login auth ────│
    │                                                    │── SELECT pendientes│
    │                                                    │── UPDATE estado ──▶│
    │                                                    │   (aprobada/rechazada)
    │                                                    │── trigger bitácora │
```

## Esquema

| Tabla | Propósito | RLS |
|---|---|---|
| `inscripciones` | Preinscripciones del formulario público | `anon` puede INSERT; admin SELECT/UPDATE |
| `perfiles` | Extiende `auth.users` con rol (alumno/docente/coordinacion/admin) | self read + admin read all |
| `inscripciones_bitacora` | Historial automático de cambios de estado | admin read |
| `v_inscripciones_stats` | Vista con conteos para dashboard | admin via tabla base |

## Fase 2B — Grupos, docentes y asignación

Aplica `supabase/schema_phase2b.sql` sobre el esquema base.

### Lo que añade

- `docentes` — perfil profesional vinculado a `auth.users`
- `grupos` — instancias activas de cursos con cupo, fechas, docente y horario
- `inscripciones.grupo_id` — vínculo a grupo asignado al aprobar
- Trigger `tr_grupo_cupo` que mantiene `cupo_actual` automáticamente
- Vista `v_grupos_disponibles` con filtros para el admin

### Crear un docente

```sql
-- 1. Crea el usuario auth en Supabase Studio → Authentication → Add user
-- 2. Inserta su perfil de docente:
insert into public.docentes (id, nombre, email, telefono, niveles_que_imparte, activo)
select id, 'Camille Dupont', email, '+33 ...', array['A1','A2','B1','B2'], true
from auth.users where email = 'camille@alianzafr.edu.mx';
```

### Flujo en el panel

1. Llega una inscripción → estado `pendiente`
2. Admin abre el modal → ve datos completos
3. Sistema muestra **grupos compatibles** (mismo curso, nivel, formato, ritmo, sede, con cupo)
4. Admin selecciona grupo existente **o** crea uno nuevo desde el mismo modal
5. Click **Aprobar y asignar** → `inscripcion.estado = 'aprobada'`, `grupo_id` asignado, `cupo_actual` se incrementa automáticamente

## Fase 3 — Portal del alumno

Aplica `supabase/schema_phase3.sql` sobre los esquemas anteriores.

### Lo que añade

- Función `consulta_inscripcion(folio, email)` con `security definer` que devuelve
  el estado completo (incluyendo grupo, docente y horario si está aprobada) **sólo**
  si el binomio folio + email coincide.
- Sin necesidad de auth de alumno — el folio + email son la prueba de identidad.
- Disponible públicamente en `/portal/` (link en la nav principal: "Mi solicitud").

### Mensajes contextuales por estado

| Estado | Mensaje al alumno |
|---|---|
| `pendiente` | "En cola para validación. Máximo 48 h hábiles." |
| `en_revision` | "Está siendo revisada. Pronto te contactaremos." |
| `aprobada` con grupo | "¡Felicidades! Estás asignado/a a tu grupo." |
| `aprobada` sin grupo | "Aprobada. Estamos asignándote grupo." |
| `rechazada` | Muestra `notas_admin` + invita a contactar por WhatsApp. |
| `cancelada` | "Cancelada. Escríbenos para reactivar." |

## Fase 4 — Notificaciones email automáticas

Edge Function en Deno + Resend. Ver guía detallada en `supabase/functions/README.md`.

**Flujo**: admin cambia estado → Database Webhook → Edge Function → Resend → correo al estudiante (+ CC a coordinación) con template específico por estado (en_revision / aprobada / rechazada / cancelada).

## Fase 3B — Portal del docente

Aplica `supabase/schema_phase3b.sql` sobre todo lo anterior.

### Lo que añade

- Función `es_docente()` — helper de RLS
- Policy: docente lee `inscripciones` aprobadas asignadas a sus propios grupos
- Vista `v_mis_grupos` — grupos del docente + conteo de alumnos
- Vista `v_mis_alumnos` — alumnos aprobados de mis grupos

### Vista del docente

`portal/docente.html` — login con email/password (debe estar dado de alta en `docentes`).
Muestra cards de sus grupos, click → tabla de alumnos con email, teléfono y botón WhatsApp con mensaje pre-rellenado del docente al alumno.

## Costo

Free tier de Supabase cubre:
- 500 MB de base de datos
- 1 GB de storage
- 50 000 usuarios autenticados mensuales
- 5 GB de transferencia de salida

Más que suficiente para el primer año de operación.
