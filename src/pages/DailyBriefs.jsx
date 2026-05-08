import { useEffect, useState, useCallback } from 'react'
import Navbar from '../components/Navbar'
import Footer from '../components/Footer'
import ArticleCard from '../components/ArticleCard'
import CategoryTags from '../components/CategoryTags'
import { fetchArticles, fetchArticleCount } from '../lib/supabase'
import { useLang } from '../lib/i18n.jsx'

const PAGE_SIZE = 12

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

export default function DailyBriefs() {
  const [articles, setArticles] = useState([])
  const [category, setCategory] = useState('')
  const [page, setPage] = useState(1)
  const [total, setTotal] = useState(0)
  const [loading, setLoading] = useState(true)
  const { t } = useLang()

  useEffect(() => { document.title = '每日简报 - TG AI工具库' }, [])

  const load = useCallback(async (cat, pg) => {
    setLoading(true)
    try {
      const offset = (pg - 1) * PAGE_SIZE
      const [data, count] = await Promise.all([
        fetchArticles('brief', { category: cat || null, limit: PAGE_SIZE, offset }),
        fetchArticleCount('brief', cat || null),
      ])
      setArticles(data)
      setTotal(count)
    } catch (e) { console.error(e) }
    finally { setLoading(false) }
  }, [])

  useEffect(() => { load(category, page) }, [category, page, load])

  const totalPages = Math.ceil(total / PAGE_SIZE)

  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      <Navbar />
      <main className="flex-1 max-w-[1200px] mx-auto w-full px-4 sm:px-6 py-8">
        <div className="mb-6">
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-1">📰 {t('briefs_title')}</h1>
          <p className="text-gray-500 text-sm">{t('briefs_page_sub')} · {t('articles_count')} {total}</p>
        </div>
        <div className="mb-6"><CategoryTags active={category} onChange={(cat) => { setCategory(cat); setPage(1) }} /></div>
        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {Array.from({ length: PAGE_SIZE }).map((_, i) => <CardSkeleton key={i} />)}
          </div>
        ) : articles.length === 0 ? (
          <div className="text-center py-16 text-gray-400"><div className="text-4xl mb-3">📭</div><p>{t('article_no_data')}</p></div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {articles.map((item) => <ArticleCard key={item.id} article={item} type="brief" />)}
          </div>
        )}
        {totalPages > 1 && (
          <div className="flex justify-center gap-2 mt-10">
            <button onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page === 1}
              className="px-4 py-2 rounded-lg border border-gray-200 text-sm text-gray-600 disabled:opacity-40 hover:bg-gray-50">{t('pagination_prev')}</button>
            {Array.from({ length: totalPages }, (_, i) => i + 1).filter((p) => Math.abs(p - page) <= 2).map((p) => (
              <button key={p} onClick={() => setPage(p)}
                className={`px-4 py-2 rounded-lg border text-sm font-medium ${p === page ? 'border-blue-600 bg-blue-600 text-white' : 'border-gray-200 text-gray-600 hover:bg-gray-50'}`}>{p}</button>
            ))}
            <button onClick={() => setPage((p) => Math.min(totalPages, p + 1))} disabled={page === totalPages}
              className="px-4 py-2 rounded-lg border border-gray-200 text-sm text-gray-600 disabled:opacity-40 hover:bg-gray-50">{t('pagination_next')}</button>
          </div>
        )}
      </main>
      <Footer />
    </div>
  )
}
