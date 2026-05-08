const SUPABASE_URL      = import.meta.env.VITE_SUPABASE_URL
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY
const SESSION_TIMEOUT   = 30 * 60 * 1000

function getVisitorId() {
  let id = localStorage.getItem('tg_vid')
  if (!id) { id = crypto.randomUUID(); localStorage.setItem('tg_vid', id) }
  return id
}

function getSessionId() {
  const now  = Date.now()
  const last = parseInt(localStorage.getItem('tg_slast') || '0')
  let sid    = localStorage.getItem('tg_sid')
  if (!sid || now - last > SESSION_TIMEOUT) {
    sid = crypto.randomUUID()
    localStorage.setItem('tg_sid', sid)
  }
  localStorage.setItem('tg_slast', String(now))
  return sid
}

function detectDevice() {
  const ua = navigator.userAgent
  if (/tablet|ipad|playbook|silk/i.test(ua))                                         return 'tablet'
  if (/mobile|android|iphone|ipod|blackberry|opera mini|iemobile/i.test(ua))         return 'mobile'
  return 'desktop'
}

function detectBrowser() {
  const ua = navigator.userAgent
  if (/edg\//i.test(ua))                                  return 'Edge'
  if (/chrome/i.test(ua) && !/chromium/i.test(ua))        return 'Chrome'
  if (/firefox/i.test(ua))                                 return 'Firefox'
  if (/safari/i.test(ua) && !/chrome/i.test(ua))          return 'Safari'
  if (/opr\//i.test(ua))                                   return 'Opera'
  return 'Other'
}

function classifyChannel(ref) {
  if (!ref) return 'direct'
  if (/google|bing|baidu|sogou|360\.cn|shenma|yandex/i.test(ref))                          return 'search'
  if (/weibo|wechat|facebook|twitter|instagram|tiktok|douyin|xiaohongshu|zhihu|bilibili/i.test(ref)) return 'social'
  return 'referral'
}

function post(body) {
  if (!SUPABASE_URL || !SUPABASE_ANON_KEY) return
  fetch(`${SUPABASE_URL}/rest/v1/analytics_events`, {
    method:  'POST',
    headers: {
      'Content-Type': 'application/json',
      apikey:         SUPABASE_ANON_KEY,
      Authorization:  `Bearer ${SUPABASE_ANON_KEY}`,
      Prefer:         'return=minimal',
    },
    body: JSON.stringify(body),
  }).catch(() => {})
}

export function trackEvent(eventType, payload = {}) {
  const isPV   = eventType === 'page_view'
  const ref    = document.referrer || null
  post({
    event_type:  eventType,
    target_id:   payload.tool_slug   || payload.report_id   || payload.page_path || null,
    target_name: payload.tool_name   || payload.report_title || payload.page_path || null,
    profession:  payload.profession  || null,
    search_query: payload.search_query || null,
    visitor_id:  getVisitorId(),
    session_id:  getSessionId(),
    referrer:    isPV ? ref : null,
    channel:     isPV ? classifyChannel(ref) : null,
    device_type: isPV ? detectDevice()  : null,
    browser:     isPV ? detectBrowser() : null,
  })
}

// 页面加载性能上报（使用 Navigation Timing API）
export function trackPerformance() {
  try {
    const [nav] = performance.getEntriesByType('navigation')
    if (!nav) return
    const load = Math.round(nav.loadEventEnd - nav.startTime)
    const fcp  = Math.round(nav.domContentLoadedEventEnd - nav.startTime)
    if (load <= 0) return
    post({
      event_type:   'perf_metric',
      search_query: JSON.stringify({ load, fcp }),
      visitor_id:   getVisitorId(),
      session_id:   getSessionId(),
    })
  } catch {}
}

// 错误事件上报
export function trackError(errorType, pagePath) {
  post({
    event_type:  'error_event',
    target_id:   errorType,
    target_name: pagePath || window.location.pathname,
    visitor_id:  getVisitorId(),
    session_id:  getSessionId(),
  })
}

// 模块加载后自动采集一次性能数据
if (typeof window !== 'undefined') {
  window.addEventListener('load', () => setTimeout(trackPerformance, 200))
}
