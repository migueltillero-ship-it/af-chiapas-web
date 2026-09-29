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
- **Intro de marca** — el video institucional se reproduce al entrar y se cierra
  solo al terminar; botón «Saltar», tecla Escape y red de seguridad a los 12 s.
  Se omite con `prefers-reduced-motion`
- **Música de fondo** — arranca al cerrarse el intro, con control para silenciar
  que recuerda la preferencia. Si el navegador bloquea el autoplay, espera al
  primer gesto del visitante
- Hero editorial estilo campaña (Bebas Neue + acentos verticales)
- **Campaña de relanzamiento** — cuenta regresiva en vivo al arranque del ciclo,
  onboarding en 4 pasos, argumentario de virtualidad, calendario de los 6 ciclos
  y promociones de rentrée
- **Aviso de preparación** — la AF SCLC prepara para DELF/DALF; la aplicación del
  examen y la emisión del diploma corresponden al centro evaluador acreditado
- Sección Plataforma Virtual (aulas en vivo, gamificación)
- Proceso automatizado en 4 pasos
- Catálogo de cursos con color por segmento + badge "Ciclo · 6 sem · X h"
- Galería de campañas con los 5 carteles oficiales
- **Anatomía del ciclo** de 6 semanas con horas por ritmo
- Movilité (CAVILAM Vichy + Campus France)
- Preparación oficial DELF/DALF + TCF/TEF/DFP
- Presentación institucional (Google Slides embed)
- Agenda cultural + Mapa Google + Federación México
- **Flujo de preinscripción inmersivo** en 4 pasos con:
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
- Tabs: Inscripciones · Grupos · **Cursos del ciclo** · Docentes · **Finanzas** · Eventos · Catálogo
- Modal de aprobación con:
  - Datos completos del estudiante
  - Notas internas
  - **Dropdown de grupos compatibles** (mismo curso/nivel/formato/ritmo/sede + cupo > 0)
  - Botón **"Crear grupo nuevo"** inline
  - Aprobar → asigna grupo → cupo se incrementa por trigger
- Bitácora automática de cambios de estado
- Realtime: cualquier nueva inscripción aparece sin recargar
- **Cursos del ciclo** — tarjeta por grupo activo con número de alumnos y cobros
  pendientes; clic abre el detalle: lista de alumnos con % de asistencia y estado
  de pago, registro de sesiones y marcado de asistencia por sesión (mismo
  mecanismo que el portal del docente, disponible también para coordinación)
- **Finanzas** — ingresos cobrados, pendiente de cobro, egresos y balance neto;
  registro manual de pagos y egresos (ej. nómina docente); reportes de ingresos
  por curso y balance por docente, exportables a CSV

## Estructura

El sitio público es un proyecto Jekyll: `_config.yml`, `Gemfile`, `_layouts/`
y las 7 páginas `.html` de nivel superior tienen que quedarse en la raíz —
es la convención que Jekyll y GitHub Pages exigen para generar las URLs y
aplicar el layout común. Todo lo demás sí está organizado por dominio:

```
.
├── .github/workflows/         # CI/CD (validate.yml, e2e.yml, deploy.yml)
├── _config.yml, Gemfile*      # Config de Jekyll
├── _layouts/default.html      # Layout único que envuelve las 7 páginas
├── _includes/                 # head-meta, nav, footer, banners, wa-fab
├── index.html                 # + cursos-niveles, docentes, preinscripcion,
│                               #   vida-af, preguntas-frecuentes,
│                               #   historia-contacto (las 7 páginas públicas)
├── manifest.webmanifest, sw.js, robots.txt, sitemap.xml
├── assets/
│   ├── css/main.css           # Un solo stylesheet, compartido por las 7 páginas
│   └── js/site.js             # Toda la lógica de cliente del sitio público
├── admin/index.html           # Panel de coordinación (8 tabs)
├── portal/
│   ├── index.html             # Consulta rápida del alumno (folio + correo)
│   ├── mi-espacio.html        # Portal del alumno con cuenta propia
│   ├── docente.html           # Portal del docente
│   └── restablecer-contrasena.html  # Olvidé mi contraseña (alumno/docente/admin)
├── supabase/
│   ├── schema.sql, schema_phase2b.sql … schema_phase13.sql
│   │                          # Un archivo por fase, aplicados en ese orden
│   ├── functions/             # Edge Functions: crear-checkout, stripe-webhook,
│   │                          #   notificar-cambio-estado, _shared/
│   └── README.md              # Guía de instalación y activación por fase
├── src/
│   ├── assets/
│   │   ├── brand/              # Logos e íconos oficiales
│   │   ├── img/posters/        # Carteles · WebP + PNG
│   │   ├── data/                # JSON de catálogo, FAQ, eventos (respaldo)
│   │   └── media/
│   └── config/supabase.js      # Credenciales públicas (anon/publishable key)
├── scripts/python/              # generar_catalogo.py, generar_instalacion.py
└── tests/e2e/                   # 49 pruebas Playwright (una spec por feature)
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

### 4. Cambiar la fecha oficial
La fecha vive en `index.html`:

```js
const AF_INICIO_CICLO = new Date('2026-09-21T09:00:00-06:00'); // primer día de clases
```

- `AF_INICIO_CICLO` alimenta la cuenta regresiva. Si cambia, ajusta también la
  tabla de `#calendario` y el `startDate`/`endDate` del JSON-LD.
- También gobierna el aviso «Inscripciones abiertas ahora», que **se retira
  solo** al arrancar el ciclo (ya no tiene sentido invitar a preinscribirse
  una vez que las clases empezaron).

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
- [x] Fase 4: Notificaciones email automáticas al cambiar estado (Supabase Edge Functions)
- [x] Fase 5: Eventos editables desde admin (CMS-like)
- [x] Fase 6: Catálogo de cursos editable desde admin
- [x] Fase 7: Sesiones y asistencias (portal del docente)
- [x] Fase 9: Pagos en línea (Stripe) — activo y verificado en modo test (admin genera el link, el alumno paga desde `/portal/mi-espacio.html`, el webhook confirma el cobro solo); ver `supabase/README.md` para pasar a modo live
- [x] Fase 10: Cursos del ciclo (roster + asistencia desde admin) y Finanzas (egresos + reportes)
- [x] Recuperación de contraseña autoservicio (alumno, docente y coordinación) — ver `supabase/README.md` para el paso de configuración de URLs en Supabase Auth
- [ ] Fase 11: App móvil nativa (Capacitor o PWA installable mejorada)

## Contacto

Alliance Française San Cristóbal es 100% virtual, sin sede física (el espacio presencial que se usaba antes se cerró).

- 📧 afsancris@gmail.com
- 📱 WhatsApp +52 1 967 172 1870

---

*La primera Alliance Française virtual de México · Ref. AF-SCLC-2026-001*
