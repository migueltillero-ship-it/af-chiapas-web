# Alliance Française San Cristóbal · AF Virtual

Sitio oficial y plataforma de gestión académica de la Alliance Française San Cristóbal de Las Casas — la primera **AF 100% virtual de México**.

🌐 **En producción:** https://migueltillero-ship-it.github.io/af-chiapas-web/

---

## Arquitectura

```
┌─────────────────────────────────────────────────────────────────┐
│  FRONTEND ESTÁTICO  (HTML/CSS/JS vanilla, sin build step)       │
│                                                                  │
│  /                  Sitio público + formulario de inscripción   │
│  /portal/           Portal del alumno (consulta de estado)      │
│  /portal/docente.html  Portal del docente (sus grupos+alumnos)  │
│  /admin/            Panel administrativo (validación + grupos)  │
└────────────────────────────┬────────────────────────────────────┘
                             │
                             ▼
┌─────────────────────────────────────────────────────────────────┐
│  BACKEND (Supabase: Postgres + Auth + Realtime + RLS)            │
│                                                                  │
│  Tablas: inscripciones, perfiles, docentes, grupos,              │
│          inscripciones_bitacora                                  │
│  Vistas: v_grupos_disponibles, v_mis_grupos, v_mis_alumnos      │
│  RPC:    consulta_inscripcion (lookup por folio+email)           │
└─────────────────────────────────────────────────────────────────┘
                             │
                             ▼
                ┌────────────────────────────┐
                │  EmailJS (notificaciones)   │
                │  → afsancris@gmail.com      │
                └────────────────────────────┘
```

## Stack

- **Frontend**: HTML/CSS/JS vanilla, sin frameworks ni build
- **Tipografías**: Bebas Neue, Cormorant Garamond, Syne, Space Mono
- **Iconos**: Font Awesome 6
- **Backend**: Supabase (Postgres + Auth + Realtime + RLS)
- **Email transaccional**: EmailJS
- **Imágenes**: WebP (con fallback PNG)
- **Hosting**: GitHub Pages

## Funcionalidades implementadas

### Sitio público
- Hero editorial estilo campaña (Bebas Neue + acentos verticales)
- Sección Plataforma Virtual (aulas en vivo, tutor IA, gamificación)
- Proceso automatizado en 4 pasos
- Catálogo de cursos con color por segmento + badge "Ciclo · 6 sem · X h"
- Galería de campañas con los 5 carteles oficiales
- **Anatomía del ciclo** de 6 semanas con horas por ritmo
- Movilité (CAVILAM Vichy + Campus France)
- Preparación oficial DELF/DALF + TCF/TEF/DFP
- Presentación institucional (Google Slides embed)
- Agenda cultural + Mapa Google + Federación México
- **Flujo de preinscripción inmersivo** en 3 pasos con:
  - Bienvenida cálida
  - Programa + nivel + formato (individual/grupal) + ritmo (regular/intensivo/super/sabatino)
  - Resumen con costos + horarios diferidos + promesa de 48h
  - Confirmación con folio + WhatsApp pre-rellenado
- CTAs WhatsApp contextuales en cada sección + FAB con pulse
- PWA installable

### Portal del alumno (`/portal/`)
- Consulta de estado por folio + email (sin necesidad de auth)
- Vista personalizada con:
  - Mensaje contextual según estado (pendiente / en revisión / aprobada / rechazada)
  - Tarjeta destacada con grupo asignado (código, docente, inicio, horario)
  - Botón WhatsApp con datos pre-rellenados

### Portal del docente (`/portal/docente.html`)
- Login Supabase Auth (email + password)
- Cards de sus grupos con cupo, horario, inicio
- Click → tabla de alumnos del grupo
- Botón WhatsApp con mensaje pre-rellenado del docente al alumno

### Panel administrativo (`/admin/`)
- Login Supabase Auth (sólo rol `coordinacion` o `admin`)
- Dashboard con stat cards por estado (realtime)
- Tabs: Inscripciones · Grupos · Docentes
- Modal de aprobación con:
  - Datos completos del estudiante
  - Notas internas
  - **Dropdown de grupos compatibles** (mismo curso/nivel/formato/ritmo/sede + cupo > 0)
  - Botón **"Crear grupo nuevo"** inline
  - Aprobar → asigna grupo → cupo se incrementa por trigger
- Bitácora automática de cambios de estado
- Realtime: cualquier nueva inscripción aparece sin recargar

## Estructura

```
.
├── .github/workflows/      # CI/CD (deploy + validación)
├── index.html              # Sitio público
├── manifest.webmanifest    # PWA
├── robots.txt + sitemap.xml
├── admin/index.html        # Panel administrativo
├── portal/
│   ├── index.html          # Consulta del alumno
│   └── docente.html        # Portal del docente
├── supabase/
│   ├── schema.sql          # Fase 2A: inscripciones + perfiles
│   ├── schema_phase2b.sql  # Fase 2B: docentes + grupos
│   ├── schema_phase3.sql   # Fase 3:  consulta_inscripcion RPC
│   ├── schema_phase3b.sql  # Fase 3B: policies docente
│   └── README.md
├── src/
│   ├── assets/
│   │   ├── brand/logo-af-sancristobal.png
│   │   ├── img/posters/    # 5 carteles · WebP + PNG
│   │   ├── data/           # JSON catalog (cursos, FAQ, etc.)
│   │   └── media/
│   └── config/
│       └── supabase.js     # Credenciales públicas (RELLENAR)
└── scripts/python/         # Generador de catálogo
```

## Setup inicial (para desplegar tu propio fork)

### 1. Activar GitHub Pages
Settings → Pages → Source: **GitHub Actions** (lo usa el workflow `deploy.yml`)

### 2. Crear proyecto Supabase
Sigue `supabase/README.md`:
- Crear proyecto en supabase.com
- Aplicar `schema.sql` → `schema_phase2b.sql` → `schema_phase3.sql` → `schema_phase3b.sql` en orden
- Copiar `Project URL` y `anon key` a `src/config/supabase.js`
- Crear usuario admin en Authentication
- `INSERT INTO perfiles (id, nombre, rol) VALUES (...)`

### 3. EmailJS (notificaciones)
Las credenciales ya están en `index.html` apuntando a `service_9wtrch3 / template_dtddfpk`. El template debe usar `{{to_email}} = afsancris@gmail.com` y los demás campos del payload.

## Desarrollo local

```bash
python3 -m http.server 8080
# Abrir http://localhost:8080
```

## Tests / CI

GitHub Actions corre en cada push a `main` y en cada PR:
- **`validate.yml`** — valida sintaxis JSON, balance de etiquetas HTML, SQL básico
- **`deploy.yml`** — despliega a GitHub Pages al hacer push a `main`

## Roadmap

- [x] Fase 1: Rebrand + saneamiento
- [x] Fase 2A: Supabase + panel admin (validación)
- [x] Fase 2B: Grupos + docentes + asignación automática
- [x] Fase 3: Portal del alumno
- [x] Fase 3B: Portal del docente
- [ ] Fase 4: Notificaciones email automáticas al cambiar estado (Supabase Edge Functions)
- [ ] Fase 5: Eventos editables desde admin (CMS-like)
- [ ] Fase 6: Pagos en línea (Stripe / MercadoPago)
- [ ] Fase 7: App móvil nativa (Capacitor o PWA installable mejorada)

## Contacto

- 📍 Av. La Almolonga 80, Barrio Santa Lucía, San Cristóbal de Las Casas
- 📧 direccionsancristobal@alianzafr.edu.mx · afsancris@gmail.com
- 📱 +52 967 342 44 56 · WhatsApp +52 967 172 1870

---

*La primera Alliance Française virtual de México · Ref. AF-SCLC-2026-001*
