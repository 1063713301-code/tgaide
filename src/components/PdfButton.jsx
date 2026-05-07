import { useLang } from '../lib/i18n.jsx'
import { trackEvent } from '../lib/analytics'

export default function PdfButton({ url, labelKey, articleId, articleTitle }) {
  const { t } = useLang()
  if (!url) return null
  return (
    <a href={url} target="_blank" rel="nofollow noopener noreferrer"
      onClick={() => trackEvent('report_download', { report_id: articleId, report_title: articleTitle })}
      className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg text-white font-semibold text-sm transition-colors"
      style={{ backgroundColor: '#10B981' }}
      onMouseOver={(e) => (e.currentTarget.style.backgroundColor = '#059669')}
      onMouseOut={(e) => (e.currentTarget.style.backgroundColor = '#10B981')}>
      <svg className="w-4 h-4 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
      </svg>
      {t(labelKey || 'pdf_download')}
    </a>
  )
}
