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
  if (/tablet|ipad|playbook|silk/i.test(ua))                                           return 'tablet'
  if (/mobile|android|iphone|ipod|blackberry|opera mini|iemobile/i.test(ua))           return 'mobile'
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
  if (/google|bing|baidu|sogou|360\.cn|shenma|yandex/i.test(ref))                               return 'search'
  if (/weibo|wechat|facebook|twitter|instagram|tiktok|douyin|xiaohongshu|zhihu|bilibili/i.test(ref)) return 'social'
  return 'referral'
}

// IP 地理位置（缓存至 localStorage，首次访问异步获取，后续命中缓存直接用）
const GEO_KEY     = 'tg_geo'
const GEO_TTL     = 7 * 24 * 3600 * 1000 // 7天重新查一次

function getCachedGeo() {
  try {
    const raw = localStorage.getItem(GEO_KEY)
    if (!raw) return null
    const { province, city, ts } = JSON.parse(raw)
    if (Date.now() - ts > GEO_TTL) { localStorage.removeItem(GEO_KEY); return null }
    return { province: province || null, city: city || null }
  } catch { return null }
}

const CN_PROVINCES = {
  'Beijing':'北京','Tianjin':'天津','Shanghai':'上海','Chongqing':'重庆',
  'Hebei':'河北','Shanxi':'山西','Inner Mongolia':'内蒙古','Liaoning':'辽宁',
  'Jilin':'吉林','Heilongjiang':'黑龙江','Jiangsu':'江苏','Zhejiang':'浙江',
  'Anhui':'安徽','Fujian':'福建','Jiangxi':'江西','Shandong':'山东',
  'Henan':'河南','Hubei':'湖北','Hunan':'湖南','Guangdong':'广东',
  'Guangxi':'广西','Hainan':'海南','Sichuan':'四川','Guizhou':'贵州',
  'Yunnan':'云南','Tibet':'西藏','Shaanxi':'陕西','Gansu':'甘肃',
  'Qinghai':'青海','Ningxia':'宁夏','Xinjiang':'新疆',
  'Hong Kong':'香港','Macao':'澳门','Taiwan':'台湾',
}

async function fetchGeo() {
  try {
    // ipwho.is 支持 HTTPS，免费无限制
    const res = await fetch('https://ipwho.is/', { signal: AbortSignal.timeout(4000) })
    if (!res.ok) throw new Error()
    const { region, city, country } = await res.json()
    const province = country === 'China' ? (CN_PROVINCES[region] || region) : (region || null)
    if (province) {
      localStorage.setItem(GEO_KEY, JSON.stringify({ province, city: city || null, ts: Date.now() }))
    }
    return { province, city: city || null }
  } catch {
    return { province: null, city: null }
  }
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
  const isPV  = eventType === 'page_view'
  const ref   = document.referrer || null
  const base  = {
    event_type:   eventType,
    target_id:    payload.tool_slug   || payload.report_id    || payload.page_path || null,
    target_name:  payload.tool_name   || payload.report_title || payload.page_path || null,
    profession:   payload.profession  || null,
    search_query: payload.search_query || null,
    visitor_id:   getVisitorId(),
    session_id:   getSessionId(),
    referrer:     isPV ? ref : null,
    channel:      isPV ? classifyChannel(ref) : null,
    device_type:  isPV ? detectDevice()  : null,
    browser:      isPV ? detectBrowser() : null,
  }

  if (!isPV) { post(base); return }

  // page_view：带上 geo（有缓存立即用，无缓存先上报再后台拉取供下次用）
  const cached = getCachedGeo()
  if (cached) {
    post({ ...base, province: cached.province, city: cached.city })
  } else {
    post(base) // 先上报，不阻塞
    fetchGeo() // 后台静默拉取，缓存结果供下次使用
  }
}

// 页面加载性能上报（Navigation Timing API）
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

// 模块加载后自动采集性能数据
if (typeof window !== 'undefined') {
  window.addEventListener('load', () => setTimeout(trackPerformance, 200))
}
