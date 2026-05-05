import { Link } from 'react-router-dom'
import { useEffect } from 'react'
import Navbar from '../components/Navbar'
import Footer from '../components/Footer'
import { useLang } from '../lib/i18n.jsx'
import { setSEO, breadcrumb } from '../lib/seo'

const REPORT_TYPES = [
  { type: 'weekly',    path: '/industry-reports/weekly',    icon: '📅', color: 'from-blue-50 to-blue-100',       border: 'border-blue-200',    tag: 'bg-blue-100 text-blue-700' },
  { type: 'monthly',   path: '/industry-reports/monthly',   icon: '📊', color: 'from-indigo-50 to-indigo-100',   border: 'border-indigo-200',  tag: 'bg-indigo-100 text-indigo-700' },
  { type: 'quarterly', path: '/industry-reports/quarterly', icon: '📈', color: 'from-emerald-50 to-emerald-100', border: 'border-emerald-200', tag: 'bg-emerald-100 text-emerald-700' },
]

export default function IndustryReports() {
  const { t } = useLang()

  useEffect(() => {
    setSEO({
      title: `${t('reports_title')} - TG AI工具库`,
      description: 'AI工具行业周报、月报、季报，深度分析趋势与赛道动态。',
      path: '/industry-reports',
      jsonLD: breadcrumb([{ name: '首页', path: '/' }, { name: t('reports_title'), path: '/industry-reports' }]),
    })
  }, [t])

  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      <Navbar />
      <main className="flex-1 max-w-4xl mx-auto w-full px-4 sm:px-6 py-10">
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-gray-900 mb-2">📊 {t('reports_title')}</h1>
          <p className="text-gray-500 text-sm">{t('reports_page_sub')}</p>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
          {REPORT_TYPES.map(({ type, path, icon, color, border, tag }) => (
            <Link key={type} to={path}
              className={`flex flex-col items-center text-center p-8 rounded-2xl bg-gradient-to-b ${color} border ${border} hover:shadow-md transition-shadow no-underline`}>
              <span className="text-4xl mb-4">{icon}</span>
              <span className={`text-base font-semibold px-3 py-1 rounded-full mb-3 ${tag}`}>{t(`reports_${type}`)}</span>
              <p className="text-xs text-gray-500 leading-relaxed">{t(`reports_${type}_sub`)}</p>
            </Link>
          ))}
        </div>
      </main>
      <Footer />
    </div>
  )
}
