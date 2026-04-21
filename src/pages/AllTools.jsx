import { useEffect, useState, useMemo, useCallback, useRef } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import Navbar from '../components/Navbar'
import Footer from '../components/Footer'
import { fetchTools } from '../lib/supabase'
import { useLang } from '../lib/i18n.jsx'

const COMPARE_KEY = 'tgaide_compare'
function getCompare() {
  try { return JSON.parse(localStorage.getItem(COMPARE_KEY) || '[]') } catch { return [] }
}
function saveCompare(arr) { localStorage.setItem(COMPARE_KEY, JSON.stringify(arr)) }

// ─── 常量 ─────────────────────────────────────────
const SIDEBAR_CATEGORIES = [
  { id: '', label: '全部', icon: '🔍', color: '' },
  { id: '律师', label: '律师', icon: '⚖️', color: 'blue' },
  { id: '设计师', label: '设计师', icon: '🎨', color: 'purple' },
  { id: '会计', label: '会计', icon: '🧮', color: 'yellow' },
  { id: '营销', label: '营销', icon: '📣', color: 'orange' },
  { id: '程序员', label: '程序员', icon: '💻', color: 'emerald' },
  { id: '学生', label: '学生', icon: '🎓', color: 'pink' },
]

const SORT_OPTIONS = [
  { value: 'hot', labelKey: 'tools_sort_hot' },
  { value: 'rating', labelKey: 'tools_sort_rating' },
  { value: 'newest', labelKey: 'tools_sort_newest' },
]

// 分类对应的渐变色
const CATEGORY_GRADIENT = {
  律师: 'from-blue-400 to-blue-600',
  设计师: 'from-purple-400 to-purple-600',
  会计: 'from-yellow-400 to-amber-500',
  营销: 'from-orange-400 to-orange-600',
  程序员: 'from-blue-500 to-blue-700',
  学生: 'from-pink-400 to-pink-600',
}

const CATEGORY_BG = {
  blue: 'bg-blue-50 text-blue-700 border-blue-200',
  purple: 'bg-purple-50 text-purple-700 border-purple-200',
  yellow: 'bg-yellow-50 text-yellow-700 border-yellow-200',
  orange: 'bg-orange-50 text-orange-700 border-orange-200',
  emerald: 'bg-blue-50 text-blue-800 border-blue-200',
  pink: 'bg-pink-50 text-pink-700 border-pink-200',
}

// ─── 工具图标 ─────────────────────────────────────
function ToolIcon({ tool }) {
  const [imgError, setImgError] = useState(false)
  const gradient = CATEGORY_GRADIENT[tool.category] || 'from-gray-400 to-gray-600'

  if (tool.icon_url && !imgError) {
    return (
      <img
        src={tool.icon_url}
        alt={tool.name}
        onError={() => setImgError(true)}
        className="w-16 h-16 rounded-2xl object-cover shadow-sm"
      />
    )
  }

  return (
    <div
      className={`w-16 h-16 rounded-2xl bg-gradient-to-br ${gradient} flex items-center justify-center text-white font-bold text-2xl shadow-sm select-none`}
    >
      {tool.name.charAt(0)}
    </div>
  )
}

// ─── 星级评分 ─────────────────────────────────────
function StarRating({ rating }) {
  return (
    <div className="flex items-center gap-0.5" title={`${rating} 分`}>
      {Array.from({ length: 5 }).map((_, i) => {
        const full = i + 1 <= rating
        const half = !full && i + 0.5 <= rating
        return (
          <svg
            key={i}
            className={`w-3.5 h-3.5 flex-shrink-0 ${full || half ? 'text-yellow-400' : 'text-gray-200'}`}
            fill="currentColor"
            viewBox="0 0 20 20"
          >
            <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
          </svg>
        )
      })}
      <span className="ml-1 text-xs text-gray-400 font-medium">{Number(rating).toFixed(1)}</span>
    </div>
  )
}

// ─── 工具卡片 ─────────────────────────────────────
function ToolCard({ tool, onCompare, inCompare, compareDisabled }) {
  const [showTooltip, setShowTooltip] = useState(false)
  const { t, lang } = useLang()
  const name = (lang === 'en' && tool.name_en) ? tool.name_en : tool.name
  const desc = (lang === 'en' && tool.description_en) ? tool.description_en : tool.description
  const highlights = (lang === 'en' && tool.highlights_en) ? tool.highlights_en : tool.highlights
  return (
    <div className="relative bg-white border border-gray-200 rounded-xl p-5 flex flex-col hover:shadow-md hover:-translate-y-0.5 transition-all duration-200 hover:z-10"
      onMouseEnter={() => setShowTooltip(true)} onMouseLeave={() => setShowTooltip(false)}>
      {showTooltip && (
        <div className="absolute left-0 right-0 top-full mt-1 z-50 bg-white border border-gray-200 text-gray-700 text-xs rounded-xl p-4 shadow-lg pointer-events-none">
          <p className="font-semibold text-sm text-gray-900 mb-1.5">{name}</p>
          <p className="text-gray-600 leading-relaxed mb-2">{desc}</p>
          {highlights && <p className="text-blue-600 leading-relaxed">{highlights}</p>}
        </div>
      )}
      <div className="flex items-center gap-1.5 mb-3 min-h-[22px]">
        {tool.price === '免费' && <span className="text-xs font-semibold bg-blue-100 text-blue-800 px-2 py-0.5 rounded-md">{t('tools_free')}</span>}
        {tool.is_recommended && <span className="text-xs font-medium bg-gray-100 text-gray-500 px-2 py-0.5 rounded-md">{t('tools_recommended')}</span>}
        {tool.is_hot && !tool.is_recommended && <span className="text-xs font-medium bg-red-50 text-red-500 px-2 py-0.5 rounded-md">{t('tools_hot')}</span>}
        {tool.is_new && <span className="text-xs font-medium bg-blue-50 text-blue-500 px-2 py-0.5 rounded-md">{t('tools_new')}</span>}
      </div>
      <div className="flex justify-center mb-3"><ToolIcon tool={tool} /></div>
      <h3 className="font-bold text-gray-900 text-center text-base mb-1.5 leading-snug">{name}</h3>
      <p className="text-gray-500 text-sm text-center leading-relaxed flex-1 mb-3" style={{ display:'-webkit-box', WebkitLineClamp:2, WebkitBoxOrient:'vertical', overflow:'hidden' }}>
        {desc}
      </p>
      <div className="flex justify-center mb-2"><StarRating rating={tool.rating} /></div>
      <p className="text-gray-400 text-xs text-center mb-4 font-medium">{tool.price}</p>
      <div className="flex gap-2 mt-auto">
        <a href={tool.official_url || '#'} target="_blank" rel="nofollow noopener noreferrer"
          onClick={(e) => !tool.official_url && e.preventDefault()}
          className="flex-1 flex items-center justify-center gap-1.5 bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold py-2.5 rounded-lg transition-colors">
          {t('tools_visit')}
          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" /></svg>
        </a>
        <button onClick={(e) => { e.preventDefault(); e.stopPropagation(); onCompare(tool) }}
          disabled={!inCompare && compareDisabled}
          title={inCompare ? t('tools_compare_added') : compareDisabled ? t('tools_compare_max') : t('tools_compare_add')}
          className={`flex-shrink-0 px-2.5 border rounded-lg text-xs font-semibold transition-all ${
            inCompare ? 'border-blue-400 bg-blue-50 text-blue-600' :
            compareDisabled ? 'border-gray-200 text-gray-300 cursor-not-allowed' :
            'border-gray-200 hover:border-blue-400 hover:bg-blue-50 hover:text-blue-600 text-gray-500'
          }`}>
          {inCompare ? t('tools_compare_added') : t('tools_compare_add')}
        </button>
      </div>
    </div>
  )
}

// ─── 骨架屏 ────────────────────────────────────────
function CardSkeleton() {
  return (
    <div className="bg-white border border-gray-200 rounded-xl p-5">
      <div className="flex gap-2 mb-3">
        <div className="skeleton h-5 w-10 rounded-md" />
        <div className="skeleton h-5 w-16 rounded-md" />
      </div>
      <div className="flex justify-center mb-3">
        <div className="skeleton w-16 h-16 rounded-2xl" />
      </div>
      <div className="skeleton h-5 w-28 rounded mx-auto mb-2" />
      <div className="skeleton h-4 w-full rounded mb-1" />
      <div className="skeleton h-4 w-4/5 rounded mx-auto mb-3" />
      <div className="skeleton h-3 w-20 rounded mx-auto mb-2" />
      <div className="skeleton h-3 w-10 rounded mx-auto mb-4" />
      <div className="flex gap-2">
        <div className="skeleton h-9 flex-1 rounded-lg" />
        <div className="skeleton w-10 h-9 rounded-lg" />
      </div>
    </div>
  )
}

// ─── 主页面 ────────────────────────────────────────
export default function AllTools() {
  const [allTools, setAllTools] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [selectedCategory, setSelectedCategory] = useState('')
  const [searchQuery, setSearchQuery] = useState('')
  const [sortBy, setSortBy] = useState('hot')
  const [compareList, setCompareList] = useState(getCompare)
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false)
  const searchTimerRef = useRef(null)
  const [debouncedSearch, setDebouncedSearch] = useState('')
  const navigate = useNavigate()
  const location = useLocation()
  const { t } = useLang()

  useEffect(() => {
    document.title = '全部工具 - TG AI工具库'
    const params = new URLSearchParams(location.search)
    const q = params.get('q')
    const cat = params.get('category') || ''
    setSearchQuery(q || '')
    setSelectedCategory(cat)
    // 直接用解析出的 cat 发请求，避免 state 异步更新导致用旧值 fetch
    setLoading(true)
    setError(null)
    fetchTools({ category: cat || null, sort: sortBy })
      .then(setAllTools)
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false))
  }, [location.search, sortBy])

  // 搜索防抖 300ms
  useEffect(() => {
    clearTimeout(searchTimerRef.current)
    searchTimerRef.current = setTimeout(() => setDebouncedSearch(searchQuery), 300)
    return () => clearTimeout(searchTimerRef.current)
  }, [searchQuery])

  // 客户端搜索过滤
  const filteredTools = useMemo(() => {
    if (!debouncedSearch.trim()) return allTools
    const q = debouncedSearch.trim().toLowerCase()
    return allTools.filter(
      (t) =>
        t.name.toLowerCase().includes(q) ||
        t.description.toLowerCase().includes(q) ||
        (t.keywords && t.keywords.toLowerCase().includes(q)),
    )
  }, [allTools, debouncedSearch])

  const toggleCompare = useCallback((tool) => {
    setCompareList((prev) => {
      const exists = prev.find(t => t.id === tool.id)
      const next = exists ? prev.filter(t => t.id !== tool.id) : prev.length < 3 ? [...prev, tool] : prev
      saveCompare(next)
      return next
    })
  }, [])

  const activeCat = SIDEBAR_CATEGORIES.find((c) => c.id === selectedCategory)

  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      <Navbar />

      {/* ── 对比栏 ── */}
      {compareList.length > 0 && (
        <div className="sticky top-16 z-40 bg-white border-b border-gray-200 shadow-sm">
          <div className="max-w-[1280px] mx-auto px-4 sm:px-6 py-2 flex items-center gap-3">
            <span className="text-sm font-semibold text-gray-700 flex-shrink-0">{t('tools_compare_bar')}</span>
            <div className="flex gap-2 flex-1 overflow-x-auto">
              {compareList.map(t => (
                <div key={t.id} className="flex items-center gap-1.5 bg-blue-50 border border-blue-200 rounded-lg px-2.5 py-1 flex-shrink-0">
                  <span className="text-sm font-medium text-blue-700">{t.name}</span>
                  <button onClick={() => toggleCompare(t)} className="text-blue-400 hover:text-red-500 transition-colors text-base leading-none">×</button>
                </div>
              ))}
            </div>
            <button onClick={() => navigate('/compare')}
              className="flex-shrink-0 px-4 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold rounded-lg transition-colors">
              {t('tools_compare_start')}
            </button>
            <button onClick={() => { saveCompare([]); setCompareList([]) }}
              className="flex-shrink-0 px-3 py-1.5 border border-gray-200 hover:border-red-300 hover:text-red-500 text-gray-400 text-sm rounded-lg transition-colors">
              {t('tools_compare_clear')}
            </button>
          </div>
        </div>
      )}

      <div className="max-w-[1280px] mx-auto w-full px-4 sm:px-6 py-6 flex gap-6">

        {/* ── 左侧侧边栏（桌面） ── */}
        <aside className="hidden lg:block w-60 flex-shrink-0">
          <div className="bg-white border border-gray-200 rounded-xl overflow-hidden sticky top-20">
            <div className="px-4 py-3 border-b border-gray-100">
              <span className="text-sm font-bold text-gray-800">{t('tools_career')}</span>
            </div>
            <nav className="py-2">
              {SIDEBAR_CATEGORIES.map((cat) => {
                const isActive = selectedCategory === cat.id
                const bgCls = isActive
                  ? 'bg-blue-50 text-blue-700 font-semibold'
                  : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                return (
                  <button
                    key={cat.id}
                    onClick={() => navigate(cat.id ? `/tools?category=${encodeURIComponent(cat.id)}` : '/tools')}
                    className={`w-full flex items-center gap-3 px-4 py-2.5 text-sm transition-colors text-left ${bgCls}`}
                  >
                    <span className="text-base w-5 text-center">{cat.icon}</span>
                    <span>{cat.label}</span>
                    {isActive && (
                      <span className="ml-auto w-1.5 h-1.5 rounded-full bg-blue-500" />
                    )}
                  </button>
                )
              })}
            </nav>

            {/* 对比数量 */}
            {compareList.length > 0 && (
              <div className="px-4 py-3 border-t border-gray-100 text-xs text-gray-400">
                {t('tools_compare_count_label')} {compareList.length}{t('tools_compare_of')}
              </div>
            )}
          </div>
        </aside>

        {/* ── 右侧主内容 ── */}
        <div className="flex-1 min-w-0">
          {/* 移动端分类横向滚动 */}
          <div className="lg:hidden mb-4 -mx-4 px-4 overflow-x-auto">
            <div className="flex gap-2 pb-1 min-w-max">
              {SIDEBAR_CATEGORIES.map((cat) => {
                const isActive = selectedCategory === cat.id
                return (
                  <button
                    key={cat.id}
                    onClick={() => navigate(cat.id ? `/tools?category=${encodeURIComponent(cat.id)}` : '/tools')}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium whitespace-nowrap border transition-colors ${
                      isActive
                        ? 'bg-blue-600 text-white border-blue-600'
                        : 'bg-white text-gray-600 border-gray-200 hover:border-blue-300'
                    }`}
                  >
                    <span>{cat.icon}</span>
                    {cat.label}
                  </button>
                )
              })}
            </div>
          </div>

          {/* 搜索 + 排序栏 */}
          <div className="flex flex-col sm:flex-row gap-3 mb-6">
            {/* 搜索框 */}
            <div className="relative flex-1">
              <svg
                className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder={t('tools_search_placeholder')}
                className="w-full pl-9 pr-4 py-2.5 bg-white border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              )}
            </div>

            {/* 排序下拉 */}
            <div className="relative">
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="appearance-none bg-white border border-gray-200 rounded-xl px-4 py-2.5 pr-9 text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer"
              >
                {SORT_OPTIONS.map((o) => (
                  <option key={o.value} value={o.value}>{t(o.labelKey)}</option>
                ))}
              </select>
              <svg
                className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </div>
          </div>

          {/* 结果统计行 */}
          <div className="flex items-center justify-between mb-4">
            <div className="text-sm text-gray-500">
              {loading ? (
                <div className="skeleton h-4 w-32 rounded" />
              ) : (
                <>
                  {activeCat?.id ? (
                    <span>
                      <span className="font-semibold text-gray-700">{activeCat.icon} {activeCat.label}</span>
                      {' · '}
                    </span>
                  ) : null}
                  共 <span className="font-semibold text-gray-700">{filteredTools.length}</span> {t('tools_count')}
                  {debouncedSearch && (
                    <span className="ml-1">
                      · {t('tools_search_label')}<span className="text-blue-600">{debouncedSearch}</span>」
                    </span>
                  )}
                </>
              )}
            </div>
          </div>

          {/* 错误提示 */}
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-xl p-4 text-sm text-red-600 mb-4">
              {t('tools_load_error')}
            </div>
          )}

          {/* 工具卡片网格 */}
          {loading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {Array.from({ length: 9 }).map((_, i) => <CardSkeleton key={i} />)}
            </div>
          ) : filteredTools.length === 0 ? (
            <div className="text-center py-16 text-gray-400">
              <div className="text-5xl mb-3">🔍</div>
              <p className="text-base mb-2">
                {debouncedSearch ? `${t('tools_no_result')}「${debouncedSearch}」` : t('tools_no_category')}
              </p>
              <p className="text-sm">
                {debouncedSearch ? (
                  <button onClick={() => setSearchQuery('')} className="text-blue-500 hover:underline">
                    {t('tools_clear_search')}
                  </button>
                ) : (
                  t('tools_schema_hint')
                )}
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredTools.map((tool) => (
                <ToolCard
                  key={tool.id}
                  tool={tool}
                  inCompare={!!compareList.find(t => t.id === tool.id)}
                  compareDisabled={compareList.length >= 3}
                  onCompare={toggleCompare}
                />
              ))}
            </div>
          )}
        </div>
      </div>

      <Footer />
    </div>
  )
}
