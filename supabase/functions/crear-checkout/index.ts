// ────────────────────────────────────────────────────────────────────────────
// Edge Function: crear-checkout
// La invoca el admin (para generar un link de cobro) o el propio alumno
// autenticado en /portal/mi-espacio.html (para pagar su propia colegiatura).
// Crea una sesión de Stripe Checkout y guarda checkout_url en la tabla pagos.
//
// Autorización: requiere un JWT válido de Supabase Auth (Authorization: Bearer
// <access_token>). El llamante debe ser admin/coordinación, o el alumno dueño
// del pago (su email de auth coincide con inscripciones.email). Cualquier otro
// caso se rechaza con 403 — esto evita que se puedan generar sesiones de Stripe
// para pagos ajenos con solo adivinar un pago_id.
//
// Variables de entorno requeridas:
//   STRIPE_SECRET_KEY   → sk_test_... o sk_live_...
//   SUPABASE_URL
//   SUPABASE_ANON_KEY          (lo provee Supabase automáticamente al deploy)
//   SUPABASE_SERVICE_ROLE_KEY  (lo provee Supabase automáticamente al deploy)
//   SITE_URL                   → para success_url y cancel_url
// ────────────────────────────────────────────────────────────────────────────

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { corsHeaders } from '../_shared/cors.ts';

interface Req { pago_id: string }

const STRIPE_KEY = Deno.env.get('STRIPE_SECRET_KEY') ?? '';
const SUPA_URL   = Deno.env.get('SUPABASE_URL') ?? '';
const SUPA_ANON  = Deno.env.get('SUPABASE_ANON_KEY') ?? '';
const SUPA_SRK   = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '';
const SITE_URL   = Deno.env.get('SITE_URL') ?? 'https://migueltillero-ship-it.github.io/af-chiapas-web';

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });

  try {
    const { pago_id } = await req.json() as Req;
    if (!pago_id) return bad('pago_id requerido', 400);
    if (!STRIPE_KEY) return bad('STRIPE_SECRET_KEY no configurada en secrets', 500);

    const jwt = (req.headers.get('Authorization') || '').replace(/^Bearer\s+/i, '');
    if (!jwt) return bad('No autenticado', 401);

    const sbAuth = createClient(SUPA_URL, SUPA_ANON);
    const { data: userData, error: userErr } = await sbAuth.auth.getUser(jwt);
    if (userErr || !userData?.user) return bad('Sesión inválida o expirada', 401);
    const callerId    = userData.user.id;
    const callerEmail = (userData.user.email || '').toLowerCase().trim();

    const sb = createClient(SUPA_URL, SUPA_SRK, { auth: { persistSession: false } });

    const { data: pago, error: pErr } = await sb
      .from('pagos').select('*, inscripciones(folio, nombre, email)')
      .eq('id', pago_id).single();
    if (pErr || !pago) return bad('Pago no encontrado: ' + pErr?.message, 404);

    const insc = (pago as any).inscripciones;

    const { data: perfil } = await sb.from('perfiles').select('rol').eq('id', callerId).maybeSingle();
    const esStaff = perfil?.rol === 'admin' || perfil?.rol === 'coordinacion';
    const esDueno = callerEmail && callerEmail === (insc?.email || '').toLowerCase().trim();
    if (!esStaff && !esDueno) return bad('No autorizado para generar el cobro de este pago', 403);

    if (pago.estado === 'pagado') return bad('Este pago ya fue cobrado', 409);

    const form = new URLSearchParams();
    form.append('mode', 'payment');
    form.append('payment_method_types[0]', 'card');
    form.append('customer_email', insc.email);
    form.append('client_reference_id', pago_id);
    form.append('success_url', `${SITE_URL}/portal/?folio=${encodeURIComponent(insc.folio)}&pago=ok`);
    form.append('cancel_url',  `${SITE_URL}/portal/?folio=${encodeURIComponent(insc.folio)}&pago=cancel`);
    form.append('line_items[0][price_data][currency]', (pago.moneda || 'MXN').toLowerCase());
    form.append('line_items[0][price_data][product_data][name]', pago.concepto || `Inscripción ${insc.folio}`);
    form.append('line_items[0][price_data][product_data][description]', `Alliance Française SCLC · ${insc.nombre}`);
    form.append('line_items[0][price_data][unit_amount]', Math.round(Number(pago.monto) * 100).toString());
    form.append('line_items[0][quantity]', '1');
    form.append('metadata[pago_id]', pago_id);
    form.append('metadata[folio]', insc.folio);

    const r = await fetch('https://api.stripe.com/v1/checkout/sessions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${STRIPE_KEY}`,
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: form,
    });
    const session = await r.json();
    if (!r.ok) return bad('Stripe error: ' + JSON.stringify(session), 502);

    await sb.from('pagos').update({
      stripe_session_id: session.id,
      checkout_url: session.url,
      estado: 'procesando',
    }).eq('id', pago_id);

    return ok({ url: session.url, session_id: session.id });
  } catch (err) {
    console.error(err);
    return bad(String(err?.message ?? err), 500);
  }
});

function ok(body: unknown) {
  return new Response(JSON.stringify(body), { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
}
function bad(msg: string, status: number) {
  return new Response(JSON.stringify({ error: msg }), { status, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
}
