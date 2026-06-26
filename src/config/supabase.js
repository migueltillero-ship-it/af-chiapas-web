// ─────────────────────────────────────────────────────────────────
// Configuración del cliente Supabase
//
// Rellena con tus credenciales (Settings → API en Supabase Studio):
//   - SUPABASE_URL  → "Project URL"
//   - SUPABASE_ANON → "anon public" key (NUNCA la service_role)
//
// Estas dos son PÚBLICAS y seguras de exponer en el frontend
// porque la base está protegida por Row Level Security (ver schema.sql).
//
// Mientras los valores sean los placeholders ("REEMPLAZA_*"), el sitio
// sigue funcionando con EmailJS como hasta ahora — la integración con
// Supabase es opt-in.
// ─────────────────────────────────────────────────────────────────

window.AF_CONFIG = window.AF_CONFIG || {};
window.AF_CONFIG.supabase = {
  url:      'REEMPLAZA_SUPABASE_URL',
  anonKey:  'REEMPLAZA_SUPABASE_ANON_KEY'
};

window.AF_CONFIG.isSupabaseConfigured = function(){
  const s = window.AF_CONFIG.supabase;
  return s && s.url && s.anonKey &&
         !s.url.startsWith('REEMPLAZA_') &&
         !s.anonKey.startsWith('REEMPLAZA_');
};
