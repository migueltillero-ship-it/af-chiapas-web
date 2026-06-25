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

## Costo

Free tier de Supabase cubre:
- 500 MB de base de datos
- 1 GB de storage
- 50 000 usuarios autenticados mensuales
- 5 GB de transferencia de salida

Más que suficiente para el primer año de operación.
