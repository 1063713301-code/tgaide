import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { supabase } from '../../lib/supabase'

const PERIODS = [
  { label: '今日', getValue: () => { const d = new Date(); d.setHours(0,0,0,0); return d.toISOString() } },
  { label: '过去24小时', getValue: () => new Date(Date.now() - 86400000).toISOString() },
  { label: '本周', getValue: () => { const d = new Date(); d.setDate(d.getDate() - d.getDay()); d.setHours(0,0,0,0); return d.toISOString() } },
  { label: '本月', getValue: () => { const d = new Date(); d.setDate(1); d.setHours(0,0,0,0); return d.toISOString() } },
  { label: '过去30天', getValue: () => new Date(Date.now() - 30*86400000).toISOString() },
  { label: '过去90天', getValue: () => new Date(Date.now() - 90*86400000).toISOString() },
  { label: '今年', getValue: () => { const d = new Date(); d.setMonth(0,1); d.setHours(0,0,0,0); return d.toISOString() } },
  { label: '过去半年', getValue: () => new Date(Date.now() - 180*86400000).toISOString() },
  { label: '过去一年', getValue: () => new Date(Date.now() - 365*86400000).toISOString() },
  { label: '全部', getValue: () => '2020-01-01T00:00:00.000Z' },
]

function fmt(n) {
  if (n >= 10000) return (n/10000).toFixed(1) + 'w'
  if (n >= 1000) return (n/1000).toFixed(1) + 'k'
  return String(n)
}

function fmtDuration(ms) {
  if (!ms || ms < 0) return '—'
  const s = Math.round(ms / 1000)
  if (s < 60) return `${s}s`
  return `${Math.floor(s/60)}m ${s%60}s`
}

export default function Analytics() {
  const [periodIdx, setPeriodIdx] = useState(0)
  const [stats, setStats] = useState(null)
  const [toolRank, setToolRank] = useState([])
  const [reportRank, setReportRank] = useState([])
  const [professions, setProfessions] = useState([])
  const [searches, setSearches] = useState([])
  const [trend, setTrend] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => { document.title = '数据分析 - TG AI工具库' }, [])

  useEffect(() => {
    setLoading(true)
    const since = PERIODS[periodIdx].getValue()

    supabase.from('analytics_events').select('event_type, visitor_id, session_id, created_at, target_id, target_name, profession, search_query')
      .gte('created_at', since)
      .order('created_at', { ascending: true })
      .limit(50000)
      .then(({ data }) => {
        const rows = data || []

        // Views = page_view 数
        const pvRows = rows.filter(r => r.event_type === 'page_view')
        const views = pvRows.length

        // Visitors = 唯一 visitor_id
        const visitors = new Set(pvRows.map(r => r.visitor_id).filter(Boolean)).size

        // Visits = 唯一 session_id
        const sessionMap = {}
        pvRows.forEach(r => {
          if (!r.session_id) return
          if (!sessionMap[r.session_id]) sessionMap[r.session_id] = []
          sessionMap[r.session_id].push(new Date(r.created_at).getTime())
        })
        const sessions = Object.values(sessionMap)
        const visits = sessions.length

        // Bounce rate = session 只有 1 个 PV 的比例
        const bounced = sessions.filter(ts => ts.length === 1).length
        const bounceRate = visits > 0 ? Math.round(bounced / visits * 100) : 0

        // Visit duration = 平均 (session最后 - session第一)，排除单页 session
        const multiSessions = sessions.filter(ts => ts.length > 1)
        const avgDuration = multiSessions.length > 0
          ? multiSessions.reduce((sum, ts) => sum + (Math.max(...ts) - Math.min(...ts)), 0) / multiSessions.length
          : 0

        setStats({ views, visitors, visits, bounceRate, avgDuration })

        // 工具排行
        const toolMap = {}
        rows.filter(r => r.event_type === 'tool_click').forEach(r => {
          const k = r.target_id || r.target_name; if (!k) return
          toolMap[k] = toolMap[k] || { name: r.target_name || r.target_id, count: 0 }
          toolMap[k].count++
        })
        setToolRank(Object.values(toolMap).sort((a,b) => b.count - a.count).slice(0, 20))

        // 报告排行
        const repMap = {}
        rows.filter(r => r.event_type === 'report_view').forEach(r => {
          const k = r.target_id || r.target_name; if (!k) return
          repMap[k] = repMap[k] || { name: r.target_name || r.target_id, count: 0 }
          repMap[k].count++
        })
        setReportRank(Object.values(repMap).sort((a,b) => b.count - a.count).slice(0, 20))

        // 职业偏好
        const profMap = {}
        rows.filter(r => r.event_type === 'profession_filter' && r.profession).forEach(r => {
          profMap[r.profession] = (profMap[r.profession] || 0) + 1
        })
        const profArr = Object.entries(profMap).sort((a,b) => b[1]-a[1])
        const maxP = profArr[0]?.[1] || 1
        setProfessions(profArr.map(([name, count]) => ({ name, count, pct: Math.round(count/maxP*100) })))

        // 搜索词
        setSearches(rows.filter(r => r.event_type === 'search' && r.search_query).map(r => r.search_query).reverse().slice(0, 100))

        // 时间轴图表（今日/过去24小时用小时粒度，其他用天粒度）
        const useHour = periodIdx <= 1
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
            bucketMap[d.toISOString().slice(0,10)] = { views: 0, visitors: new Set(), sessions: new Set() }
          }
          pvRows.forEach(r => {
            const k = r.created_at.slice(0,10)
            if (bucketMap[k]) {
              bucketMap[k].views++
              if (r.visitor_id) bucketMap[k].visitors.add(r.visitor_id)
              if (r.session_id) bucketMap[k].sessions.add(r.session_id)
            }
          })
        }
        const buckets = Object.entries(bucketMap).map(([label, v]) => ({ label, views: v.views, visitors: v.visitors.size, visits: v.sessions.size }))
        const maxB = Math.max(...buckets.map(b => b.views), 1)
        setTrend(buckets.map(b => ({ ...b, viewsPct: Math.round(b.views/maxB*100), visitorsPct: Math.round(b.visitors/maxB*100) })))
      })
      .catch(console.error)
      .finally(() => setLoading(false))
  }, [periodIdx])

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b border-gray-200 px-4 sm:px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center text-white font-bold text-sm">TG</div>
          <span className="font-semibold text-gray-800">数据分析看板</span>
        </div>
        <Link to="/admin/dashboard" className="text-sm text-gray-500 hover:text-blue-600">← 返回后台</Link>
      </header>

      <div className="max-w-5xl mx-auto px-6 py-8 space-y-8">

        {/* 时间段选择 */}
        <div className="flex flex-wrap gap-2">
          {PERIODS.map((p, i) => (
            <button key={i} onClick={() => setPeriodIdx(i)}
              className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${periodIdx === i ? 'bg-blue-600 text-white' : 'bg-white border border-gray-200 text-gray-600 hover:border-blue-400'}`}>
              {p.label}
            </button>
          ))}
        </div>

        {/* 核心指标 */}
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-4">
          {[
            { label: 'Visitors', value: stats?.visitors, sub: '独立访客', color: 'text-green-600' },
            { label: 'Visits', value: stats?.visits, sub: '访问次数', color: 'text-blue-600' },
            { label: 'Views', value: stats?.views, sub: '页面浏览', color: 'text-purple-600' },
            { label: 'Bounce Rate', value: stats ? `${stats.bounceRate}%` : null, sub: '跳出率', color: stats?.bounceRate > 70 ? 'text-red-500' : 'text-orange-500' },
            { label: 'Avg Duration', value: stats ? fmtDuration(stats.avgDuration) : null, sub: '平均时长', color: 'text-teal-600' },
          ].map(c => (
            <div key={c.label} className="bg-white border border-gray-200 rounded-xl p-5">
              <div className="text-xs text-gray-400 mb-1">{c.label}</div>
              <div className={`text-2xl font-bold ${c.color} mb-0.5`}>{loading ? '—' : (c.value !== undefined ? (typeof c.value === 'number' ? fmt(c.value) : c.value) : '—')}</div>
              <div className="text-xs text-gray-400">{c.sub}</div>
            </div>
          ))}
        </div>

        {/* 工具点击 + 报告阅读排行 */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
          <RankTable title="工具点击 TOP 20" data={toolRank} loading={loading} />
          <RankTable title="报告阅读排行" data={reportRank} loading={loading} />
        </div>

        {/* 职业偏好 */}
        <div className="bg-white border border-gray-200 rounded-xl p-6">
          <h2 className="font-semibold text-gray-800 mb-4">职业分类偏好</h2>
          {loading ? <Skeleton rows={6} /> : professions.length === 0 ? <Empty /> : (
            <div className="space-y-3">
              {professions.map(p => (
                <div key={p.name} className="flex items-center gap-3">
                  <span className="w-16 text-sm text-gray-600 text-right flex-shrink-0">{p.name}</span>
                  <div className="flex-1 bg-gray-100 rounded-full h-5 overflow-hidden">
                    <div className="h-full bg-blue-500 rounded-full transition-all" style={{ width: `${p.pct}%` }} />
                  </div>
                  <span className="w-8 text-sm text-gray-500 flex-shrink-0">{p.count}</span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* 访问趋势图 */}
        <div className="bg-white border border-gray-200 rounded-xl p-6">
          <h2 className="font-semibold text-gray-800 mb-4">
            访问趋势 — {periodIdx <= 1 ? '按小时' : '按天'}
          </h2>
          {loading ? <Skeleton rows={1} height="h-32" /> : (
            <>
              <div className="flex items-end gap-px h-32 overflow-x-auto">
                {trend.map((b, i) => (
                  <div key={i} className="flex-shrink-0 flex flex-col items-center justify-end group relative"
                    style={{ minWidth: trend.length > 48 ? '10px' : trend.length > 24 ? '14px' : '20px', height: '100%' }}>
                    <div className="absolute bottom-full mb-1 hidden group-hover:flex flex-col items-center z-10 pointer-events-none">
                      <div className="bg-gray-800 text-white text-xs rounded px-2 py-1 whitespace-nowrap">
                        {b.label}<br/>Visitors: {b.visitors} · Views: {b.views}
                      </div>
                    </div>
                    {/* Views 浅色（底层） */}
                    <div className="w-full rounded-sm" style={{ height: `${Math.max(b.viewsPct, b.views > 0 ? 3 : 0)}%`, background: '#c7dcf6' }} />
                    {/* Visitors 深色（叠在上面，实际是绝对定位覆盖底部） */}
                    <div className="w-full rounded-sm absolute bottom-0" style={{ height: `${Math.max(b.visitorsPct, b.visitors > 0 ? 3 : 0)}%`, background: '#5288df' }} />
                  </div>
                ))}
              </div>
              {/* X轴标签：只显示首尾和中间几个 */}
              <div className="flex justify-between text-xs text-gray-400 mt-2">
                <span>{trend[0]?.label}</span>
                <span>{trend[Math.floor(trend.length/2)]?.label}</span>
                <span>{trend[trend.length-1]?.label}</span>
              </div>
              {/* 图例 */}
              <div className="flex items-center gap-4 mt-3 justify-center">
                <span className="flex items-center gap-1.5 text-xs text-gray-500">
                  <span className="w-3 h-3 rounded-sm inline-block" style={{background:'#5288df'}} />Visitors
                </span>
                <span className="flex items-center gap-1.5 text-xs text-gray-500">
                  <span className="w-3 h-3 rounded-sm inline-block" style={{background:'#c7dcf6'}} />Views
                </span>
              </div>
            </>
          )}
        </div>

        {/* Visitors / Visits 折线图 */}
        <div className="bg-white border border-gray-200 rounded-xl p-6">
          <h2 className="font-semibold text-gray-800 mb-4">访客与访问次数趋势</h2>
          {loading ? <Skeleton rows={1} height="h-32" /> : <LineChart data={trend} />}
        </div>

        {/* 搜索关键词 */}
        <div className="bg-white border border-gray-200 rounded-xl p-6">
          <h2 className="font-semibold text-gray-800 mb-4">最近 100 条搜索词</h2>
          {loading ? <Skeleton rows={4} /> : searches.length === 0 ? <Empty /> : (
            <div className="flex flex-wrap gap-2">
              {searches.map((s, i) => (
                <span key={i} className="px-2.5 py-1 bg-gray-100 text-gray-700 rounded-full text-sm">{s}</span>
              ))}
            </div>
          )}
        </div>

      </div>
    </div>
  )
}

function RankTable({ title, data, loading }) {
  return (
    <div className="bg-white border border-gray-200 rounded-xl p-6">
      <h2 className="font-semibold text-gray-800 mb-4">{title}</h2>
      {loading ? <Skeleton rows={8} /> : data.length === 0 ? <Empty /> : (
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
                <td className="py-2 text-gray-400 text-xs">{i+1}</td>
                <td className="py-2 text-gray-700 truncate max-w-[160px]">{row.name}</td>
                <td className="py-2 text-right font-semibold text-gray-800">{row.count}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  )
}

function Skeleton({ rows = 4, height = 'h-4' }) {
  return (
    <div className="space-y-2">
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className={`skeleton ${height} rounded`} />
      ))}
    </div>
  )
}

function Empty() {
  return <p className="text-sm text-gray-400 py-4 text-center">暂无数据</p>
}

function LineChart({ data }) {
  if (!data.length) return <Empty />
  const W = 800, H = 120, PAD = 4
  const maxV = Math.max(...data.map(d => d.visitors), 1)
  const maxS = Math.max(...data.map(d => d.visits ?? d.visitors), 1)
  const maxAll = Math.max(maxV, maxS, 1)

  const pts = (key) => data.map((d, i) => {
    const x = PAD + (i / (data.length - 1 || 1)) * (W - PAD * 2)
    const y = H - PAD - (d[key] / maxAll) * (H - PAD * 2)
    return `${x},${y}`
  }).join(' ')

  const midIdx = Math.floor(data.length / 2)

  return (
    <>
      <div className="overflow-x-auto">
        <svg viewBox={`0 0 ${W} ${H}`} className="w-full" style={{ minWidth: 320, height: 120 }}>
          {/* 网格线 */}
          {[0.25, 0.5, 0.75, 1].map(r => (
            <line key={r} x1={PAD} x2={W - PAD} y1={H - PAD - r * (H - PAD * 2)} y2={H - PAD - r * (H - PAD * 2)} stroke="#F1F5F9" strokeWidth="1" />
          ))}
          {/* Visits 折线（浅蓝） */}
          <polyline points={pts('visits' in data[0] ? 'visits' : 'visitors')} fill="none" stroke="#a0c5f0" strokeWidth="2" strokeLinejoin="round" />
          {/* Visitors 折线（深蓝） */}
          <polyline points={pts('visitors')} fill="none" stroke="#5288df" strokeWidth="2" strokeLinejoin="round" />
          {/* 数据点 hover */}
          {data.map((d, i) => {
            const x = PAD + (i / (data.length - 1 || 1)) * (W - PAD * 2)
            const yV = H - PAD - (d.visitors / maxAll) * (H - PAD * 2)
            return <circle key={i} cx={x} cy={yV} r="3" fill="#5288df" opacity="0.7"><title>{d.label}: Visitors {d.visitors} · Visits {d.visits ?? d.visitors}</title></circle>
          })}
        </svg>
      </div>
      <div className="flex justify-between text-xs text-gray-400 mt-1">
        <span>{data[0]?.label}</span>
        <span>{data[midIdx]?.label}</span>
        <span>{data[data.length - 1]?.label}</span>
      </div>
      <div className="flex items-center gap-4 mt-3 justify-center">
        <span className="flex items-center gap-1.5 text-xs text-gray-500">
          <span className="w-6 h-0.5 inline-block" style={{ background: '#5288df' }} />Visitors
        </span>
        <span className="flex items-center gap-1.5 text-xs text-gray-500">
          <span className="w-6 h-0.5 inline-block" style={{ background: '#a0c5f0' }} />Visits
        </span>
      </div>
    </>
  )
}
