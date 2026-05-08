const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY

const SESSION_TIMEOUT = 30 * 60 * 1000 // 30分钟

function getVisitorId() {
  let id = localStorage.getItem('tg_vid')
  if (!id) { id = crypto.randomUUID(); localStorage.setItem('tg_vid', id) }
  return id
}

function getSessionId() {
  const now = Date.now()
  const last = parseInt(localStorage.getItem('tg_slast') || '0')
  let sid = localStorage.getItem('tg_sid')
  if (!sid || now - last > SESSION_TIMEOUT) {
    sid = crypto.randomUUID()
    localStorage.setItem('tg_sid', sid)
  }
  localStorage.setItem('tg_slast', String(now))
  return sid
}

export function trackEvent(eventType, payload = {}) {
  if (!SUPABASE_URL || !SUPABASE_ANON_KEY) return
  const body = {
    event_type: eventType,
    target_id: payload.tool_slug || payload.report_id || payload.page_path || null,
    target_name: payload.tool_name || payload.report_title || payload.page_path || null,
    profession: payload.profession || null,
    search_query: payload.search_query || null,
    visitor_id: getVisitorId(),
    session_id: getSessionId(),
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
