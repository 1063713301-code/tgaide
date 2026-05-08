import { useEffect, useState, useCallback, useRef } from 'react'
import { Link } from 'react-router-dom'
import { supabase } from '../../lib/supabase'

// ─── 时间段预设 ───────────────────────────────────────────────
const PERIODS = [
  { label: '今日',     getValue: () => { const d = new Date(); d.setHours(0,0,0,0); return d.toISOString() } },
  { label: '过去24小时', getValue: () => new Date(Date.now() - 86400000).toISOString() },
  { label: '本周',     getValue: () => { const d = new Date(); d.setDate(d.getDate() - d.getDay()); d.setHours(0,0,0,0); return d.toISOString() } },
  { label: '本月',     getValue: () => { const d = new Date(); d.setDate(1); d.setHours(0,0,0,0); return d.toISOString() } },
  { label: '过去30天', getValue: () => new Date(Date.now() - 30*86400000).toISOString() },
  { label: '过去90天', getValue: () => new Date(Date.now() - 90*86400000).toISOString() },
  { label: '今年',     getValue: () => { const d = new Date(); d.setMonth(0,1); d.setHours(0,0,0,0); return d.toISOString() } },
  { label: '过去半年', getValue: () => new Date(Date.now() - 180*86400000).toISOString() },
  { label: '过去一年', getValue: () => new Date(Date.now() - 365*86400000).toISOString() },
  { label: '全部',     getValue: () => '2020-01-01T00:00:00.000Z' },
]

const TABS = ['概览', '来源分析', '用户画像', '用户分层', '内容深度', '漏斗转化', '性能监控']

const PIE_COLORS    = ['#5288df','#10b981','#f59e0b','#ef4444','#8b5cf6','#06b6d4','#ec4899','#84cc16']
const CHANNEL_NAMES = { direct: '直接访问', search: '搜索引擎', social: '社交媒体', referral: '外链引用' }

// ─── 工具函数 ─────────────────────────────────────────────────
function fmt(n) {
  if (n === undefined || n === null) return '—'
  if (n >= 10000) return (n / 10000).toFixed(1) + 'w'
  if (n >= 1000)  return (n / 1000).toFixed(1)  + 'k'
  return String(n)
}

function fmtDuration(ms) {
  if (!ms || ms < 0) return '—'
  const s = Math.round(ms / 1000)
  if (s < 60) return `${s}s`
  return `${Math.floor(s / 60)}m ${s % 60}s`
}

function fmtMs(ms) {
  if (!ms || ms <= 0) return '—'
  if (ms < 1000) return `${Math.round(ms)}ms`
  return `${(ms / 1000).toFixed(2)}s`
}

function getReferrerDomain(url) {
  if (!url) return null
  try { return new URL(url).hostname.replace('www.', '') }
  catch { return url.split('/')[0] || null }
}

// CSV 导出工具
function exportCSV(headers, rows, filename) {
  const esc  = v => `"${String(v ?? '').replace(/"/g, '""')}"`
  const body = [headers.map(esc).join(','), ...rows.map(r => r.map(esc).join(','))].join('\n')
  const a    = document.createElement('a')
  a.href     = URL.createObjectURL(new Blob(['﻿' + body], { type: 'text/csv;charset=utf-8' }))
  a.download = filename
  a.click()
}

// ─── SVG 饼图 ─────────────────────────────────────────────────
function PieChart({ data }) {
  if (!data?.length) return <Empty />
  const total = data.reduce((s, d) => s + d.value, 0)
  if (total === 0) return <Empty />

  let angle = -Math.PI / 2
  const slices = data.map((d, i) => {
    const ratio = d.value / total
    const sa = angle, ea = angle + ratio * 2 * Math.PI
    angle = ea
    const R = 70, cx = 90, cy = 80
    const large = ratio > 0.5 ? 1 : 0
    const x1 = cx + R * Math.cos(sa), y1 = cy + R * Math.sin(sa)
    const x2 = cx + R * Math.cos(ea), y2 = cy + R * Math.sin(ea)
    return { ...d, ratio, color: PIE_COLORS[i % PIE_COLORS.length],
      path: `M90,80 L${x1},${y1} A70,70 0 ${large},1 ${x2},${y2}Z` }
  })

  return (
    <div className="flex flex-col sm:flex-row items-center gap-6">
      <svg viewBox="0 0 180 160" className="w-36 flex-shrink-0">
        {slices.map((s, i) => (
          <path key={i} d={s.path} fill={s.color} stroke="white" strokeWidth="2">
            <title>{s.label}: {s.value} ({Math.round(s.ratio * 100)}%)</title>
          </path>
        ))}
      </svg>
      <div className="flex flex-col gap-2 flex-1 min-w-0">
        {data.map((d, i) => (
          <div key={i} className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-2 min-w-0">
              <span className="w-3 h-3 rounded-sm flex-shrink-0" style={{ background: PIE_COLORS[i % PIE_COLORS.length] }} />
              <span className="text-sm text-gray-600 truncate">{d.label}</span>
            </div>
            <span className="text-sm font-semibold text-gray-800 flex-shrink-0">
              {d.value} <span className="text-xs font-normal text-gray-400">({Math.round(d.value / total * 100)}%)</span>
            </span>
          </div>
        ))}
      </div>
    </div>
  )
}

// ─── 水平条形图 ───────────────────────────────────────────────
function BarH({ data, color = '#5288df' }) {
  if (!data?.length) return <Empty />
  const max = Math.max(...data.map(d => d.value), 1)
  return (
    <div className="space-y-2">
      {data.map((d, i) => (
        <div key={i} className="flex items-center gap-3">
          <span className="w-24 text-xs text-gray-500 text-right flex-shrink-0 truncate" title={d.label}>{d.label}</span>
          <div className="flex-1 bg-gray-100 rounded-full h-4 overflow-hidden">
            <div className="h-full rounded-full transition-all" style={{ width: `${Math.max(d.value / max * 100, d.value > 0 ? 3 : 0)}%`, background: color }} />
          </div>
          <span className="w-10 text-xs text-gray-700 font-semibold flex-shrink-0 text-right">{d.value}</span>
        </div>
      ))}
    </div>
  )
}

// ─── 24 小时分布图 ────────────────────────────────────────────
function HourlyChart({ data }) {
  if (!data?.length || data.every(v => v === 0)) return <Empty />
  const max = Math.max(...data, 1)
  return (
    <div>
      <div className="flex items-end gap-0.5 h-24">
        {data.map((v, i) => (
          <div key={i} className="flex-1 flex flex-col items-center justify-end group relative">
            <div className="absolute bottom-full mb-1 hidden group-hover:block z-10 pointer-events-none">
              <div className="bg-gray-800 text-white text-xs rounded px-1.5 py-0.5 whitespace-nowrap">{i}时: {v}</div>
            </div>
            <div className="w-full rounded-t-sm transition-all" style={{ height: `${Math.max(v / max * 100, v > 0 ? 4 : 0)}%`, background: '#5288df' }} />
          </div>
        ))}
      </div>
      <div className="flex justify-between text-xs text-gray-400 mt-1 px-0.5">
        <span>0时</span><span>6时</span><span>12时</span><span>18时</span><span>23时</span>
      </div>
    </div>
  )
}

// ─── 漏斗图 ───────────────────────────────────────────────────
function FunnelChart({ steps }) {
  if (!steps?.length) return <Empty />
  const max = steps[0]?.value || 1
  return (
    <div className="space-y-3">
      {steps.map((step, i) => {
        const pct = Math.round(step.value / max * 100)
        const cvr = i > 0 && steps[i - 1].value > 0 ? Math.round(step.value / steps[i - 1].value * 100) : null
        return (
          <div key={i}>
            <div className="flex items-center justify-between mb-1">
              <span className="text-sm text-gray-700 font-medium">{step.label}</span>
              <div className="flex items-center gap-3">
                {cvr !== null && <span className="text-xs font-medium" style={{ color: cvr < 30 ? '#ef4444' : '#f59e0b' }}>↓ {cvr}% 转化</span>}
                <span className="text-sm font-bold text-gray-800">{fmt(step.value)}</span>
              </div>
            </div>
            <div className="bg-gray-100 rounded-lg h-9 overflow-hidden">
              <div className="h-full rounded-lg flex items-center px-3 transition-all"
                style={{ width: `${Math.max(pct, step.value > 0 ? 4 : 0)}%`, background: step.color }}>
                <span className="text-xs text-white font-medium">{pct}%</span>
              </div>
            </div>
          </div>
        )
      })}
    </div>
  )
}

// ─── 折线图 ───────────────────────────────────────────────────
function LineChart({ data, keys = ['visitors','visits'], colors = ['#5288df','#a0c5f0'], labels = ['Visitors','Visits'] }) {
  if (!data?.length || data.length < 2) return <Empty />
  const W = 800, H = 120, P = 8
  const maxV = Math.max(...data.flatMap(d => keys.map(k => d[k] || 0)), 1)
  const pts  = key => data.map((d, i) => {
    const x = P + (i / (data.length - 1)) * (W - P * 2)
    const y = H - P - ((d[key] || 0) / maxV) * (H - P * 2)
    return `${x},${y}`
  }).join(' ')
  const mid = Math.floor(data.length / 2)
  return (
    <>
      <div className="overflow-x-auto">
        <svg viewBox={`0 0 ${W} ${H}`} className="w-full" style={{ minWidth: 320, height: 120 }}>
          {[0.25, 0.5, 0.75].map(r => (
            <line key={r} x1={P} x2={W-P} y1={H-P-r*(H-P*2)} y2={H-P-r*(H-P*2)} stroke="#F1F5F9" strokeWidth="1" />
          ))}
          {keys.map((k, ki) => <polyline key={k} points={pts(k)} fill="none" stroke={colors[ki]} strokeWidth="2" strokeLinejoin="round" />)}
          {data.map((d, i) => {
            const x = P + (i / (data.length - 1)) * (W - P * 2)
            const y = H - P - ((d[keys[0]] || 0) / maxV) * (H - P * 2)
            return <circle key={i} cx={x} cy={y} r="3" fill={colors[0]} opacity="0.7">
              <title>{d.label}: {keys.map((k, ki) => `${labels[ki]}: ${d[k]||0}`).join(' · ')}</title>
            </circle>
          })}
        </svg>
      </div>
      <div className="flex justify-between text-xs text-gray-400 mt-1">
        <span>{data[0]?.label}</span><span>{data[mid]?.label}</span><span>{data[data.length-1]?.label}</span>
      </div>
      <div className="flex items-center gap-4 mt-3 justify-center flex-wrap">
        {labels.map((lbl, i) => (
          <span key={i} className="flex items-center gap-1.5 text-xs text-gray-500">
            <span className="w-6 h-0.5 rounded inline-block" style={{ background: colors[i] }} />{lbl}
          </span>
        ))}
      </div>
    </>
  )
}

// ─── 通用小组件 ───────────────────────────────────────────────
function StatCard({ label, value, sub, color = 'text-blue-600', loading, badge }) {
  return (
    <div className="bg-white border border-gray-200 rounded-xl p-5">
      <div className="flex items-start justify-between mb-1">
        <span className="text-xs text-gray-400">{label}</span>
        {badge && <span className="text-xs px-1.5 py-0.5 rounded bg-gray-100 text-gray-400">{badge}</span>}
      </div>
      <div className={`text-2xl font-bold ${color} mb-0.5`}>{loading ? '—' : value}</div>
      <div className="text-xs text-gray-400">{sub}</div>
    </div>
  )
}

function Card({ title, children, action }) {
  return (
    <div className="bg-white border border-gray-200 rounded-xl p-6">
      <div className="flex items-center justify-between mb-4">
        <h2 className="font-semibold text-gray-800">{title}</h2>
        {action}
      </div>
      {children}
    </div>
  )
}

function RankTable({ title, data, loading, onExport }) {
  return (
    <Card title={title} action={
      onExport && !loading && data.length > 0
        ? <button onClick={onExport} className="text-xs text-blue-600 hover:text-blue-700 font-medium">导出 CSV</button>
        : null
    }>
      {loading ? <Skel rows={8} /> : data.length === 0 ? <Empty /> : (
        <table className="w-full text-sm">
          <thead>
            <tr className="text-gray-400 text-xs border-b border-gray-100">
              <th className="text-left pb-2 font-medium w-6">#</th>
              <th className="text-left pb-2 font-medium">名称</th>
              <th className="text-right pb-2 font-medium">次数</th>
            </tr>
          </thead>
          <tbody>
            {data.map((row, i) => (
              <tr key={i} className="border-b border-gray-50 last:border-0">
                <td className="py-2 text-gray-400 text-xs">{i + 1}</td>
                <td className="py-2 text-gray-700 truncate max-w-[180px]">{row.name}</td>
                <td className="py-2 text-right font-semibold text-gray-800">{row.count}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </Card>
  )
}

function Skel({ rows = 4, h = 'h-4' }) {
  return (
    <div className="space-y-2">
      {Array.from({ length: rows }).map((_, i) => <div key={i} className={`skeleton ${h} rounded`} />)}
    </div>
  )
}

function Empty() { return <p className="text-sm text-gray-400 py-4 text-center">暂无数据</p> }

function NoData({ msg = '暂无数据（需在 Supabase 执行迁移脚本并更新埋点后生效）' }) {
  return (
    <div className="text-center py-8">
      <div className="text-3xl mb-2">📊</div>
      <p className="text-sm text-gray-400 max-w-xs mx-auto">{msg}</p>
    </div>
  )
}

// ─── 主组件 ───────────────────────────────────────────────────
export default function Analytics() {
  const [periodIdx,   setPeriodIdx]   = useState(4)
  const [customStart, setCustomStart] = useState('')
  const [customEnd,   setCustomEnd]   = useState('')
  const [useCustom,   setUseCustom]   = useState(false)
  const [activeTab,   setActiveTab]   = useState(0)
  const [autoRefresh, setAutoRefresh] = useState(false)
  const [loading,     setLoading]     = useState(true)
  const [lastRefresh, setLastRefresh] = useState(null)
  const refreshTimer = useRef(null)

  // ── 数据状态 ──
  const [stats,       setStats]       = useState(null)
  const [trend,       setTrend]       = useState([])
  const [toolRank,    setToolRank]    = useState([])
  const [reportRank,  setReportRank]  = useState([])
  const [professions, setProfessions] = useState([])
  const [searches,    setSearches]    = useState([])
  const [pageRank,    setPageRank]    = useState([])
  const [channels,    setChannels]    = useState([])
  const [referrers,   setReferrers]   = useState([])
  const [devices,     setDevices]     = useState([])
  const [browsers,    setBrowsers]    = useState([])
  const [hourly,      setHourly]      = useState(Array(24).fill(0))
  const [segment,     setSegment]     = useState(null)
  const [retention,   setRetention]   = useState(null)
  const [visitFreq,   setVisitFreq]   = useState([])
  const [funnel,      setFunnel]      = useState([])
  const [perfData,    setPerfData]    = useState(null)
  const [errors,      setErrors]      = useState([])

  useEffect(() => { document.title = '数据分析 - TG AI工具库' }, [])

  const getSince = useCallback(() => {
    if (useCustom && customStart) return new Date(customStart).toISOString()
    return PERIODS[periodIdx].getValue()
  }, [periodIdx, useCustom, customStart])

  const getUntil = useCallback(() => {
    if (useCustom && customEnd) return new Date(customEnd + 'T23:59:59').toISOString()
    return new Date().toISOString()
  }, [useCustom, customEnd])

  const fetchData = useCallback(async () => {
    setLoading(true)
    const since   = getSince()
    const until   = getUntil()
    const sinceMs = new Date(since).getTime()
    try {
      const { data, error } = await supabase
        .from('analytics_events')
        .select('*')
        .gte('created_at', since)
        .lte('created_at', until)
        .order('created_at', { ascending: true })
        .limit(50000)
      if (error) throw error
      processData(data || [], sinceMs, periodIdx <= 1)
      setLastRefresh(new Date())
    } catch (e) {
      console.error('analytics fetch error', e)
    } finally {
      setLoading(false)
    }
  }, [getSince, getUntil, periodIdx])

  useEffect(() => { fetchData() }, [fetchData])

  // 自动刷新（每 5 分钟）
  useEffect(() => {
    clearInterval(refreshTimer.current)
    if (autoRefresh) refreshTimer.current = setInterval(fetchData, 5 * 60 * 1000)
    return () => clearInterval(refreshTimer.current)
  }, [autoRefresh, fetchData])

  // ── 数据处理 ──────────────────────────────────────────────────
  function processData(rows, sinceMs, useHour) {
    const pvRows = rows.filter(r => r.event_type === 'page_view')

    // 核心指标
    const views      = pvRows.length
    const visitorSet = new Set(pvRows.map(r => r.visitor_id).filter(Boolean))
    const visitors   = visitorSet.size
    const sessionMap = {}
    pvRows.forEach(r => {
      if (!r.session_id) return
      sessionMap[r.session_id] = sessionMap[r.session_id] || []
      sessionMap[r.session_id].push(new Date(r.created_at).getTime())
    })
    const sessions    = Object.values(sessionMap)
    const visits      = sessions.length
    const bounced     = sessions.filter(ts => ts.length === 1).length
    const bounceRate  = visits > 0 ? Math.round(bounced / visits * 100) : 0
    const multiSess   = sessions.filter(ts => ts.length > 1)
    const avgDuration = multiSess.length > 0
      ? multiSess.reduce((s, ts) => s + (Math.max(...ts) - Math.min(...ts)), 0) / multiSess.length
      : 0
    setStats({ views, visitors, visits, bounceRate, avgDuration })

    // 工具点击排行
    const toolMap = {}
    rows.filter(r => r.event_type === 'tool_click').forEach(r => {
      const k = r.target_id || r.target_name; if (!k) return
      toolMap[k] = toolMap[k] || { name: r.target_name || r.target_id, count: 0 }
      toolMap[k].count++
    })
    setToolRank(Object.values(toolMap).sort((a, b) => b.count - a.count).slice(0, 20))

    // 报告阅读排行
    const repMap = {}
    rows.filter(r => r.event_type === 'report_view').forEach(r => {
      const k = r.target_id || r.target_name; if (!k) return
      repMap[k] = repMap[k] || { name: r.target_name || r.target_id, count: 0 }
      repMap[k].count++
    })
    setReportRank(Object.values(repMap).sort((a, b) => b.count - a.count).slice(0, 20))

    // 热门页面
    const pageMap = {}
    pvRows.forEach(r => {
      const k = r.target_name || r.target_id; if (!k) return
      pageMap[k] = (pageMap[k] || 0) + 1
    })
    setPageRank(Object.entries(pageMap).sort((a, b) => b[1] - a[1]).slice(0, 15).map(([name, count]) => ({ name, count })))

    // 职业偏好
    const profMap = {}
    rows.filter(r => r.event_type === 'profession_filter' && r.profession).forEach(r => {
      profMap[r.profession] = (profMap[r.profession] || 0) + 1
    })
    const profArr = Object.entries(profMap).sort((a, b) => b[1] - a[1])
    const maxP    = profArr[0]?.[1] || 1
    setProfessions(profArr.map(([name, count]) => ({ name, count, pct: Math.round(count / maxP * 100) })))

    // 搜索词
    setSearches(rows.filter(r => r.event_type === 'search' && r.search_query).map(r => r.search_query).reverse().slice(0, 100))

    // 来源渠道（优先用已存 channel 字段，无则从 referrer 推断）
    const chanMap = {}
    pvRows.forEach(r => {
      let ch = r.channel
      if (!ch) {
        const ref = r.referrer || ''
        if (/google|bing|baidu|sogou|360\.cn|shenma|yandex/i.test(ref))                          ch = 'search'
        else if (/weibo|wechat|facebook|twitter|tiktok|douyin|xiaohongshu|zhihu|bilibili/i.test(ref)) ch = 'social'
        else if (ref) ch = 'referral'
        else          ch = 'direct'
      }
      chanMap[ch] = (chanMap[ch] || 0) + 1
    })
    setChannels(Object.entries(chanMap).sort((a, b) => b[1] - a[1]).map(([ch, v]) => ({ label: CHANNEL_NAMES[ch] || ch, value: v })))

    // Referer 域名
    const refMap = {}
    pvRows.filter(r => r.referrer).forEach(r => {
      const domain = getReferrerDomain(r.referrer)
      if (domain && !domain.includes('tgaide')) refMap[domain] = (refMap[domain] || 0) + 1
    })
    setReferrers(Object.entries(refMap).sort((a, b) => b[1] - a[1]).slice(0, 10).map(([name, value]) => ({ label: name, value })))

    // 设备类型
    const devMap = {}
    pvRows.filter(r => r.device_type).forEach(r => { devMap[r.device_type] = (devMap[r.device_type] || 0) + 1 })
    const devNames = { desktop: 'PC桌面端', mobile: '手机', tablet: '平板' }
    setDevices(Object.entries(devMap).sort((a, b) => b[1] - a[1]).map(([k, v]) => ({ label: devNames[k] || k, value: v })))

    // 浏览器
    const brMap = {}
    pvRows.filter(r => r.browser).forEach(r => { brMap[r.browser] = (brMap[r.browser] || 0) + 1 })
    setBrowsers(Object.entries(brMap).sort((a, b) => b[1] - a[1]).map(([k, v]) => ({ label: k, value: v })))

    // 24小时分布
    const hourArr = Array(24).fill(0)
    pvRows.forEach(r => { hourArr[new Date(r.created_at).getHours()]++ })
    setHourly(hourArr)

    // 新/老用户
    const firstSeen = {}
    rows.forEach(r => {
      if (!r.visitor_id) return
      const t = new Date(r.created_at).getTime()
      if (!firstSeen[r.visitor_id] || t < firstSeen[r.visitor_id]) firstSeen[r.visitor_id] = t
    })
    let newUsers = 0, retUsers = 0
    Object.values(firstSeen).forEach(t => { if (t >= sinceMs) newUsers++; else retUsers++ })
    setSegment({ newUsers, retUsers })

    // 访问频次
    const vidSessMap = {}
    pvRows.forEach(r => {
      if (!r.visitor_id || !r.session_id) return
      vidSessMap[r.visitor_id] = vidSessMap[r.visitor_id] || new Set()
      vidSessMap[r.visitor_id].add(r.session_id)
    })
    const freqBuckets = { '1次': 0, '2-3次': 0, '4-7次': 0, '8次以上': 0 }
    Object.values(vidSessMap).forEach(s => {
      const n = s.size
      if (n === 1)     freqBuckets['1次']++
      else if (n <= 3) freqBuckets['2-3次']++
      else if (n <= 7) freqBuckets['4-7次']++
      else             freqBuckets['8次以上']++
    })
    setVisitFreq(Object.entries(freqBuckets).map(([label, value]) => ({ label, value })))

    // 留存（估算：以跨天访问代替真实留存）
    const vidDates = {}
    pvRows.forEach(r => {
      if (!r.visitor_id) return
      vidDates[r.visitor_id] = vidDates[r.visitor_id] || new Set()
      vidDates[r.visitor_id].add(r.created_at.slice(0, 10))
    })
    const total  = Object.keys(vidDates).length || 1
    const d1cnt  = Object.values(vidDates).filter(s => s.size > 1).length
    const d7cnt  = Object.values(vidDates).filter(s => {
      const sorted = [...s].sort()
      return sorted.length > 1 && new Date(sorted.at(-1)) - new Date(sorted[0]) >= 7 * 864e5
    }).length
    const d30cnt = Object.values(vidDates).filter(s => {
      const sorted = [...s].sort()
      return sorted.length > 1 && new Date(sorted.at(-1)) - new Date(sorted[0]) >= 30 * 864e5
    }).length
    setRetention({
      d1:  Math.round(d1cnt  / total * 100),
      d7:  Math.round(d7cnt  / total * 100),
      d30: Math.round(d30cnt / total * 100),
    })

    // 漏斗
    const toolClicks  = rows.filter(r => r.event_type === 'tool_click').length
    const repViews    = rows.filter(r => r.event_type === 'report_view').length
    const searchCount = rows.filter(r => r.event_type === 'search').length
    const downloads   = rows.filter(r => r.event_type === 'report_download').length
    setFunnel([
      { label: '首页访问（Visitors）',    value: visitors,               color: '#5288df' },
      { label: '工具/内容点击',           value: toolClicks + repViews,  color: '#10b981' },
      { label: '执行搜索',               value: searchCount,             color: '#f59e0b' },
      { label: '深度使用（PDF下载）',     value: downloads,              color: '#8b5cf6' },
    ])

    // 性能数据
    const perfRows = rows.filter(r => r.event_type === 'perf_metric')
    if (perfRows.length > 0) {
      const parsed   = perfRows.map(r => { try { return JSON.parse(r.search_query || '{}') } catch { return {} } })
      const loads    = parsed.map(p => p.load).filter(Boolean)
      const fcps     = parsed.map(p => p.fcp).filter(Boolean)
      const avgLoad  = loads.length  > 0 ? loads.reduce((a, b) => a + b, 0) / loads.length   : null
      const avgFcp   = fcps.length   > 0 ? fcps.reduce((a, b)  => a + b, 0) / fcps.length    : null
      const good     = loads.filter(l => l < 1500).length
      setPerfData({ avgLoad, avgFcp, count: perfRows.length, goodPct: loads.length > 0 ? Math.round(good / loads.length * 100) : null })
    } else {
      setPerfData(null)
    }

    // 错误事件
    setErrors(rows.filter(r => r.event_type === 'error_event').reverse().slice(0, 50))

    // 趋势图（今日/过去24小时用小时，其余用天）
    const bucketMap = {}
    if (useHour) {
      for (let i = 47; i >= 0; i--) {
        const d = new Date(Date.now() - i * 3600000)
        const k = `${d.getMonth()+1}/${d.getDate()} ${String(d.getHours()).padStart(2,'0')}:00`
        bucketMap[k] = { views: 0, visitors: new Set(), sessions: new Set() }
      }
      pvRows.forEach(r => {
        const d = new Date(r.created_at)
        const k = `${d.getMonth()+1}/${d.getDate()} ${String(d.getHours()).padStart(2,'0')}:00`
        if (bucketMap[k]) {
          bucketMap[k].views++
          if (r.visitor_id) bucketMap[k].visitors.add(r.visitor_id)
          if (r.session_id) bucketMap[k].sessions.add(r.session_id)
        }
      })
    } else {
      for (let i = 29; i >= 0; i--) {
        const d = new Date(); d.setDate(d.getDate() - i)
        bucketMap[d.toISOString().slice(0, 10)] = { views: 0, visitors: new Set(), sessions: new Set() }
      }
      pvRows.forEach(r => {
        const k = r.created_at.slice(0, 10)
        if (bucketMap[k]) {
          bucketMap[k].views++
          if (r.visitor_id) bucketMap[k].visitors.add(r.visitor_id)
          if (r.session_id) bucketMap[k].sessions.add(r.session_id)
        }
      })
    }
    const maxB = Math.max(...Object.values(bucketMap).map(v => v.views), 1)
    setTrend(Object.entries(bucketMap).map(([label, v]) => ({
      label,
      views:       v.views,
      visitors:    v.visitors.size,
      visits:      v.sessions.size,
      viewsPct:    Math.round(v.views / maxB * 100),
      visitorsPct: Math.round(v.visitors.size / maxB * 100),
    })))
  }

  // ── 导出快捷函数 ──────────────────────────────────────────────
  const expTools   = () => exportCSV(['排名','工具名','点击次数'], toolRank.map((r,i) => [i+1, r.name, r.count]), 'tool_rank.csv')
  const expReports = () => exportCSV(['排名','报告名','阅读次数'], reportRank.map((r,i) => [i+1, r.name, r.count]), 'report_rank.csv')
  const expSearch  = () => exportCSV(['搜索词'], searches.map(s => [s]), 'searches.csv')
  const expFunnel  = () => exportCSV(['步骤','数量'], funnel.map(f => [f.label, f.value]), 'funnel.csv')

  // ── 渲染 ─────────────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-gray-50">

      {/* 顶部导航 */}
      <header className="bg-white border-b border-gray-200 px-4 sm:px-6 py-4 sticky top-0 z-20 shadow-sm">
        <div className="max-w-7xl mx-auto flex items-center justify-between gap-3 flex-wrap">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center text-white font-bold text-sm">TG</div>
            <span className="font-semibold text-gray-800">数据分析看板</span>
            {lastRefresh && <span className="text-xs text-gray-400 hidden sm:block">更新于 {lastRefresh.toLocaleTimeString()}</span>}
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            <button onClick={() => setAutoRefresh(v => !v)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${autoRefresh ? 'bg-green-100 text-green-700 border border-green-200' : 'bg-gray-100 text-gray-500 hover:bg-gray-200'}`}>
              {autoRefresh ? '⏱ 自动刷新 5min' : '自动刷新'}
            </button>
            <button onClick={fetchData} disabled={loading}
              className="px-3 py-1.5 rounded-lg text-xs font-medium bg-blue-50 text-blue-700 hover:bg-blue-100 disabled:opacity-50">
              ↻ 刷新
            </button>
            <Link to="/admin/dashboard" className="text-sm text-gray-500 hover:text-blue-600">← 返回后台</Link>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6 space-y-5">

        {/* 时间筛选区 */}
        <div className="bg-white border border-gray-200 rounded-xl p-4 space-y-3">
          <div className="flex flex-wrap gap-2">
            {PERIODS.map((p, i) => (
              <button key={i} onClick={() => { setPeriodIdx(i); setUseCustom(false) }}
                className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${!useCustom && periodIdx === i ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}>
                {p.label}
              </button>
            ))}
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-xs text-gray-400 mr-1">自定义范围：</span>
            <input type="date" value={customStart} onChange={e => setCustomStart(e.target.value)}
              className="border border-gray-200 rounded-lg px-2 py-1 text-sm focus:outline-none focus:ring-1 focus:ring-blue-400" />
            <span className="text-gray-400 text-sm">→</span>
            <input type="date" value={customEnd} onChange={e => setCustomEnd(e.target.value)}
              className="border border-gray-200 rounded-lg px-2 py-1 text-sm focus:outline-none focus:ring-1 focus:ring-blue-400" />
            <button onClick={() => { if (customStart) setUseCustom(true) }}
              className="px-3 py-1 rounded-lg text-sm bg-blue-600 text-white hover:bg-blue-700 font-medium">确定</button>
            {useCustom && <span className="text-xs text-blue-600 font-medium px-2 py-0.5 bg-blue-50 rounded-full">● 自定义中</span>}
          </div>
        </div>

        {/* 核心指标卡片 */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
          {[
            { label: 'Visitors',  value: stats ? fmt(stats.visitors)            : '—', sub: '独立访客',   color: 'text-green-600'  },
            { label: 'Visits',    value: stats ? fmt(stats.visits)              : '—', sub: '访问次数',   color: 'text-blue-600'   },
            { label: 'Views',     value: stats ? fmt(stats.views)               : '—', sub: '页面浏览',   color: 'text-purple-600' },
            { label: 'Bounce',    value: stats ? `${stats.bounceRate}%`         : '—', sub: '跳出率',     color: stats?.bounceRate > 70 ? 'text-red-500' : 'text-orange-500' },
            { label: 'Duration',  value: stats ? fmtDuration(stats.avgDuration) : '—', sub: '平均时长',   color: 'text-teal-600'   },
            { label: '工具点击',  value: fmt(toolRank.reduce((s, r) => s + r.count, 0)), sub: '点击总计', color: 'text-indigo-600' },
          ].map(c => <StatCard key={c.label} loading={loading} {...c} />)}
        </div>

        {/* Tab 导航 */}
        <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
          <div className="flex gap-0 overflow-x-auto border-b border-gray-100 px-4 pt-0">
            {TABS.map((tab, i) => (
              <button key={i} onClick={() => setActiveTab(i)}
                className={`px-4 py-3 text-sm font-medium whitespace-nowrap border-b-2 transition-colors ${activeTab === i ? 'border-blue-600 text-blue-600' : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-200'}`}>
                {tab}
              </button>
            ))}
          </div>

          {/* ─── Tab 0: 概览 ─── */}
          {activeTab === 0 && (
            <div className="p-6 space-y-6">
              <div>
                <div className="flex items-center justify-between mb-4">
                  <h2 className="font-semibold text-gray-800">访问趋势 — {periodIdx <= 1 ? '按小时' : '按天（最近30天）'}</h2>
                  <div className="flex items-center gap-4">
                    <span className="flex items-center gap-1.5 text-xs text-gray-500"><span className="w-3 h-3 rounded-sm inline-block" style={{background:'#5288df'}} />Visitors</span>
                    <span className="flex items-center gap-1.5 text-xs text-gray-500"><span className="w-3 h-3 rounded-sm inline-block" style={{background:'#c7dcf6'}} />Views</span>
                  </div>
                </div>
                {loading ? <Skel rows={1} h="h-32" /> : (
                  <>
                    <div className="flex items-end gap-px h-32 overflow-x-auto">
                      {trend.map((b, i) => (
                        <div key={i} className="flex-shrink-0 flex flex-col items-center justify-end group relative"
                          style={{ minWidth: trend.length > 48 ? '9px' : trend.length > 24 ? '14px' : '20px', height: '100%' }}>
                          <div className="absolute bottom-full mb-1 hidden group-hover:flex flex-col items-center z-10 pointer-events-none">
                            <div className="bg-gray-800 text-white text-xs rounded px-2 py-1 whitespace-nowrap">
                              {b.label}<br />Visitors: {b.visitors} · Views: {b.views}
                            </div>
                          </div>
                          <div className="w-full rounded-sm" style={{ height: `${Math.max(b.viewsPct, b.views > 0 ? 3 : 0)}%`, background: '#c7dcf6' }} />
                          <div className="w-full rounded-sm absolute bottom-0" style={{ height: `${Math.max(b.visitorsPct, b.visitors > 0 ? 3 : 0)}%`, background: '#5288df' }} />
                        </div>
                      ))}
                    </div>
                    <div className="flex justify-between text-xs text-gray-400 mt-2">
                      <span>{trend[0]?.label}</span>
                      <span>{trend[Math.floor(trend.length / 2)]?.label}</span>
                      <span>{trend[trend.length - 1]?.label}</span>
                    </div>
                  </>
                )}
              </div>
              <div>
                <h2 className="font-semibold text-gray-800 mb-4">Visitors / Visits 折线趋势</h2>
                {loading ? <Skel rows={1} h="h-32" /> : <LineChart data={trend} colors={['#5288df','#ef4444']} />}
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                <RankTable title="工具点击 TOP 20" data={toolRank} loading={loading} onExport={expTools} />
                <RankTable title="报告阅读排行" data={reportRank} loading={loading} onExport={expReports} />
              </div>
            </div>
          )}

          {/* ─── Tab 1: 来源分析 ─── */}
          {activeTab === 1 && (
            <div className="p-6 space-y-6">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                <Card title="访问渠道分布">
                  {loading ? <Skel rows={4} /> : channels.length === 0 ? <NoData /> : <PieChart data={channels} />}
                </Card>
                <Card title="渠道详情">
                  {loading ? <Skel rows={4} /> : channels.length === 0 ? <NoData /> : (
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="text-xs text-gray-400 border-b border-gray-100">
                          <th className="text-left pb-2">渠道</th>
                          <th className="text-right pb-2">访问量</th>
                          <th className="text-right pb-2">占比</th>
                        </tr>
                      </thead>
                      <tbody>
                        {channels.map((c, i) => {
                          const tot = channels.reduce((s, x) => s + x.value, 0)
                          return (
                            <tr key={i} className="border-b border-gray-50 last:border-0">
                              <td className="py-2">
                                <span className="flex items-center gap-2">
                                  <span className="w-3 h-3 rounded-sm flex-shrink-0" style={{ background: PIE_COLORS[i] }} />
                                  {c.label}
                                </span>
                              </td>
                              <td className="py-2 text-right font-semibold">{c.value}</td>
                              <td className="py-2 text-right text-gray-500">{tot > 0 ? Math.round(c.value / tot * 100) : 0}%</td>
                            </tr>
                          )
                        })}
                      </tbody>
                    </table>
                  )}
                </Card>
              </div>
              <Card title="Referer 域名 TOP 10">
                {loading ? <Skel rows={6} /> : referrers.length === 0
                  ? <NoData msg="暂无外链来源数据。新用户访问后可在此查看引流域名。" />
                  : <BarH data={referrers} color="#818cf8" />}
              </Card>
            </div>
          )}

          {/* ─── Tab 2: 用户画像 ─── */}
          {activeTab === 2 && (
            <div className="p-6 space-y-6">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                <Card title="设备类型分布">
                  {loading ? <Skel rows={3} />
                    : devices.length === 0 ? <NoData msg="暂无设备数据。运行迁移脚本并更新 analytics.js 后开始采集。" />
                    : <PieChart data={devices} />}
                </Card>
                <Card title="浏览器分布">
                  {loading ? <Skel rows={4} />
                    : browsers.length === 0 ? <NoData msg="暂无浏览器数据。运行迁移脚本并更新 analytics.js 后开始采集。" />
                    : <PieChart data={browsers} />}
                </Card>
              </div>
              <Card title="访问时段分布（24小时）">
                {loading ? <Skel rows={1} h="h-24" /> : <HourlyChart data={hourly} />}
              </Card>
              <Card title="职业偏好分析">
                {loading ? <Skel rows={6} /> : professions.length === 0 ? <Empty /> : (
                  <div className="space-y-3">
                    {professions.map(p => (
                      <div key={p.name} className="flex items-center gap-3">
                        <span className="w-16 text-sm text-gray-600 text-right flex-shrink-0">{p.name}</span>
                        <div className="flex-1 bg-gray-100 rounded-full h-5 overflow-hidden">
                          <div className="h-full bg-blue-500 rounded-full transition-all" style={{ width: `${p.pct}%` }} />
                        </div>
                        <span className="w-8 text-xs text-gray-500 flex-shrink-0 text-right">{p.count}</span>
                      </div>
                    ))}
                  </div>
                )}
              </Card>
              <Card title="热门页面 TOP 15">
                {loading ? <Skel rows={8} />
                  : pageRank.length === 0 ? <Empty />
                  : <BarH data={pageRank.map(r => ({ label: r.name, value: r.count }))} color="#a78bfa" />}
              </Card>
            </div>
          )}

          {/* ─── Tab 3: 用户分层 ─── */}
          {activeTab === 3 && (
            <div className="p-6 space-y-6">
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                <StatCard label="新用户"    value={segment ? fmt(segment.newUsers) : '—'} sub="首次访问" color="text-green-600"  loading={loading} />
                <StatCard label="老用户"    value={segment ? fmt(segment.retUsers) : '—'} sub="回访用户" color="text-blue-600"   loading={loading} />
                <StatCard label="次日留存"  value={retention ? `${retention.d1}%`  : '—'} sub="D1（估算）" color="text-purple-600" loading={loading} badge="估算" />
                <StatCard label="7日留存"   value={retention ? `${retention.d7}%`  : '—'} sub="D7（估算）" color="text-orange-600" loading={loading} badge="估算" />
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                <Card title="新老用户对比">
                  {loading ? <Skel rows={3} /> : !segment ? <Empty /> : (
                    <PieChart data={[{ label: '新用户', value: segment.newUsers }, { label: '老用户', value: segment.retUsers }]} />
                  )}
                </Card>
                <Card title="访问频次分布">
                  {loading ? <Skel rows={4} /> : <BarH data={visitFreq} color="#2dd4bf" />}
                </Card>
              </div>
              <Card title="留存指标">
                <div className="grid grid-cols-3 gap-4 mt-2">
                  {[
                    { label: '次日留存 D1', value: retention?.d1 },
                    { label: '7日留存 D7',  value: retention?.d7 },
                    { label: '30日留存 D30', value: retention?.d30 },
                  ].map(r => (
                    <div key={r.label} className="bg-gray-50 rounded-xl p-4 text-center">
                      <div className="text-2xl font-bold text-blue-600 mb-1">{loading ? '—' : (r.value !== undefined ? `${r.value}%` : '—')}</div>
                      <div className="text-xs text-gray-500">{r.label}</div>
                    </div>
                  ))}
                </div>
                <p className="text-xs text-gray-400 mt-4">注：留存率为跨天访问估算值，精确数据建议接入专业分析平台。</p>
              </Card>
            </div>
          )}

          {/* ─── Tab 4: 内容深度 ─── */}
          {activeTab === 4 && (
            <div className="p-6 space-y-6">
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                <StatCard label="报告阅读量"  value={fmt(reportRank.reduce((s, r) => s + r.count, 0))} sub="总阅读次数" color="text-blue-600"   loading={loading} />
                <StatCard label="工具点击量"  value={fmt(toolRank.reduce((s, r) => s + r.count, 0))}  sub="总点击次数" color="text-green-600"  loading={loading} />
                <StatCard label="PDF 下载量"  value={fmt(funnel[3]?.value ?? 0)}                       sub="下载转化"   color="text-purple-600" loading={loading} />
                <StatCard label="搜索次数"    value={fmt(searches.length)}                              sub="搜索词记录" color="text-orange-600" loading={loading} />
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                <RankTable title="工具点击 TOP 20" data={toolRank} loading={loading} onExport={expTools} />
                <RankTable title="报告阅读排行"    data={reportRank} loading={loading} onExport={expReports} />
              </div>
              <Card title="搜索关键词" action={
                <button onClick={expSearch} className="text-xs text-blue-600 hover:text-blue-700 font-medium">导出 CSV</button>
              }>
                {loading ? <Skel rows={3} /> : searches.length === 0 ? <Empty /> : (
                  <div className="flex flex-wrap gap-2">
                    {searches.map((s, i) => (
                      <span key={i} className="px-2.5 py-1 bg-blue-50 text-blue-700 rounded-full text-sm border border-blue-100">{s}</span>
                    ))}
                  </div>
                )}
              </Card>
            </div>
          )}

          {/* ─── Tab 5: 漏斗转化 ─── */}
          {activeTab === 5 && (
            <div className="p-6 space-y-6">
              <Card title="核心转化漏斗" action={
                <button onClick={expFunnel} className="text-xs text-blue-600 hover:text-blue-700 font-medium">导出 CSV</button>
              }>
                {loading ? <Skel rows={4} h="h-10" /> : <FunnelChart steps={funnel} />}
              </Card>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                {funnel.map((step, i) => (
                  <StatCard key={i}
                    label={step.label}
                    value={fmt(step.value)}
                    sub={i > 0 && funnel[0].value > 0 ? `整体转化 ${Math.round(step.value / funnel[0].value * 100)}%` : '入口流量'}
                    color="text-blue-600"
                    loading={loading}
                  />
                ))}
              </div>
              <Card title="漏斗步骤说明">
                <div className="text-sm text-gray-500 space-y-2">
                  <p>· <strong>首页访问</strong>：独立 Visitor 数量（来自 visitor_id 去重）</p>
                  <p>· <strong>工具/内容点击</strong>：tool_click + report_view 事件总量</p>
                  <p>· <strong>执行搜索</strong>：search 事件总量（主动检索意图）</p>
                  <p>· <strong>深度使用</strong>：report_download 事件总量（PDF 下载转化）</p>
                </div>
              </Card>
            </div>
          )}

          {/* ─── Tab 6: 性能监控 ─── */}
          {activeTab === 6 && (
            <div className="p-6 space-y-6">
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                <StatCard label="平均加载时长" value={perfData ? fmtMs(perfData.avgLoad)  : '—'} sub="Page Load Time"  color={perfData?.avgLoad > 3000 ? 'text-red-500' : 'text-green-600'} loading={loading} />
                <StatCard label="平均 FCP"     value={perfData ? fmtMs(perfData.avgFcp)   : '—'} sub="首次内容渲染"    color="text-blue-600"   loading={loading} />
                <StatCard label="快速加载占比" value={perfData ? `${perfData.goodPct}%`   : '—'} sub="加载 < 1.5s"     color="text-teal-600"   loading={loading} />
                <StatCard label="性能样本数"   value={perfData ? fmt(perfData.count)       : '—'} sub="perf_metric 事件" color="text-gray-600"  loading={loading} />
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <StatCard label="错误事件总计" value={fmt(errors.length)} sub="error_event 记录" color={errors.length > 0 ? 'text-red-500' : 'text-gray-400'} loading={loading} />
                <StatCard label="Worker 状态"  value="—" sub="需接入 Cloudflare Analytics" color="text-gray-400" loading={loading} />
              </div>
              {!perfData && !loading && (
                <Card title="性能数据采集">
                  <NoData msg="性能数据暂未收集。执行 Supabase 迁移 + 部署新 analytics.js 后，页面加载指标将自动上报。" />
                </Card>
              )}
              {errors.length > 0 && (
                <Card title={`错误事件记录（最近 ${Math.min(errors.length, 20)} 条）`}>
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="text-xs text-gray-400 border-b border-gray-100">
                          <th className="text-left pb-2">时间</th>
                          <th className="text-left pb-2">错误类型</th>
                          <th className="text-left pb-2">页面路径</th>
                        </tr>
                      </thead>
                      <tbody>
                        {errors.slice(0, 20).map((e, i) => (
                          <tr key={i} className="border-b border-gray-50 last:border-0">
                            <td className="py-1.5 text-gray-400 text-xs whitespace-nowrap">{new Date(e.created_at).toLocaleString()}</td>
                            <td className="py-1.5 text-red-500 text-xs">{e.target_id}</td>
                            <td className="py-1.5 text-gray-600 text-xs truncate max-w-[200px]">{e.target_name}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </Card>
              )}
              <Card title="性能优化建议">
                <div className="text-sm text-gray-500 space-y-2">
                  <p>· <strong>Page Load &lt; 1.5s</strong> 为良好，&gt; 3s 需优化（使用 CDN、压缩图片、代码分割）</p>
                  <p>· <strong>FCP &lt; 1.8s</strong> 为 Google Core Web Vitals 推荐阈值</p>
                  <p>· 404 / 500 服务端错误建议通过 Cloudflare Dashboard → Analytics 查看</p>
                  <p>· Worker 接口状态建议在 Cloudflare Workers → Metrics 中监控</p>
                </div>
              </Card>
            </div>
          )}

        </div>
      </div>
    </div>
  )
}
