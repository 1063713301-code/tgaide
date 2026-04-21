import { useEffect, useState } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import Navbar from '../components/Navbar'
import Footer from '../components/Footer'
import PdfButton from '../components/PdfButton'
import RichTextContent from '../components/RichTextContent'
import { fetchArticleById } from '../lib/supabase'
import { useLang } from '../lib/i18n.jsx'

function formatDate(dateStr) {
  if (!dateStr) return ''
  return new Date(dateStr).toLocaleDateString('zh-CN', { year: 'numeric', month: 'long', day: 'numeric' })
}

function injectJsonLD(article, type) {
  const existing = document.getElementById('json-ld-article')
  if (existing) existing.remove()
  const script = document.createElement('script')
  script.id = 'json-ld-article'
  script.type = 'application/ld+json'
  script.text = JSON.stringify({
    '@context': 'https://schema.org', '@type': 'Article',
    headline: article.title, description: article.summary,
    datePublished: article.publish_date, dateModified: article.updated_at || article.publish_date,
    publisher: { '@type': 'Organization', name: 'TG AI工具库', url: 'https://tgaide.com' },
    url: `https://tgaide.com/${type === 'report' ? 'industry-reports' : 'daily-briefs'}/${article.id}`,
  })
  document.head.appendChild(script)
}

function DetailSkeleton() {
  return (
    <div className="max-w-3xl mx-auto">
      <div className="skeleton h-8 w-3/4 rounded mb-4" />
      <div className="skeleton h-4 w-40 rounded mb-8" />
      <div className="skeleton h-4 w-full rounded mb-3" />
      <div className="skeleton h-4 w-5/6 rounded mb-3" />
      <div className="skeleton h-4 w-4/6 rounded mb-3" />
    </div>
  )
}

export default function ArticleDetail({ type }) {
  const { id } = useParams()
  const navigate = useNavigate()
  const [article, setArticle] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const { t } = useLang()

  const listPath = type === 'report' ? '/industry-reports' : '/daily-briefs'
  const listLabel = type === 'report' ? t('reports_title') : t('briefs_title')

  useEffect(() => {
    setLoading(true)
    setError(null)
    fetchArticleById(type, id)
      .then((data) => {
        setArticle(data)
        document.title = `${data.title} - TG AI工具库`
        setMetaDesc(data.summary || data.title)
        injectJsonLD(data, type)
      })
      .catch(() => setError(t('article_not_found')))
      .finally(() => setLoading(false))
    return () => { const el = document.getElementById('json-ld-article'); if (el) el.remove() }
  }, [id, type])

  return (
    <div className="min-h-screen flex flex-col bg-white">
      <Navbar />
      <main className="flex-1 max-w-4xl mx-auto w-full px-4 sm:px-6 py-8">
        <nav className="flex items-center gap-2 text-sm text-gray-400 mb-6">
          <Link to="/" className="hover:text-blue-700 transition-colors">{t('article_home')}</Link>
          <span>/</span>
          <Link to={listPath} className="hover:text-blue-700 transition-colors">{listLabel}</Link>
          {article && <><span>/</span><span className="text-gray-600 truncate max-w-xs">{article.title}</span></>}
        </nav>

        {loading && <DetailSkeleton />}

        {error && (
          <div className="text-center py-16">
            <div className="text-5xl mb-4">😕</div>
            <p className="text-gray-500 mb-6">{error}</p>
            <button onClick={() => navigate(listPath)}
              className="px-5 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700">
              {t('article_back_list')}
            </button>
          </div>
        )}

        {!loading && !error && article && (
          <article>
            <header className="mb-8 pb-6 border-b border-gray-100">
              {article.category && (
                <span className="inline-block mb-3 px-3 py-1 bg-blue-50 text-blue-800 rounded-full text-xs font-semibold">{article.category}</span>
              )}
              <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 leading-snug mb-4">{article.title}</h1>
              <div className="flex flex-wrap items-center gap-4 text-sm text-gray-500">
                <span className="flex items-center gap-1">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                  {formatDate(article.publish_date)}
                </span>
                <span>{t('article_source')}</span>
              </div>
              {article.pdf_url && <div className="mt-5"><PdfButton url={article.pdf_url} /></div>}
            </header>

            {article.summary && (
              <div className="mb-8 p-4 bg-gray-50 border-l-4 border-blue-500 rounded-r-lg">
                <p className="text-gray-600 text-sm leading-relaxed">{article.summary}</p>
              </div>
            )}

            <div className="mb-10"><RichTextContent html={article.content} /></div>

            {article.pdf_url && <div className="flex justify-center mb-10"><PdfButton url={article.pdf_url} /></div>}

            <footer className="pt-6 border-t border-gray-100 text-sm text-gray-400 text-center">
              {t('article_source')} | {formatDate(article.publish_date)}
            </footer>

            <div className="mt-8 flex justify-center">
              <Link to={listPath}
                className="inline-flex items-center gap-2 px-5 py-2.5 border border-gray-200 rounded-lg text-sm text-gray-600 hover:bg-gray-50 transition-colors">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
                {t('article_back_list')}
              </Link>
            </div>
          </article>
        )}
      </main>
      <Footer />
    </div>
  )
}

function setMetaDesc(content) {
  let el = document.querySelector('meta[name="description"]')
  if (!el) { el = document.createElement('meta'); el.setAttribute('name', 'description'); document.head.appendChild(el) }
  el.setAttribute('content', content.slice(0, 160))
}
