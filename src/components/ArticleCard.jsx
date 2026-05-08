import { Link } from 'react-router-dom'
import { useLang } from '../lib/i18n.jsx'

function formatDate(dateStr) {
  if (!dateStr) return ''
  return new Date(dateStr).toLocaleDateString('zh-CN', { year: 'numeric', month: 'long', day: 'numeric' })
}

const CATEGORY_COLOR = {
  律师: '#4F6EF7',
  设计师: '#A855F7',
  会计财税: '#10B981',
  营销运营: '#F59E0B',
  程序员: '#06B6D4',
  学生科研: '#F97316',
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
  const borderColor = CATEGORY_COLOR[article.category] || '#CBD5E1'
  return (
    <Link to={detailPath} className="block no-underline" style={{ borderRadius: '16px' }}>
      <div
        className="p-5 cursor-pointer transition-all duration-300"
        style={{
          background: 'rgba(255,255,255,0.55)',
          backdropFilter: 'blur(12px)',
          WebkitBackdropFilter: 'blur(12px)',
          border: '1px solid rgba(255,255,255,0.8)',
          borderLeft: `3px solid ${borderColor}`,
          borderRadius: '16px',
          boxShadow: '0 1px 3px rgba(0,0,0,0.03), 0 8px 24px rgba(0,0,0,0.05)',
          paddingLeft: '20px',
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
      </div>
    </Link>
  )
}
