import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import Navbar from '../components/Navbar'
import Footer from '../components/Footer'
import ArticleCard from '../components/ArticleCard'
import { fetchLatestArticles, fetchTools, fetchToolCount, fetchCategoryCount } from '../lib/supabase'
import { useLang } from '../lib/i18n.jsx'

// ─── 职业分类数据 ────────────────
const CAREER_CATEGORIES = [
  { icon: '⚖️', nameKey: 'career_lawyer', descKey: 'career_lawyer_desc', link: '/tools?category=律师', category: '律师', color: 'from-blue-50 to-blue-100', border: 'border-blue-200', tag: 'bg-blue-100 text-blue-700' },
  { icon: '🎨', nameKey: 'career_designer', descKey: 'career_designer_desc', link: '/tools?category=设计师', category: '设计师', color: 'from-purple-50 to-purple-100', border: 'border-purple-200', tag: 'bg-purple-100 text-purple-700' },
  { icon: '💼', nameKey: 'career_accountant', descKey: 'career_accountant_desc', link: '/tools?category=会计', category: '会计', color: 'from-yellow-50 to-yellow-100', border: 'border-yellow-200', tag: 'bg-yellow-100 text-yellow-700' },
  { icon: '📣', nameKey: 'career_marketing', descKey: 'career_marketing_desc', link: '/tools?category=营销', category: '营销', color: 'from-orange-50 to-orange-100', border: 'border-orange-200', tag: 'bg-orange-100 text-orange-700' },
  { icon: '💻', nameKey: 'career_developer', descKey: 'career_developer_desc', link: '/tools?category=程序员', category: '程序员', color: 'from-blue-50 to-blue-100', border: 'border-blue-200', tag: 'bg-blue-100 text-blue-800' },
  { icon: '🎓', nameKey: 'career_student', descKey: 'career_student_desc', link: '/tools?category=学生', category: '学生', color: 'from-pink-50 to-pink-100', border: 'border-pink-200', tag: 'bg-pink-100 text-pink-700' },
]

function SectionHeader({ title, link }) {
  const { t } = useLang()
  return (
    <div className="flex items-center justify-between mb-6">
      <h2 className="text-xl font-bold text-gray-900">{title}</h2>
      <Link to={link} className="text-sm text-blue-700 hover:text-blue-800 font-medium flex items-center gap-1">
        {t('home_view_all')}
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
        </svg>
      </Link>
    </div>
  )
}

function CardSkeleton() {
  return (
    <div className="bg-white border border-gray-200 rounded-xl p-5">
      <div className="flex justify-between mb-3">
        <div className="skeleton h-3 w-24 rounded" />
        <div className="skeleton h-5 w-16 rounded" />
      </div>
      <div className="skeleton h-5 w-full rounded mb-2" />
      <div className="skeleton h-4 w-4/5 rounded mb-1" />
      <div className="skeleton h-4 w-2/3 rounded" />
    </div>
  )
}

export default function Home() {
  const [reports, setReports] = useState([])
  const [briefs, setBriefs] = useState([])
  const [recommended, setRecommended] = useState([])
  const [hotTools, setHotTools] = useState([])
  const [newTools, setNewTools] = useState([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [toolCount, setToolCount] = useState(0)
  const [categoryCount, setCategoryCount] = useState({})
  const { t, lang } = useLang()

  useEffect(() => {
    document.title = 'TG AI工具库 | 你的职业AI工具指南'
    setMetaDescription('TG AI工具库 - 只推荐实测好用的职业AI工具，覆盖律师、设计师、会计财税、营销运营、程序员、学生科研，全站内容免费浏览，无需登录。')
  }, [])

  useEffect(() => {
    // 主要内容加载
    Promise.all([
      fetchLatestArticles('report', 6),
      fetchLatestArticles('brief', 6),
      fetchToolCount(),
      fetchTools({ sort: 'recommended', limit: 8 }),
      fetchTools({ sort: 'is_hot', limit: 8 }),
      fetchTools({ sort: 'newest', limit: 8 }),
    ])
      .then(([r, b, count, { data: recommended }, { data: hot }, { data: newest }]) => {
        setReports(r)
        setBriefs(b)
        setToolCount(count)
        setRecommended(recommended)
        setHotTools(hot)
        setNewTools(newest)
      })
      .catch(console.error)
      .finally(() => setLoading(false))

    // 分类数量异步加载，不阻塞页面渲染
    fetchCategoryCount()
      .then(catCount => setCategoryCount(catCount))
      .catch(console.error)
  }, [])

  const handleSearch = (e) => {
    e.preventDefault()
    if (searchQuery.trim()) {
      window.location.href = `/tools?q=${encodeURIComponent(searchQuery.trim())}`
    }
  }

  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      <Navbar />

      {/* ── 头部横幅 ── */}
      <header className="bg-gradient-to-br from-blue-700 via-blue-600 to-teal-500 text-white">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-14 sm:py-20 text-center">
          <h1 className="text-3xl sm:text-5xl font-extrabold leading-tight mb-3 tracking-tight">
            {t('home_hero_title')}
          </h1>
          <p className="text-base sm:text-lg text-blue-50 mb-8">
            {t('home_hero_sub')}
          </p>
          <form onSubmit={handleSearch} className="max-w-xl mx-auto flex gap-2 mb-8">
            <input type="text" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={t('home_search_placeholder')}
              className="flex-1 px-4 py-3 rounded-xl text-gray-800 text-sm focus:outline-none focus:ring-2 focus:ring-white/60 placeholder-gray-400" />
            <button type="submit" className="px-5 py-3 bg-white text-blue-800 font-semibold rounded-xl text-sm hover:bg-blue-50 transition-colors whitespace-nowrap">
              {t('home_search_btn')}
            </button>
          </form>
          <div className="flex flex-wrap justify-center gap-3 sm:gap-6 text-sm text-blue-50">
            <span className="flex items-center gap-1.5">
              <svg className="w-4 h-4 text-blue-200" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd"/></svg>
              已收录{toolCount > 0 ? toolCount : ''}款职业专用AI工具
            </span>
            {['home_tag2','home_tag3','home_tag4'].map(k => (
              <span key={k} className="flex items-center gap-1.5">
                <svg className="w-4 h-4 text-blue-200" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd"/></svg>
                {t(k)}
              </span>
            ))}
          </div>
        </div>
      </header>

      <main className="flex-1 max-w-6xl mx-auto w-full px-4 sm:px-6 py-10">

        {/* ── 核心职业分类 ── */}
        <section className="mb-14">
          <div className="text-center mb-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-2">{t('home_career_title')}</h2>
            <p className="text-gray-500 text-sm">{t('home_career_sub')}</p>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
            {CAREER_CATEGORIES.map((cat) => (
              <Link
                key={cat.nameKey}
                to={cat.link}
                className={`article-card flex flex-col items-center text-center p-4 rounded-xl bg-gradient-to-b ${cat.color} border ${cat.border} no-underline`}
              >
                <span className="text-3xl mb-2">{cat.icon}</span>
                <span className={`text-base font-semibold px-2 py-0.5 rounded-full mb-1 ${cat.tag}`}>
                  {t(cat.nameKey)}
                </span>
                {categoryCount[cat.category] && (
                  <span className="text-sm font-bold text-gray-700">【{categoryCount[cat.category]} 款工具】</span>
                )}
                <p className="text-xs text-gray-600 leading-relaxed hidden sm:block mt-1">{t(cat.descKey)}</p>
              </Link>
            ))}
          </div>
          {/* 移动端显示描述 */}
          <div className="grid grid-cols-1 gap-3 mt-3 sm:hidden">
            {CAREER_CATEGORIES.map((cat) => (
              <Link
                key={`desc-${cat.nameKey}`}
                to={cat.link}
                className="flex items-start gap-3 bg-white border border-gray-100 rounded-xl p-4 no-underline"
              >
                <span className="text-2xl flex-shrink-0">{cat.icon}</span>
                <div>
                  <span className="font-semibold text-gray-800 text-sm block mb-0.5">
                    {t(cat.nameKey)}
                  </span>
                  {categoryCount[cat.category] && (
                    <span className="text-sm font-bold text-gray-700 block mb-1">【{categoryCount[cat.category]} 款工具】</span>
                  )}
                  <span className="text-xs text-gray-500">{t(cat.descKey)}</span>
                </div>
              </Link>
            ))}
          </div>
        </section>

        {/* ── 今日AI工具简报 ── */}
        <section className="mb-14">
          <SectionHeader title={t('home_briefs_title')} link="/daily-briefs" />
          <div className="mb-4 text-sm text-gray-500">{t('home_briefs_sub')}</div>
          {loading ? (
            <div className="flex gap-4 overflow-x-auto pb-2">
              {Array.from({ length: 4 }).map((_, i) => <CardSkeleton key={i} />)}
            </div>
          ) : briefs.length === 0 ? (
            <div className="text-center py-12 text-gray-400"><p>{t('home_no_briefs')}</p></div>
          ) : (
            <div className="marquee-wrap">
              <div className="marquee-track" style={{ animationDuration: `${briefs.length * 4}s` }}>
                {[...briefs, ...briefs].map((item, idx) => (
                  <div key={idx} className="flex-shrink-0 w-72" style={{ marginRight: '1rem' }}>
                    <ArticleCard article={item} type="brief" />
                  </div>
                ))}
              </div>
            </div>
          )}
        </section>

        {/* ── 工具行业报告 ── */}
        <section className="mb-10">
          <SectionHeader title={t('home_reports_title')} link="/industry-reports" />
          <div className="mb-4 text-sm text-gray-500">{t('home_reports_sub')}</div>
          {loading ? (
            <div className="flex gap-4 overflow-x-auto pb-2">
              {Array.from({ length: 4 }).map((_, i) => <CardSkeleton key={i} />)}
            </div>
          ) : reports.length === 0 ? (
            <div className="text-center py-12 text-gray-400"><p>{t('home_no_reports')}</p></div>
          ) : (
            <div className="marquee-wrap">
              <div className="marquee-track" style={{ animationDuration: `${reports.length * 4}s` }}>
                {[...reports, ...reports].map((item, idx) => (
                  <div key={idx} className="flex-shrink-0 w-72" style={{ marginRight: '1rem' }}>
                    <ArticleCard article={item} type="report" />
                  </div>
                ))}
              </div>
            </div>
          )}
        </section>

        {[
          { title: t('home_recommended'), tools: recommended },
          { title: t('home_hot'), tools: hotTools },
          { title: t('home_new'), tools: newTools },
        ].map(({ title, tools }) => (
          <section key={title} className="mb-14">
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-xl font-bold text-gray-900">{title}</h2>
              <Link to="/tools" className="text-sm text-blue-600 hover:text-blue-700 font-medium flex items-center gap-1">
                {t('home_view_all')}
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </Link>
            </div>
            {loading ? (
              <div className="flex gap-4 overflow-x-auto pb-2">
                {Array.from({ length: 4 }).map((_, i) => (
                  <div key={i} className="flex-shrink-0 w-56 bg-white border border-gray-200 rounded-xl p-4">
                    <div className="skeleton w-10 h-10 rounded-xl mb-3" />
                    <div className="skeleton h-4 w-3/4 rounded mb-2" />
                    <div className="skeleton h-3 w-full rounded mb-1" />
                    <div className="skeleton h-3 w-2/3 rounded" />
                  </div>
                ))}
              </div>
            ) : tools.length === 0 ? (
              <p className="text-gray-400 text-sm py-6">{t('home_no_tools')}</p>
            ) : (
              <div className="marquee-wrap">
                <div className="marquee-track" style={{ animationDuration: `${tools.length * 4}s` }}>
                  {[...tools, ...tools].map((tool, idx) => {
                    const toolName = (lang === 'en' && tool.name_en) ? tool.name_en : tool.name
                    const toolDesc = (lang === 'en' && tool.description_en) ? tool.description_en : tool.description
                    return (
                    <Link key={idx} to={`/tools?q=${encodeURIComponent(tool.name)}`}
                      className="flex-shrink-0 w-56 bg-white border border-gray-200 rounded-xl p-4 hover:shadow-md transition-shadow no-underline" style={{ marginRight: '1rem' }}>
                      <div className="flex items-center gap-3 mb-3">
                        {tool.icon_url ? (
                          <img src={tool.icon_url} alt={toolName} className="w-10 h-10 rounded-xl object-cover flex-shrink-0" />
                        ) : (
                          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-blue-700 flex items-center justify-center text-white font-bold text-sm flex-shrink-0">
                            {toolName.charAt(0)}
                          </div>
                        )}
                        <div className="min-w-0">
                          <div className="font-semibold text-gray-800 text-sm truncate">{toolName}</div>
                          <div className="flex items-center gap-1 mt-0.5">
                            <svg className="w-3 h-3 text-yellow-400" fill="currentColor" viewBox="0 0 20 20">
                              <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                            </svg>
                            <span className="text-xs text-gray-500">{Number(tool.rating).toFixed(1)}</span>
                            <span className="text-xs text-gray-300 mx-1">·</span>
                            <span className={`text-xs font-medium ${tool.price === '免费' ? 'text-blue-700' : 'text-gray-500'}`}>{tool.price}</span>
                          </div>
                        </div>
                      </div>
                      <p className="text-xs text-gray-500 leading-relaxed line-clamp-2">{toolDesc}</p>
                    </Link>
                    )
                  })}
                </div>
              </div>
            )}
          </section>
        ))}

      </main>

      <Footer />
    </div>
  )
}

function setMetaDescription(content) {
  let el = document.querySelector('meta[name="description"]')
  if (!el) {
    el = document.createElement('meta')
    el.setAttribute('name', 'description')
    document.head.appendChild(el)
  }
  el.setAttribute('content', content)
}
