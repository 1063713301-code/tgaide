import { useState } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { useLang } from '../lib/i18n.jsx'

export default function Navbar() {
  const [menuOpen, setMenuOpen] = useState(false)
  const location = useLocation()
  const { lang, setLang, t } = useLang()

  const NAV_LINKS = [
    { label: t('nav_tools'), href: '/tools' },
    { label: t('nav_reports'), href: '/industry-reports' },
    { label: t('nav_reviews'), href: '/reviews' },
  ]

  const isActive = (href) => {
    if (href === '/tools') return location.pathname === '/tools'
    return location.pathname.startsWith(href)
  }

  return (
    <nav className="sticky top-0 z-50 border-b border-white/20 bg-white/80 backdrop-blur-md">
      <div className="max-w-[1200px] mx-auto px-4 sm:px-6">
        <div className="flex items-center justify-between h-16">
          <Link to="/" className="flex items-center gap-2 flex-shrink-0">
            <img src="/logo.png" alt="TG" className="w-[49px] h-[49px] object-contain" />
            <span className="font-bold text-gray-900 text-base sm:text-lg leading-tight">TG AI工具库</span>
          </Link>

          <div className="hidden sm:flex items-center gap-1">
            {NAV_LINKS.map((link) => (
              <Link key={link.href} to={link.href}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${isActive(link.href) ? 'bg-blue-50 text-blue-700' : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'}`}>
                {link.label}
              </Link>
            ))}
            <button onClick={() => setLang(lang === 'zh' ? 'en' : 'zh')}
              className="ml-2 px-3 py-1.5 rounded-lg text-sm font-medium border border-gray-200 text-gray-600 hover:border-blue-400 hover:text-blue-600 transition-colors">
              {lang === 'zh' ? 'EN' : '中文'}
            </button>
          </div>

          <button className="sm:hidden p-2 rounded-lg text-gray-500 hover:bg-gray-100" onClick={() => setMenuOpen(!menuOpen)} aria-label="菜单">
            {menuOpen ? (
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
            ) : (
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" /></svg>
            )}
          </button>
        </div>

        {menuOpen && (
          <div className="sm:hidden py-3 border-t border-gray-100">
            {NAV_LINKS.map((link) => (
              <Link key={link.href} to={link.href} onClick={() => setMenuOpen(false)}
                className={`block px-4 py-3 rounded-lg text-sm font-medium mb-1 transition-colors ${isActive(link.href) ? 'bg-blue-50 text-blue-700' : 'text-gray-700 hover:bg-gray-50'}`}>
                {link.label}
              </Link>
            ))}
            <button onClick={() => { setLang(lang === 'zh' ? 'en' : 'zh'); setMenuOpen(false) }}
              className="w-full text-left px-4 py-3 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50">
              {lang === 'zh' ? '🌐 English' : '🌐 中文'}
            </button>
          </div>
        )}
      </div>
    </nav>
  )
}
