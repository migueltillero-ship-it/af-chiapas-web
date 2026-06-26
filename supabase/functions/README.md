# Edge Functions — Fase 4

## `notificar-cambio-estado`

Envía un correo automático al estudiante cuando el admin cambia el `estado` de su `inscripcion`.

### Templates por estado

| Estado nuevo | Mensaje al alumno |
|---|---|
| `en_revision` | "Tu solicitud está siendo revisada" |
| `aprobada` | "¡Felicidades! Aprobada + datos del grupo + próximos pasos" |
| `rechazada` | Muestra `notas_admin` + invita WhatsApp |
| `cancelada` | Invita a reactivar por WhatsApp |

Todos incluyen un bloque CTA con botón al portal del alumno y a WhatsApp.

## Setup en 5 pasos

### 1. Cuenta en Resend
[resend.com](https://resend.com) — free tier 100 emails/día, 3000/mes.

- Crear cuenta y verificar dominio (o usar `onboarding@resend.dev` para pruebas)
- Generar API key

### 2. Instalar Supabase CLI

```bash
# macOS
brew install supabase/tap/supabase

# Linux/Windows: https://supabase.com/docs/guides/cli
```

### 3. Login + link al proyecto

```bash
supabase login
supabase link --project-ref TU_PROJECT_REF
```

### 4. Configurar secretos

Supabase Studio → **Edge Functions → Manage secrets**, o por CLI:

```bash
supabase secrets set \
  RESEND_API_KEY="re_..." \
  FROM_EMAIL="Alliance Française SCLC <hola@tu-dominio.com>" \
  ADMIN_EMAIL="afsancris@gmail.com" \
  SITE_URL="https://migueltillero-ship-it.github.io/af-chiapas-web"
```

### 5. Deploy

```bash
supabase functions deploy notificar-cambio-estado
```

## Configurar el Database Webhook

Supabase Studio → **Database → Webhooks** → **Create a new hook**:

| Campo | Valor |
|---|---|
| Name | `inscripcion_cambio_estado` |
| Table | `inscripciones` |
| Events | ✅ UPDATE |
| Type | Supabase Edge Functions |
| Edge Function | `notificar-cambio-estado` |
| HTTP method | POST |
| HTTP headers | (los pone Supabase) |

Guarda. A partir de aquí, cada cambio de estado en una inscripción disparará el envío del correo correspondiente.

## Probar localmente

```bash
supabase functions serve notificar-cambio-estado --env-file ./supabase/.env.local
```

Y manda un POST de prueba:

```bash
curl -X POST http://localhost:54321/functions/v1/notificar-cambio-estado \
  -H "Content-Type: application/json" \
  -d '{
    "type":"UPDATE",
    "table":"inscripciones",
    "schema":"public",
    "record":{"id":"...","folio":"AF-260101-DEMO","nombre":"Ejemplo Demo","email":"tu@email.com","telefono":"+52...","estado":"aprobada","sede":"virtual","curso_id":"adultos","curso_nombre":"Adultos","grupo_id":null,"nivel":"B1","formato":"grupal","ritmo":"intensivo","notas_admin":null},
    "old_record":{"estado":"pendiente"}
  }'
```

## Costos

- **Resend**: free tier 100/día, 3000/mes (más que suficiente).
- **Supabase Edge Functions**: free tier 500K invocaciones/mes.
