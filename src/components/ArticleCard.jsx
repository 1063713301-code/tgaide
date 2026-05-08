import { Link } from 'react-router-dom'
import { useLang } from '../lib/i18n.jsx'

function formatDate(dateStr) {
  if (!dateStr) return ''
  return new Date(dateStr).toLocaleDateString('zh-CN', { year: 'numeric', month: 'long', day: 'numeric' })
}

const CATEGORY_BAR = {
  律师: 'report-bar-律师',
  设计师: 'report-bar-设计师',
  会计财税: 'report-bar-会计',
  营销运营: 'report-bar-营销',
  程序员: 'report-bar-程序员',
  学生科研: 'report-bar-学生',
}

function CategoryBadge({ category }) {
  const colorMap = {
    律师: 'bg-blue-50 text-blue-700', 设计师: 'bg-purple-50 text-purple-700',
    会计财税: 'bg-yellow-50 text-yellow-700', 营销运营: 'bg-orange-50 text-orange-700',
    程序员: 'bg-green-50 text-green-700', 学生科研: 'bg-pink-50 text-pink-700',
  }
  return <span className={`inline-block px-2 py-0.5 rounded text-xs font-medium ${colorMap[category] || 'bg-gray-100 text-gray-600'}`}>{category}</span>
}

export default function ArticleCard({ article, type }) {
  const { t } = useLang()
  const detailPath = `/${type === 'report' ? 'industry-reports' : 'daily-briefs'}/${article.id}`
  const barClass = CATEGORY_BAR[article.category] || 'report-bar-default'
  return (
    <Link to={detailPath} className={`article-card block bg-white border border-gray-200 rounded-xl p-5 cursor-pointer no-underline ${barClass}`}>
      <div className="flex items-center justify-between mb-3">
        <time className="text-xs text-gray-400">{formatDate(article.publish_date)}</time>
        {article.category && <CategoryBadge category={article.category} />}
      </div>
      <h3 className="text-base font-semibold text-gray-900 leading-snug mb-2 line-clamp-2">{article.title}</h3>
      {article.summary && (
        <p className="text-sm text-gray-500 leading-relaxed" style={{ display:'-webkit-box', WebkitLineClamp:2, WebkitBoxOrient:'vertical', overflow:'hidden' }}>
          {article.summary}
        </p>
      )}
      <div className="mt-3 flex items-center gap-1 text-xs text-blue-700 font-medium">
        <span>{t('article_read_more')}</span>
      </div>
    </Link>
  )
}
