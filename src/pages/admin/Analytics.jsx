import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { supabase } from '../../lib/supabase'

const PERIODS = [
  { label: '今日', days: 1 },
  { label: '本周', days: 7 },
  { label: '本月', days: 30 },
]

function dayStart(daysAgo = 0) {
  const d = new Date()
  d.setDate(d.getDate() - daysAgo)
  d.setHours(0, 0, 0, 0)
  return d.toISOString()
}

async function query(eventType, since, select = '*', options = {}) {
  let q = supabase.from('analytics_events').select(select, options).eq('event_type', eventType).gte('created_at', since)
  return q
}

export default function Analytics() {
  const [overview, setOverview] = useState({ tool_click: 0, report_view: 0, search: 0, page_view: 0 })
  const [toolRank, setToolRank] = useState([])
  const [reportRank, setReportRank] = useState([])
  const [professions, setProfessions] = useState([])
  const [searches, setSearches] = useState([])
  const [trend, setTrend] = useState([])
  const [period, setPeriod] = useState(7)
  const [loading, setLoading] = useState(true)

  useEffect(() => { document.title = '数据分析 - TG AI工具库' }, [])

  useEffect(() => {
    setLoading(true)
    const since = dayStart(period - 1)
    const todayStart = dayStart(0)

    Promise.all([
      // 概览（今日）
      supabase.from('analytics_events').select('event_type').gte('created_at', todayStart),
      // 工具点击排行
      supabase.from('analytics_events').select('target_id, target_name').eq('event_type', 'tool_click').gte('created_at', since),
      // 报告阅读排行
      supabase.from('analytics_events').select('target_id, target_name').eq('event_type', 'report_view').gte('created_at', since),
      // 职业偏好
      supabase.from('analytics_events').select('profession').eq('event_type', 'profession_filter').gte('created_at', since).not('profession', 'is', null),
      // 搜索关键词
      supabase.from('analytics_events').select('search_query, created_at').eq('event_type', 'search').order('created_at', { ascending: false }).limit(100),
      // 过去30天趋势
      supabase.from('analytics_events').select('created_at').eq('event_type', 'page_view').gte('created_at', dayStart(29)),
    ]).then(([ov, tools, reports, profs, srch, trendData]) => {
      // 概览
      const ovData = ov.data || []
      setOverview({
        tool_click: ovData.filter(e => e.event_type === 'tool_click').length,
        report_view: ovData.filter(e => e.event_type === 'report_view').length,
        search: ovData.filter(e => e.event_type === 'search').length,
        page_view: ovData.filter(e => e.event_type === 'page_view').length,
      })

      // 工具排行
      const toolMap = {}
      ;(tools.data || []).forEach(e => {
        const k = e.target_id || e.target_name
        if (!k) return
        toolMap[k] = toolMap[k] || { name: e.target_name || e.target_id, count: 0 }
        toolMap[k].count++
      })
      setToolRank(Object.values(toolMap).sort((a, b) => b.count - a.count).slice(0, 20))

      // 报告排行
      const repMap = {}
      ;(reports.data || []).forEach(e => {
        const k = e.target_id || e.target_name
        if (!k) return
        repMap[k] = repMap[k] || { name: e.target_name || e.target_id, count: 0 }
        repMap[k].count++
      })
      setReportRank(Object.values(repMap).sort((a, b) => b.count - a.count).slice(0, 20))

      // 职业偏好
      const profMap = {}
      ;(profs.data || []).forEach(e => {
        if (!e.profession) return
        profMap[e.profession] = (profMap[e.profession] || 0) + 1
      })
      const profArr = Object.entries(profMap).sort((a, b) => b[1] - a[1])
      const maxProf = profArr[0]?.[1] || 1
      setProfessions(profArr.map(([name, count]) => ({ name, count, pct: Math.round(count / maxProf * 100) })))

      // 搜索
      setSearches((srch.data || []).map(e => e.search_query).filter(Boolean))

      // 趋势：过去30天每日
      const dayMap = {}
      for (let i = 29; i >= 0; i--) {
        const d = new Date(); d.setDate(d.getDate() - i)
        dayMap[d.toISOString().slice(0, 10)] = 0
      }
      ;(trendData.data || []).forEach(e => {
        const day = e.created_at.slice(0, 10)
        if (dayMap[day] !== undefined) dayMap[day]++
      })
      const trendArr = Object.entries(dayMap).map(([date, count]) => ({ date, count }))
      const maxTrend = Math.max(...trendArr.map(d => d.count), 1)
      setTrend(trendArr.map(d => ({ ...d, pct: Math.round(d.count / maxTrend * 100) })))
    }).catch(console.error).finally(() => setLoading(false))
  }, [period])

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

        {/* 概览卡片（今日） */}
        <div>
          <h2 className="text-sm font-semibold text-gray-500 mb-3">今日概览</h2>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            {[
              { label: '页面访问 (PV)', value: overview.page_view, color: 'text-green-600' },
              { label: '工具点击', value: overview.tool_click, color: 'text-blue-600' },
              { label: '报告阅读', value: overview.report_view, color: 'text-purple-600' },
              { label: '搜索次数', value: overview.search, color: 'text-orange-500' },
            ].map(c => (
              <div key={c.label} className="bg-white border border-gray-200 rounded-xl p-5">
                <div className={`text-3xl font-bold ${c.color} mb-1`}>{loading ? '—' : c.value}</div>
                <div className="text-sm text-gray-500">{c.label}</div>
              </div>
            ))}
          </div>
        </div>

        {/* 时间段切换 */}
        <div className="flex items-center gap-2">
          <span className="text-sm text-gray-500">统计周期：</span>
          {PERIODS.map(p => (
            <button key={p.days} onClick={() => setPeriod(p.days)}
              className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${period === p.days ? 'bg-blue-600 text-white' : 'bg-white border border-gray-200 text-gray-600 hover:border-blue-400'}`}>
              {p.label}
            </button>
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

        {/* 过去30天趋势 */}
        <div className="bg-white border border-gray-200 rounded-xl p-6">
          <h2 className="font-semibold text-gray-800 mb-4">过去 30 天页面访问趋势 (PV)</h2>
          {loading ? <Skeleton rows={1} height="h-24" /> : (
            <div className="flex items-end gap-0.5 h-24">
              {trend.map(d => (
                <div key={d.date} className="flex-1 flex flex-col items-center justify-end group relative" title={`${d.date}: ${d.count}`}>
                  <div className="w-full bg-blue-500 rounded-sm transition-all hover:bg-blue-600" style={{ height: `${Math.max(d.pct, d.count > 0 ? 4 : 0)}%` }} />
                  <div className="absolute bottom-full mb-1 hidden group-hover:block bg-gray-800 text-white text-xs rounded px-1.5 py-0.5 whitespace-nowrap z-10">
                    {d.date.slice(5)}: {d.count}
                  </div>
                </div>
              ))}
            </div>
          )}
          <div className="flex justify-between text-xs text-gray-400 mt-1">
            <span>{trend[0]?.date?.slice(5)}</span>
            <span>{trend[trend.length - 1]?.date?.slice(5)}</span>
          </div>
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
                <td className="py-2 text-gray-400 text-xs">{i + 1}</td>
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
