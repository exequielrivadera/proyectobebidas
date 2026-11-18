// Cliente Supabase compartido por catálogo y panel.
// Requiere supabase-js v2 cargado antes de este archivo.
(() => {
  const config = window.SUPABASE_CONFIG;
  if (!config || !window.supabase?.createClient) {
    console.error('No se pudo iniciar Supabase. Revisá supabase-config.js y la librería supabase-js.');
    return;
  }
  window.supabaseClient = window.supabase.createClient(config.url, config.publishableKey, {
    auth: { persistSession: true, autoRefreshToken: true, detectSessionInUrl: true }
  });
})();
