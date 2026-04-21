import { Link } from 'react-router-dom'
import { useLang } from '../lib/i18n.jsx'

export default function Footer() {
  const { t } = useLang()
  return (
    <footer className="bg-white border-t border-gray-200 mt-16">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-10">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-8 mb-8">
          <div>
            <Link to="/" className="flex items-center gap-2 mb-3">
              <img src="/logo.png" alt="TG" className="w-8 h-8 object-contain" />
              <span className="font-bold text-gray-900">TG AI工具库</span>
            </Link>
            <p className="text-xs text-gray-500 leading-relaxed">{t('footer_desc')}</p>
          </div>
          <div>
            <h4 className="text-sm font-semibold text-gray-700 mb-3">{t('footer_links')}</h4>
            <ul className="space-y-2 text-sm text-gray-500">
              <li><Link to="/reviews" className="hover:text-blue-600 transition-colors">{t('nav_reviews')}</Link></li>
              <li><Link to="/tools" className="hover:text-blue-600 transition-colors">{t('nav_tools')}</Link></li>
            </ul>
          </div>
          <div>
            <h4 className="text-sm font-semibold text-gray-700 mb-3">{t('footer_contact')}</h4>
            <p className="text-xs text-gray-500 leading-relaxed">邮箱：1063713301@qq.com</p>
            <p className="text-xs text-gray-400 mt-2 leading-relaxed">{t('footer_disclaimer')}</p>
          </div>
        </div>
        <div className="pt-6 border-t border-gray-100 flex flex-col items-center gap-2 text-xs text-gray-400">
          <span>{t('footer_copyright')}</span>
          <a href="https://beian.miit.gov.cn/" target="_blank" rel="nofollow noopener noreferrer" className="hover:text-blue-700 transition-colors">
            鄂ICP备2026013301号-2
          </a>
        </div>
      </div>
    </footer>
  )
}
