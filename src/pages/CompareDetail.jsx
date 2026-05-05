import { useEffect, useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import Navbar from '../components/Navbar'
import Footer from '../components/Footer'
import { supabase } from '../lib/supabase'

function setCanonical(pair) {
  let el = document.querySelector('link[rel="canonical"]')
  if (!el) { el = document.createElement('link'); el.rel = 'canonical'; document.head.appendChild(el) }
  el.href = `https://tgaide.com/compare/${pair}`
}

function injectCompareJsonLD(a, b) {
  const el = document.getElementById('json-ld-compare')
  if (el) el.remove()
  const s = document.createElement('script')
  s.id = 'json-ld-compare'
  s.type = 'application/ld+json'
  s.text = JSON.stringify({
    '@context': 'https://schema.org', '@type': 'WebPage',
    name: `${a.name} vs ${b.name} 对比 | TG AI工具库`,
    description: `深度对比 ${a.name} 和 ${b.name} 的功能、价格、适用场景，帮你选出最适合的 AI 工具。`,
    url: `https://tgaide.com/compare/${a.slug}-vs-${b.slug}`,
  })
  document.head.appendChild(s)
}

const FIELDS = [
  { key: 'category', label: '职业分类' },
  { key: 'price', label: '价格' },
  { key: 'rating', label: '评分' },
  { key: 'description', label: '简介' },
  { key: 'short_tag', label: '核心标签' },
]

export default function CompareDetail() {
  const { pair } = useParams()
  const [tools, setTools] = useState([null, null])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(false)

  useEffect(() => {
    const match = pair?.match(/^(.+)-vs-(.+)$/)
    if (!match) { setError(true); setLoading(false); return }
    const [, slugA, slugB] = match
    Promise.all([
      supabase.from('tools').select('*').eq('slug', slugA).eq('status', 'active').single(),
      supabase.from('tools').select('*').eq('slug', slugB).eq('status', 'active').single(),
    ]).then(([resA, resB]) => {
      if (!resA.data || !resB.data) { setError(true); return }
      setTools([resA.data, resB.data])
      document.title = `${resA.data.name} vs ${resB.data.name} 深度对比 | TG AI工具库`
      let metaDesc = document.querySelector('meta[name="description"]')
      if (!metaDesc) { metaDesc = document.createElement('meta'); metaDesc.name = 'description'; document.head.appendChild(metaDesc) }
      metaDesc.content = `深度对比 ${resA.data.name} 和 ${resB.data.name}，功能、价格、适用场景全面分析。`
      injectCompareJsonLD(resA.data, resB.data)
      setCanonical(pair)
    }).finally(() => setLoading(false))
  }, [pair])

  if (loading) return (
    <div className="min-h-screen flex flex-col bg-gray-50"><Navbar />
      <main className="flex-1 max-w-4xl mx-auto w-full px-4 py-10">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-gray-200 rounded w-1/2" />
          <div className="h-40 bg-gray-200 rounded" />
        </div>
      </main><Footer />
    </div>
  )

  if (error || !tools[0] || !tools[1]) return (
    <div className="min-h-screen flex flex-col bg-gray-50"><Navbar />
      <main className="flex-1 flex items-center justify-center">
        <div className="text-center">
          <div className="text-4xl mb-3">🔍</div>
          <p className="text-gray-500 mb-4">对比工具不存在</p>
          <Link to="/tools" className="text-blue-600 hover:underline text-sm">返回工具列表</Link>
        </div>
      </main><Footer />
    </div>
  )

  const [a, b] = tools

  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      <Navbar />
      <main className="flex-1 max-w-4xl mx-auto w-full px-4 sm:px-6 py-8">
        <nav className="flex items-center gap-2 text-sm text-gray-400 mb-6">
          <Link to="/" className="hover:text-blue-700">首页</Link>
          <span>/</span>
          <Link to="/tools" className="hover:text-blue-700">AI工具库</Link>
          <span>/</span>
          <span className="text-gray-600">{a.name} vs {b.name}</span>
        </nav>

        <h1 className="text-2xl font-bold text-gray-900 mb-2">{a.name} vs {b.name} 深度对比</h1>
        <p className="text-gray-500 text-sm mb-8">帮你选出最适合的 AI 工具，省去踩坑时间</p>

        {/* 头部卡片 */}
        <div className="grid grid-cols-2 gap-4 mb-6">
          {[a, b].map(tool => (
            <div key={tool.id} className="bg-white border border-gray-200 rounded-2xl p-5 text-center">
              {tool.icon_url
                ? <img src={tool.icon_url} alt={tool.name} className="w-14 h-14 rounded-xl object-cover mx-auto mb-3" />
                : <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-blue-400 to-blue-600 flex items-center justify-center text-white font-bold text-xl mx-auto mb-3">{tool.name.charAt(0)}</div>
              }
              <h2 className="font-bold text-gray-900 mb-1">{tool.name}</h2>
              <p className="text-xs text-gray-400">{tool.price || '—'}</p>
              {tool.official_url && (
                <a href={tool.official_url} target="_blank" rel="noopener noreferrer"
                  className="mt-3 inline-block text-xs text-blue-600 hover:underline">访问官网 ↗</a>
              )}
            </div>
          ))}
        </div>

        {/* 对比表格 */}
        <div className="bg-white border border-gray-200 rounded-2xl overflow-hidden mb-6">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-100">
                <th className="text-left px-4 py-3 text-gray-500 font-medium w-1/4">对比项</th>
                <th className="text-center px-4 py-3 text-gray-800 font-semibold">{a.name}</th>
                <th className="text-center px-4 py-3 text-gray-800 font-semibold">{b.name}</th>
              </tr>
            </thead>
            <tbody>
              {FIELDS.map(({ key, label }) => (
                <tr key={key} className="border-b border-gray-50 last:border-0">
                  <td className="px-4 py-3 text-gray-500">{label}</td>
                  <td className="px-4 py-3 text-center text-gray-700">{a[key] || '—'}</td>
                  <td className="px-4 py-3 text-center text-gray-700">{b[key] || '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* 优劣势 */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
          {[a, b].map(tool => {
            const toList = v => Array.isArray(v) ? v : (v ? v.split('\n').filter(Boolean) : [])
            const pros = toList(tool.highlights)
            const cons = toList(tool.drawbacks)
            return (
              <div key={tool.id} className="bg-white border border-gray-200 rounded-2xl p-5">
                <h3 className="font-semibold text-gray-800 mb-3">{tool.name}</h3>
                {pros.length > 0 && (
                  <ul className="space-y-1 mb-3">
                    {pros.map((p, i) => <li key={i} className="flex items-start gap-2 text-xs text-gray-600"><span className="text-emerald-500">✓</span>{p}</li>)}
                  </ul>
                )}
                {cons.length > 0 && (
                  <ul className="space-y-1">
                    {cons.map((c, i) => <li key={i} className="flex items-start gap-2 text-xs text-gray-500"><span className="text-orange-400">!</span>{c}</li>)}
                  </ul>
                )}
                {pros.length === 0 && cons.length === 0 && <p className="text-xs text-gray-400">暂无详细数据</p>}
              </div>
            )
          })}
        </div>

        {/* TG建议 */}
        {(a.tg_advice || b.tg_advice) && (
          <div className="bg-amber-50 border border-amber-200 rounded-2xl p-5 mb-6">
            <h3 className="text-sm font-semibold text-amber-800 mb-3">TG 选型建议</h3>
            {a.tg_advice && <p className="text-sm text-amber-700 mb-2"><strong>{a.name}：</strong>{a.tg_advice}</p>}
            {b.tg_advice && <p className="text-sm text-amber-700"><strong>{b.name}：</strong>{b.tg_advice}</p>}
          </div>
        )}

        <div className="text-center">
          <Link to="/tools" className="text-sm text-gray-400 hover:text-blue-600">← 返回工具列表</Link>
        </div>
      </main>
      <Footer />
    </div>
  )
}
