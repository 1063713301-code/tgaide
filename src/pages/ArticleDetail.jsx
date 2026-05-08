import { useEffect, useState, useRef } from 'react'
import { createPortal } from 'react-dom'
import { useParams, useNavigate, Link } from 'react-router-dom'
import Navbar from '../components/Navbar'
import Footer from '../components/Footer'
import PdfButton from '../components/PdfButton'
import RichTextContent from '../components/RichTextContent'
import { fetchArticleById, fetchToolOfficialUrls, fetchAllToolSlugs } from '../lib/supabase'
import { trackEvent } from '../lib/analytics'
import { useLang } from '../lib/i18n.jsx'
import QRCode from 'qrcode'
import { setSEO, breadcrumb } from '../lib/seo'

function injectToolLinks(html, toolUrlMap) {
  if (!html) return html
  // 删除"→ 查看详情"/"→ 查看完整选型速查"等链接及其前面的箭头
  html = html.replace(/\s*[→➜➡]\s*<a[^>]*>查看[^<]*<\/a>/g, '')
  // 删除纯文本形式的箭头+查看详情
  html = html.replace(/\s*[→➜➡]\s*查看[^\s<，。！？]{0,15}/g, '')
  if (!Object.keys(toolUrlMap).length) return html
  // Split on tags to avoid replacing inside href/alt attributes
  const parts = html.split(/(<[^>]+>)/)
  const sorted = Object.entries(toolUrlMap).sort((a, b) => b[0].length - a[0].length)
  return parts.map(part => {
    if (part.startsWith('<')) return part
    let text = part
    for (const [name, href] of sorted) {
      const escaped = name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
      text = text.replace(
        new RegExp(escaped, 'g'),
        `<a href="${href}" class="text-blue-600 hover:underline font-medium">${name}</a>`
      )
    }
    return text
  }).join('')
}

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

function ArticleShareIcon({ article, type }) {
  const [open, setOpen] = useState(false)
  const [copied, setCopied] = useState(false)
  const [showQR, setShowQR] = useState(false)
  const canvasRef = useRef(null)
  const path = type === 'report' ? 'industry-reports' : 'daily-briefs'
  const url = `https://tgaide.com/${path}/${article.id}`

  function copyLink() {
    navigator.clipboard.writeText(url).then(() => { setCopied(true); setTimeout(() => setCopied(false), 2000) })
  }

  useEffect(() => {
    if (!showQR || !canvasRef.current) return
    QRCode.toCanvas(canvasRef.current, url, { width: 128, margin: 1 })
  }, [showQR, url])

  return (
    <div className="absolute top-0 right-0">
      <button onClick={() => setOpen(!open)}
        className="w-8 h-8 flex items-center justify-center text-gray-400 hover:text-blue-500 transition-colors">
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
        </svg>
      </button>
      {open && (
        <div className="absolute right-0 top-9 z-50 bg-white border border-gray-200 rounded-xl shadow-lg p-3 w-48 space-y-1">
          <button onClick={copyLink} className="w-full text-left px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 rounded-lg">
            {copied ? '已复制！' : '复制链接'}
          </button>
          <button onClick={() => setShowQR(!showQR)} className="w-full text-left px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 rounded-lg">
            微信/朋友圈扫码
          </button>
          {showQR && <canvas ref={canvasRef} className="rounded mx-auto block" />}
          <button onClick={() => setOpen(false)} className="w-full text-left px-3 py-2 text-sm text-gray-400 hover:bg-gray-50 rounded-lg">取消</button>
        </div>
      )}
    </div>
  )
}

function ArticleShareBar({ article, type }) {
  const [copied, setCopied] = useState(false)
  const [showQR, setShowQR] = useState(false)
  const canvasRef = useRef(null)
  const path = type === 'report' ? 'industry-reports' : 'daily-briefs'
  const url = `https://tgaide.com/${path}/${article.id}`

  function copyLink() {
    navigator.clipboard.writeText(url).then(() => { setCopied(true); setTimeout(() => setCopied(false), 2000) })
  }

  useEffect(() => {
    if (!showQR || !canvasRef.current) return
    QRCode.toCanvas(canvasRef.current, url, { width: 128, margin: 1 })
  }, [showQR, url])

  return (
    <div className="flex flex-wrap items-center gap-3 py-4 border-t border-gray-100 mb-4">
      <span className="text-sm text-gray-500 font-medium">分享：</span>
      <button onClick={copyLink}
        className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-gray-200 text-sm text-gray-600 hover:bg-gray-50 transition-colors">
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
        </svg>
        {copied ? '已复制！' : '复制链接'}
      </button>
      <button onClick={() => setShowQR(!showQR)}
        className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-gray-200 text-sm text-gray-600 hover:bg-gray-50 transition-colors">
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v1m6 11h2m-6 0h-2v4m0-11v3m0 0h.01M12 12h4.01M16 20h4M4 12h4m12 0h.01M5 8h2a1 1 0 001-1V5a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1zm12 0h2a1 1 0 001-1V5a1 1 0 00-1-1h-2a1 1 0 00-1 1v2a1 1 0 001 1zM5 20h2a1 1 0 001-1v-2a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1z" />
        </svg>
        微信/朋友圈扫码
      </button>
      {showQR && (
        <div className="w-full flex flex-col items-start gap-1 mt-1">
          <canvas ref={canvasRef} className="rounded border border-gray-100" />
          <p className="text-xs text-gray-400">微信扫码分享到朋友圈</p>
        </div>
      )}
    </div>
  )
}

export default function ArticleDetail({ type }) {
  const { id } = useParams()
  const navigate = useNavigate()
  const [article, setArticle] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [toolUrlMap, setToolUrlMap] = useState({})
  const { t } = useLang()

  const listPath = type === 'report'
    ? (article?.report_type ? `/industry-reports/${article.report_type}` : '/industry-reports')
    : type === 'selection' ? '/ai-tool-selection' : '/daily-briefs'
  const listLabel = type === 'report' ? t('reports_title') : type === 'selection' ? '选型速查' : t('briefs_title')

  useEffect(() => {
    setLoading(true)
    setError(null)
    fetchArticleById(type, id)
      .then((data) => {
        setArticle(data)
        if (type === 'report') trackEvent('report_view', { report_id: data.id, report_title: data.title })
        const basePath = type === 'report' ? '/industry-reports' : type === 'selection' ? '/ai-tool-selection' : '/daily-briefs'
        const subPath = type === 'report' && data.report_type ? `/industry-reports/${data.report_type}` : basePath
        const detailPath = type === 'selection' && data.scene ? `${basePath}/${data.scene}/${data.id}` : `${basePath}/${data.id}`
        setSEO({
          title: `${data.title} - TG AI工具库`,
          description: data.summary || data.title,
          path: detailPath,
          jsonLD: [
            { '@context': 'https://schema.org', '@type': 'Article',
              headline: data.title, description: data.summary,
              datePublished: data.publish_date, dateModified: data.updated_at || data.publish_date,
              publisher: { '@type': 'Organization', name: 'TG AI工具库', url: 'https://tgaide.com' },
              url: `https://tgaide.com${detailPath}`,
            },
            breadcrumb([
              { name: '首页', path: '/' },
              { name: type === 'report' ? '行业报告' : type === 'selection' ? '选型速查' : '每日简报', path: basePath },
              ...(subPath !== basePath ? [{ name: data.report_type === 'weekly' ? '周报' : data.report_type === 'monthly' ? '月报' : '季报', path: subPath }] : []),
              { name: data.title, path: detailPath },
            ]),
          ],
        })
        if (type === 'selection' || type === 'report') {
          fetchAllToolSlugs().then(setToolUrlMap).catch(() => {})
        }
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
            <header className="relative mb-8 pb-6 border-b border-gray-100">
              {article.category && (
                <span className="inline-block mb-3 px-3 py-1 bg-blue-50 text-blue-800 rounded-full text-xs font-semibold">{article.category}</span>
              )}
              <ArticleShareIcon article={article} type={type} />
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
              {article.pdf_url && <div className="mt-5"><PdfButton url={article.pdf_url} articleId={article.id} articleTitle={article.title} /></div>}
            </header>

            {article.summary && (
              <div className="mb-8 p-4 bg-gray-50 border-l-4 border-blue-500 rounded-r-lg">
                <p className="text-gray-600 text-sm leading-relaxed">{article.summary}</p>
              </div>
            )}

            <div className="mb-10"><RichTextContent html={(type === 'selection' || type === 'report') ? injectToolLinks(article.content, toolUrlMap) : article.content} /></div>

            {type === 'report' && (
              <div className="mb-8 p-5 bg-gray-50 border border-gray-200 rounded-xl">
                <p className="text-sm font-semibold text-gray-700 mb-3">相关AI工具推荐</p>
                <div className="flex flex-wrap gap-2">
                  {[
                    { name: '全部工具', href: '/tools' },
                    { name: '律师AI工具', href: '/tools?category=律师' },
                    { name: '设计师AI工具', href: '/tools?category=设计师' },
                    { name: '会计AI工具', href: '/tools?category=会计' },
                    { name: '营销AI工具', href: '/tools?category=营销' },
                    { name: '程序员AI工具', href: '/tools?category=程序员' },
                  ].map(({ name, href }) => (
                    <Link key={href} to={href}
                      className="px-3 py-1.5 bg-white border border-gray-200 rounded-lg text-xs text-gray-600 hover:border-blue-400 hover:text-blue-600 transition-colors">
                      {name} →
                    </Link>
                  ))}
                </div>
              </div>
            )}

            {type === 'selection' && article.source_report_id && (
              <div className="mb-8 p-4 bg-blue-50 border border-blue-200 rounded-xl flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-blue-800">本选型方案来源于行业报告</p>
                  <p className="text-xs text-blue-600 mt-0.5">点击查看完整报告内容</p>
                </div>
                <Link
                  to={`/industry-reports/${article.source_report_id}`}
                  className="px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition-colors shrink-0"
                >
                  查看原始报告 →
                </Link>
              </div>
            )}

            <ArticleShareBar article={article} type={type} />

            {article.pdf_url && <div className="flex justify-center mb-10"><PdfButton url={article.pdf_url} articleId={article.id} articleTitle={article.title} /></div>}

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
