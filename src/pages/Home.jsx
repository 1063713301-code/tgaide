import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import Navbar from '../components/Navbar'
import Footer from '../components/Footer'
import ArticleCard from '../components/ArticleCard'
import { fetchLatestArticles, fetchTools, fetchToolCount, fetchCategoryCount, fetchLatestSelections } from '../lib/supabase'
import { useLang } from '../lib/i18n.jsx'
import { SELECTION_SCENES, SCENE_ICONS } from './AIToolSelection'
import { setSEO, orgJsonLD } from '../lib/seo'

const CAREER_ICONS = {
  lawyer:     <svg className="w-6 h-6" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M12 3v18M5 7l7-4 7 4M5 7l3.5 7H1.5L5 7zM19 7l3.5 7h-7L19 7z"/><line x1="3" y1="21" x2="21" y2="21"/></svg>,
  designer:   <svg className="w-6 h-6" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><circle cx="13.5" cy="6.5" r="2.5"/><path d="M17.44 10.44l-9.88 9.88a2 2 0 01-2.83-2.83l9.88-9.88"/><path d="M3 21l3-1-2-2-1 3z"/></svg>,
  accountant: <svg className="w-6 h-6" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><line x1="3" y1="21" x2="21" y2="21"/><line x1="3" y1="3" x2="3" y2="21"/><polyline points="7,16 7,10 12,10 12,5 17,5 17,16"/></svg>,
  marketing:  <svg className="w-6 h-6" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M22 12A10 10 0 1112 2"/><path d="M22 2L12 12"/><circle cx="12" cy="12" r="3"/></svg>,
  developer:  <svg className="w-6 h-6" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><polyline points="16 18 22 12 16 6"/><polyline points="8 6 2 12 8 18"/></svg>,
  student:    <svg className="w-6 h-6" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M2 3h6a4 4 0 014 4v14a3 3 0 00-3-3H2z"/><path d="M22 3h-6a4 4 0 00-4 4v14a3 3 0 013-3h7z"/></svg>,
}

// ─── 职业分类数据 ────────────────
const CAREER_CATEGORIES = [
  { key: 'lawyer',     iconBg: 'bg-blue-500',    nameKey: 'career_lawyer',     descKey: 'career_lawyer_desc',     link: '/tools?category=律师',   category: '律师',   color: 'from-blue-50 to-blue-100',     border: 'border-blue-200',   tag: 'bg-blue-100 text-blue-700'     },
  { key: 'designer',   iconBg: 'bg-violet-500',  nameKey: 'career_designer',   descKey: 'career_designer_desc',   link: '/tools?category=设计师', category: '设计师', color: 'from-purple-50 to-purple-100', border: 'border-purple-200', tag: 'bg-purple-100 text-purple-700' },
  { key: 'accountant', iconBg: 'bg-amber-500',   nameKey: 'career_accountant', descKey: 'career_accountant_desc', link: '/tools?category=会计',   category: '会计',   color: 'from-yellow-50 to-yellow-100', border: 'border-yellow-200', tag: 'bg-yellow-100 text-yellow-700' },
  { key: 'marketing',  iconBg: 'bg-orange-500',  nameKey: 'career_marketing',  descKey: 'career_marketing_desc',  link: '/tools?category=营销',   category: '营销',   color: 'from-orange-50 to-orange-100', border: 'border-orange-200', tag: 'bg-orange-100 text-orange-700' },
  { key: 'developer',  iconBg: 'bg-emerald-500', nameKey: 'career_developer',  descKey: 'career_developer_desc',  link: '/tools?category=程序员', category: '程序员', color: 'from-blue-50 to-blue-100',     border: 'border-blue-200',   tag: 'bg-blue-100 text-blue-800'     },
  { key: 'student',    iconBg: 'bg-rose-500',    nameKey: 'career_student',    descKey: 'career_student_desc',    link: '/tools?category=学生',   category: '学生',   color: 'from-pink-50 to-pink-100',     border: 'border-pink-200',   tag: 'bg-pink-100 text-pink-700'     },
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
  const [recommended, setRecommended] = useState([])
  const [hotTools, setHotTools] = useState([])
  const [newTools, setNewTools] = useState([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [toolCount, setToolCount] = useState(0)
  const [categoryCount, setCategoryCount] = useState({})
  const [latestSelections, setLatestSelections] = useState({})
  const { t, lang } = useLang()

  useEffect(() => {
    setSEO({
      title: 'TG AI工具库 | 职场人专属 AI 工具指南，效率翻倍神器库',
      description: 'TG AI工具库 - 只推荐实测好用的职业AI工具，覆盖律师、设计师、会计财税、营销运营、程序员、学生科研，全站内容免费浏览，无需登录。',
      path: '/',
      jsonLD: [
        orgJsonLD,
        {
          '@context': 'https://schema.org', '@type': 'WebSite',
          name: 'TG AI工具库', url: 'https://tgaide.com',
          potentialAction: {
            '@type': 'SearchAction',
            target: 'https://tgaide.com/tools?q={search_term_string}',
            'query-input': 'required name=search_term_string',
          },
        },
      ],
    })
  }, [])

  useEffect(() => {
    // 主要内容加载
    Promise.all([
      fetchLatestArticles('report', 6),
      fetchToolCount(),
      fetchTools({ sort: 'recommended', limit: 8 }),
      fetchTools({ sort: 'is_hot', limit: 8 }),
      fetchTools({ sort: 'newest', limit: 8 }),
    ])
      .then(([r, count, { data: recommended }, { data: hot }, { data: newest }]) => {
        setReports(r)
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

    // 选型速查异步加载
    fetchLatestSelections().then(setLatestSelections).catch(() => {})
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
        <div className="max-w-[1200px] mx-auto px-4 sm:px-6 py-14 sm:py-20 text-center">
          <h1 className="text-3xl sm:text-5xl font-extrabold leading-tight mb-3 tracking-tight text-white" style={{color:'#fff'}}>
            {t('home_hero_title')}
          </h1>
          <p className="text-base sm:text-lg mb-8 text-white" style={{color:'#fff'}}>
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

      <main className="flex-1 max-w-[1200px] mx-auto w-full px-4 sm:px-6 py-10">

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
                <div className={`w-10 h-10 rounded-xl ${cat.iconBg} flex items-center justify-center mb-2 shadow-sm`}>
                  {CAREER_ICONS[cat.key]}
                </div>
                <span className="text-lg font-bold text-gray-800 mb-1">
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
                <div className={`w-9 h-9 rounded-xl ${cat.iconBg} flex items-center justify-center flex-shrink-0 shadow-sm`}>
                  {CAREER_ICONS[cat.key]}
                </div>
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

        {/* ── 选型速查 ── */}
        <section className="mb-14">
          <div className="text-center mb-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-2">AI工具选型速查</h2>
            <p className="text-gray-500 text-sm">成熟场景化工具组合，直接落地使用</p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {SELECTION_SCENES.map((scene) => {
              const item = latestSelections[scene.slug]
              return (
                <Link
                  key={scene.slug}
                  to={`/ai-tool-selection/${scene.slug}`}
                  className={`article-card flex flex-col p-5 rounded-xl bg-gradient-to-b ${scene.color} border ${scene.border} no-underline`}
                >
                  <div className="flex items-center gap-3 mb-2">
                    <div className={`w-8 h-8 rounded-lg ${scene.iconBg} flex items-center justify-center flex-shrink-0`}>
                      {SCENE_ICONS[scene.slug]}
                    </div>
                    <span className="text-lg font-bold text-gray-800">{scene.title}</span>
                  </div>
                  <p className="text-xs text-gray-500 mb-2">{scene.desc}</p>
                  {item?.summary && (
                    <p className="text-xs text-gray-600 leading-relaxed line-clamp-2">{item.summary}</p>
                  )}
                </Link>
              )
            })}
          </div>
          <div className="text-center mt-8">
            <Link
              to="/ai-tool-selection"
              className="inline-block px-8 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-white text-sm font-semibold rounded-full hover:from-blue-700 hover:to-indigo-700 transition-all shadow-md"
            >
              查看完整选型建议
            </Link>
          </div>
        </section>

        {/* ── 最新行业报告 ── */}
        <section className="mb-10">
          <SectionHeader title="📊 最新行业报告" link="/industry-reports" />
          <div className="mb-4 text-sm text-gray-500">收录最新职业AI工具实测及行业发展报告，含周报、月报、季报</div>
          {loading ? (
            <div className="flex gap-4 overflow-x-auto pb-2">
              {Array.from({ length: 4 }).map((_, i) => <CardSkeleton key={i} />)}
            </div>
          ) : reports.length === 0 ? (
            <div className="text-center py-12 text-gray-400"><p>{t('home_no_reports')}</p></div>
          ) : (
            <div className="marquee-wrap">
              <div className="marquee-track" style={{ animationDuration: `${reports.length * 8}s` }}>
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
                  <div key={i} className="flex-shrink-0 w-56 rounded-xl p-4" style={{background:'rgba(255,255,255,0.55)',border:'1px solid rgba(255,255,255,0.8)'}}>
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
                <div className="marquee-track" style={{ animationDuration: `${tools.length * 8}s` }}>
                  {[...tools, ...tools].map((tool, idx) => {
                    const toolName = (lang === 'en' && tool.name_en) ? tool.name_en : tool.name
                    const toolDesc = (lang === 'en' && tool.description_en) ? tool.description_en : tool.description
                    return (
                    <Link key={idx} to={`/tools/${tool.slug || tool.id}`}
                      className="flex-shrink-0 w-56 rounded-xl p-4 no-underline transition-all duration-300"
                      style={{
                        background: 'rgba(255,255,255,0.55)',
                        backdropFilter: 'blur(12px)',
                        WebkitBackdropFilter: 'blur(12px)',
                        border: '1px solid rgba(255,255,255,0.8)',
                        boxShadow: '0 1px 3px rgba(0,0,0,0.03), 0 8px 24px rgba(0,0,0,0.05)',
                        marginRight: '1rem',
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.background = 'rgba(255,255,255,0.75)'
                        e.currentTarget.style.transform = 'translateY(-4px)'
                        e.currentTarget.style.boxShadow = '0 4px 12px rgba(0,0,0,0.06), 0 16px 40px rgba(0,0,0,0.08)'
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.background = 'rgba(255,255,255,0.55)'
                        e.currentTarget.style.transform = ''
                        e.currentTarget.style.boxShadow = '0 1px 3px rgba(0,0,0,0.03), 0 8px 24px rgba(0,0,0,0.05)'
                      }}
                    >
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
