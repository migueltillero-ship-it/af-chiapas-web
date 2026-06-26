// ────────────────────────────────────────────────────────────────────────────
// Alliance Française San Cristóbal · Edge Function
// notificar-cambio-estado
//
// Se invoca desde un Database Webhook configurado en
// Supabase Studio → Database → Webhooks sobre la tabla `inscripciones`
// (eventos UPDATE). Cuando cambia `estado`, envía un correo al estudiante
// con el template correspondiente.
//
// Variables de entorno (Supabase Studio → Edge Functions → Secrets):
//   RESEND_API_KEY    → tu API key de Resend (https://resend.com)
//   FROM_EMAIL        → "Alliance Française SCLC <hola@tu-dominio.com>"
//   ADMIN_EMAIL       → correo CC para coordinación (afsancris@gmail.com)
//   SITE_URL          → https://migueltillero-ship-it.github.io/af-chiapas-web
// ────────────────────────────────────────────────────────────────────────────

import { corsHeaders } from '../_shared/cors.ts';

interface WebhookPayload {
  type: 'INSERT' | 'UPDATE' | 'DELETE';
  table: string;
  schema: string;
  record: Inscripcion;
  old_record: Inscripcion | null;
}

interface Inscripcion {
  id: string;
  folio: string;
  nombre: string;
  email: string;
  telefono: string;
  estado: 'pendiente' | 'en_revision' | 'aprobada' | 'rechazada' | 'cancelada';
  sede: 'virtual' | 'scsc';
  curso_id: string;
  curso_nombre: string | null;
  nivel: string | null;
  formato: string | null;
  ritmo: string | null;
  grupo_id: string | null;
  notas_admin: string | null;
}

const RESEND_API_KEY = Deno.env.get('RESEND_API_KEY') ?? '';
const FROM_EMAIL     = Deno.env.get('FROM_EMAIL') ?? 'Alliance Française SCLC <onboarding@resend.dev>';
const ADMIN_EMAIL    = Deno.env.get('ADMIN_EMAIL') ?? 'afsancris@gmail.com';
const SITE_URL       = Deno.env.get('SITE_URL') ?? 'https://migueltillero-ship-it.github.io/af-chiapas-web';

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });

  try {
    const payload = await req.json() as WebhookPayload;

    if (payload.type !== 'UPDATE') {
      return ok({ skipped: 'no-update', type: payload.type });
    }
    if (payload.record.estado === payload.old_record?.estado) {
      return ok({ skipped: 'no-state-change' });
    }

    const r = payload.record;
    const tpl = template(r);
    if (!tpl) return ok({ skipped: 'no-template-for-state', estado: r.estado });

    const result = await sendEmail({
      to: r.email,
      cc: ADMIN_EMAIL,
      subject: tpl.subject,
      html: tpl.html,
    });

    return ok({ sent: true, to: r.email, estado: r.estado, resend: result });
  } catch (err) {
    console.error('[notificar-cambio-estado]', err);
    return new Response(JSON.stringify({ error: String(err?.message ?? err) }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});

function ok(body: unknown) {
  return new Response(JSON.stringify(body), {
    status: 200,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
}

async function sendEmail({ to, cc, subject, html }: {
  to: string; cc?: string; subject: string; html: string;
}) {
  if (!RESEND_API_KEY) {
    console.warn('[email] RESEND_API_KEY no configurada — solo log');
    return { mocked: true, subject, to };
  }
  const r = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${RESEND_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ from: FROM_EMAIL, to, cc, subject, html }),
  });
  return await r.json();
}

// ─────────────────────────── Templates ──────────────────────────
function template(i: Inscripcion): { subject: string; html: string } | null {
  const firstName = i.nombre.split(/\s+/)[0];
  const sede = i.sede === 'virtual' ? 'AF Virtual' : 'San Cristóbal de Las Casas';
  const curso = i.curso_nombre || i.curso_id;

  switch (i.estado) {
    case 'en_revision':
      return {
        subject: `Tu solicitud está siendo revisada · folio ${i.folio}`,
        html: layout(`
          <h1>Hola ${esc(firstName)},</h1>
          <p>Buenas noticias: tu solicitud de preinscripción <strong>${esc(i.folio)}</strong> está siendo revisada por nuestro equipo de coordinación.</p>
          <p>Te contactaremos muy pronto con los siguientes pasos. Si tienes preguntas urgentes, escríbenos por WhatsApp.</p>
          ${ctaBlock(i)}
        `),
      };

    case 'aprobada':
      return {
        subject: i.grupo_id
          ? `¡Tu solicitud fue aprobada y estás asignado/a a tu grupo! · folio ${i.folio}`
          : `Tu solicitud fue aprobada · folio ${i.folio}`,
        html: layout(`
          <h1>¡Felicidades, ${esc(firstName)}!</h1>
          <p>Tu solicitud para <strong>${esc(curso)}</strong> en <strong>${esc(sede)}</strong> fue <strong style="color:#22c55e">aprobada</strong>.</p>
          <table style="width:100%;border-collapse:collapse;margin:1.5rem 0;font-size:14px">
            <tr><td style="padding:.4rem 0;color:#888">Folio</td><td style="font-weight:600">${esc(i.folio)}</td></tr>
            <tr><td style="padding:.4rem 0;color:#888">Programa</td><td style="font-weight:600">${esc(curso)}</td></tr>
            ${i.nivel    ? `<tr><td style="padding:.4rem 0;color:#888">Nivel</td><td style="font-weight:600">${esc(i.nivel)}</td></tr>` : ''}
            ${i.formato  ? `<tr><td style="padding:.4rem 0;color:#888">Formato</td><td style="font-weight:600">${esc(i.formato)}</td></tr>` : ''}
            ${i.ritmo    ? `<tr><td style="padding:.4rem 0;color:#888">Ritmo</td><td style="font-weight:600">${esc(i.ritmo)}</td></tr>` : ''}
          </table>
          ${i.grupo_id
            ? `<p>Tu grupo está asignado. Consulta los detalles (código, docente, inicio y horario) en tu portal del alumno.</p>`
            : `<p>Estamos terminando de asignarte un grupo y te enviaremos los detalles muy pronto.</p>`}
          <p><strong>Próximos pasos:</strong></p>
          <ol>
            <li>Recibirás el desglose de tarifas y datos de pago en otro correo.</li>
            <li>Una vez confirmado el pago, recibirás los accesos a la plataforma.</li>
            <li>¡Empezamos en la fecha de inicio de tu ciclo!</li>
          </ol>
          ${ctaBlock(i)}
        `),
      };

    case 'rechazada':
      return {
        subject: `Actualización sobre tu solicitud · folio ${i.folio}`,
        html: layout(`
          <h1>Hola ${esc(firstName)},</h1>
          <p>Recibimos tu solicitud <strong>${esc(i.folio)}</strong> y, lamentablemente, no podemos procesarla en este momento.</p>
          ${i.notas_admin ? `<blockquote style="border-left:3px solid #d42b3a;padding-left:1rem;margin:1rem 0;color:#555">${esc(i.notas_admin)}</blockquote>` : ''}
          <p>Escríbenos por WhatsApp para entender las opciones disponibles — quizá podamos sugerirte una alternativa.</p>
          ${ctaBlock(i)}
        `),
      };

    case 'cancelada':
      return {
        subject: `Tu solicitud fue cancelada · folio ${i.folio}`,
        html: layout(`
          <h1>Hola ${esc(firstName)},</h1>
          <p>Tu solicitud <strong>${esc(i.folio)}</strong> fue marcada como cancelada.</p>
          <p>Si esto es un error o quieres reactivarla, escríbenos por WhatsApp y te apoyamos.</p>
          ${ctaBlock(i)}
        `),
      };

    default:
      return null;
  }
}

function layout(inner: string): string {
  return `<!doctype html>
<html lang="es"><head><meta charset="utf-8"><title>Alliance Française SCLC</title></head>
<body style="margin:0;background:#f5f3ee;font-family:-apple-system,BlinkMacSystemFont,Segoe UI,Roboto,sans-serif;color:#1a1a1a">
  <div style="max-width:560px;margin:0 auto;padding:2rem 1.5rem">
    <div style="background:#07111d;padding:1.25rem 1.5rem;border-radius:12px 12px 0 0;color:#fff">
      <p style="margin:0;font-family:Georgia,serif;font-size:18px">Alliance Française <em style="color:#c9a44e">San Cristóbal</em></p>
      <p style="margin:.25rem 0 0;font-family:monospace;font-size:10px;letter-spacing:0.18em;text-transform:uppercase;color:rgba(255,255,255,0.7)">AF Virtual</p>
    </div>
    <div style="background:#fff;padding:2rem 1.5rem;border-radius:0 0 12px 12px;line-height:1.65;font-size:15px">
      ${inner}
      <hr style="border:none;border-top:1px solid #eee;margin:2rem 0">
      <p style="font-size:12px;color:#888;margin:0">
        Alliance Française San Cristóbal de Las Casas · Av. La Almolonga 80, Barrio Santa Lucía<br>
        WhatsApp +52 967 172 1870 · <a href="mailto:afsancris@gmail.com" style="color:#c9a44e">afsancris@gmail.com</a>
      </p>
    </div>
  </div>
</body></html>`;
}

function ctaBlock(i: Inscripcion): string {
  const portal = `${SITE_URL}/portal/`;
  const waMsg  = encodeURIComponent(`Hola, soy ${i.nombre}. Folio ${i.folio}.`);
  const wa     = `https://wa.me/529671721870?text=${waMsg}`;
  return `
    <p style="text-align:center;margin:2rem 0 .5rem">
      <a href="${portal}" style="display:inline-block;background:#c9a44e;color:#07111d;padding:.85rem 1.5rem;border-radius:8px;text-decoration:none;font-weight:600;margin:.25rem">Ver mi solicitud</a>
      <a href="${wa}"    style="display:inline-block;background:#25d366;color:#fff;padding:.85rem 1.5rem;border-radius:8px;text-decoration:none;font-weight:600;margin:.25rem">WhatsApp</a>
    </p>`;
}

function esc(s: string | null): string {
  return String(s ?? '').replace(/[&<>"']/g, (c) =>
    (({ '&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;' } as Record<string,string>)[c]));
}
