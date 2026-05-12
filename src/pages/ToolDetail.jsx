import { useEffect, useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import Navbar from '../components/Navbar'
import Footer from '../components/Footer'
import { supabase } from '../lib/supabase'
import { useLang } from '../lib/i18n.jsx'

function injectToolJsonLD(tool) {
  const el = document.getElementById('json-ld-tool')
  if (el) el.remove()
  const s = document.createElement('script')
  s.id = 'json-ld-tool'
  s.type = 'application/ld+json'
  s.text = JSON.stringify({
    '@context': 'https://schema.org',
    '@type': 'SoftwareApplication',
    name: tool.name,
    description: tool.description,
    url: tool.official_url || `https://tgaide.com/tools/${tool.slug}`,
    applicationCategory: 'BusinessApplication',
    offers: tool.price ? { '@type': 'Offer', price: tool.price === '免费' ? '0' : tool.price, priceCurrency: 'CNY' } : undefined,
    aggregateRating: tool.rating ? { '@type': 'AggregateRating', ratingValue: tool.rating, bestRating: 5 } : undefined,
    publisher: { '@type': 'Organization', name: 'TG AI工具库', url: 'https://tgaide.com' },
  })
  document.head.appendChild(s)
}

function setCanonical(slug) {
  let el = document.querySelector('link[rel="canonical"]')
  if (!el) { el = document.createElement('link'); el.rel = 'canonical'; document.head.appendChild(el) }
  el.href = `https://tgaide.com/tools/${slug}`
}

export default function ToolDetail() {
  const { slug } = useParams()
  const [tool, setTool] = useState(null)
  const [related, setRelated] = useState([])
  const [loading, setLoading] = useState(true)
  const [notFound, setNotFound] = useState(false)
  const { lang, t } = useLang()

  useEffect(() => {
    supabase.from('tools').select('*').eq('slug', slug).eq('status', 'active').single()
      .then(({ data, error }) => {
        if (error || !data) { setNotFound(true); return }
        setTool(data)
        const title = `${data.name} - AI工具详情 | TG AI工具库`
        document.title = title
        let metaDesc = document.querySelector('meta[name="description"]')
        if (!metaDesc) { metaDesc = document.createElement('meta'); metaDesc.name = 'description'; document.head.appendChild(metaDesc) }
        metaDesc.content = data.description || data.short_tag || ''
        injectToolJsonLD(data)
        setCanonical(slug)

        supabase.from('tools')
          .select('id,name,slug,icon_url,rating,short_tag,category')
          .eq('category', data.category).eq('status', 'active').neq('id', data.id)
          .not('slug', 'is', null)
          .order('rating', { ascending: false }).order('sort_order', { ascending: false })
          .limit(3)
          .then(({ data: rel }) => setRelated(rel || []))
      })
      .finally(() => setLoading(false))
  }, [slug])

  if (loading) return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      <Navbar />
      <main className="flex-1 max-w-3xl mx-auto w-full px-4 py-10">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-gray-200 rounded w-1/2" />
          <div className="h-4 bg-gray-200 rounded w-full" />
          <div className="h-4 bg-gray-200 rounded w-4/5" />
        </div>
      </main>
      <Footer />
    </div>
  )

  if (notFound) return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      <Navbar />
      <main className="flex-1 flex items-center justify-center">
        <div className="text-center">
          <div className="text-4xl mb-3">🔍</div>
          <p className="text-gray-500 mb-4">{t('tool_not_found')}</p>
          <Link to="/tools" className="text-blue-600 hover:underline text-sm">{t('compare_back')}</Link>
        </div>
      </main>
      <Footer />
    </div>
  )

  const desc = (lang === 'en' && tool.description_en) ? tool.description_en : tool.description
  const toList = v => Array.isArray(v) ? v : (v ? v.split('\n').filter(Boolean) : [])
  const highlights = toList(tool.highlights)
  const drawbacks = toList(tool.drawbacks)

  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      <Navbar />
      <main className="flex-1 max-w-3xl mx-auto w-full px-4 sm:px-6 py-8">
        <nav className="flex items-center gap-2 text-sm text-gray-400 mb-6">
          <Link to="/" className="hover:text-blue-700">{t('article_home')}</Link>
          <span>/</span>
          <Link to="/tools" className="hover:text-blue-700">{t('nav_tools')}</Link>
          <span>/</span>
          <span className="text-gray-600">{tool.name}</span>
        </nav>

        {/* 头部 */}
        <div className="bg-white border border-gray-200 rounded-2xl p-6 mb-5">
          <div className="flex items-start gap-4">
            {tool.icon_url
              ? <img src={tool.icon_url} alt={tool.name} className="w-16 h-16 rounded-xl object-cover flex-shrink-0" />
              : <div className="w-16 h-16 rounded-xl bg-gradient-to-br from-blue-400 to-blue-600 flex items-center justify-center text-white font-bold text-2xl flex-shrink-0">{tool.name.charAt(0)}</div>
            }
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap mb-1">
                <h1 className="text-2xl font-bold text-gray-900">{tool.name}</h1>
                {tool.short_tag && <span className="tag-pill">{tool.short_tag}</span>}
                {tool.is_recommended && <span className="tag-pill tag-pill-green">TG推荐</span>}
              </div>
              <p className="text-gray-500 text-sm mb-3">{tool.category} · {tool.price || '价格未知'}</p>
              <p className="text-gray-700 text-sm leading-relaxed">{desc}</p>
            </div>
          </div>
          {tool.official_url && (
            <div className="mt-4 pt-4 border-t border-gray-100">
              <a href={tool.official_url} target="_blank" rel="noopener noreferrer"
                className="inline-flex items-center gap-2 px-4 py-2 btn-primary text-sm font-medium rounded-lg transition-colors">
                {t('tool_visit')} ↗
              </a>
            </div>
          )}
        </div>

        {/* JTBD / TG建议 */}
        {tool.tg_advice && (
          <div className="bg-amber-50 border border-amber-200 rounded-2xl p-5 mb-5">
            <h2 className="text-sm font-semibold text-amber-800 mb-2">{t('tool_tg_advice')}</h2>
            <p className="text-sm text-amber-700 leading-relaxed">{tool.tg_advice}</p>
          </div>
        )}

        {/* 核心亮点 & 缺点 */}
        {(highlights.length > 0 || drawbacks.length > 0) && (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-5">
            {highlights.length > 0 && (
              <div className="bg-white border border-gray-200 rounded-2xl p-5">
                <h2 className="text-sm font-semibold text-gray-700 mb-3">{t('tool_highlights')}</h2>
                <ul className="space-y-2">
                  {highlights.map((h, i) => (
                    <li key={i} className="flex items-start gap-2 text-sm text-gray-600">
                      <span className="text-emerald-500 mt-0.5">✓</span>{h}
                    </li>
                  ))}
                </ul>
              </div>
            )}
            {drawbacks.length > 0 && (
              <div className="bg-white border border-gray-200 rounded-2xl p-5">
                <h2 className="text-sm font-semibold text-gray-700 mb-3">{t('tool_drawbacks')}</h2>
                <ul className="space-y-2">
                  {drawbacks.map((d, i) => (
                    <li key={i} className="flex items-start gap-2 text-sm text-gray-600">
                      <span className="text-orange-400 mt-0.5">!</span>{d}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        )}

        {/* 完整描述 */}
        {tool.full_desc && (
          <div className="bg-white border border-gray-200 rounded-2xl p-5 mb-5">
            <h2 className="text-sm font-semibold text-gray-700 mb-3">{t('tool_full_desc')}</h2>
            <p className="text-sm text-gray-600 leading-relaxed whitespace-pre-line">{tool.full_desc}</p>
          </div>
        )}

        {related.length > 0 && (
          <div className="bg-white border border-gray-200 rounded-2xl p-5 mb-5">
            <h2 className="text-sm font-semibold text-gray-700 mb-3">与同类工具对比</h2>
            <div className="flex flex-wrap gap-2">
              {related.map(r => (
                <Link key={r.id} to={`/compare/${tool.slug}-vs-${r.slug}`}
                  className="inline-flex items-center gap-2 px-3 py-2 bg-gray-50 hover:bg-blue-50 hover:text-blue-700 border border-gray-200 rounded-lg text-sm text-gray-700 transition-colors">
                  {tool.name} vs {r.name} →
                </Link>
              ))}
            </div>
          </div>
        )}

        <div className="text-center mt-8">
          <Link to="/tools" className="text-sm text-gray-400 hover:text-blue-600">← 返回工具列表</Link>
        </div>
      </main>
      <Footer />
    </div>
  )
}
