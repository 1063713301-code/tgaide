const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY

export function trackEvent(eventType, payload = {}) {
  if (!SUPABASE_URL || !SUPABASE_ANON_KEY) return
  const body = {
    event_type: eventType,
    target_id: payload.tool_slug || payload.report_id || payload.page_path || null,
    target_name: payload.tool_name || payload.report_title || payload.page_path || null,
    profession: payload.profession || null,
    search_query: payload.search_query || null,
  }
  fetch(`${SUPABASE_URL}/rest/v1/analytics_events`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      apikey: SUPABASE_ANON_KEY,
      Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
      Prefer: 'return=minimal',
    },
    body: JSON.stringify(body),
  }).catch(() => {})
}
