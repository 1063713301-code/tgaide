import { useLang } from '../lib/i18n.jsx'

const CATEGORY_ICONS = {
  '律师': (
    <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 3v18M5 7l7-4 7 4M5 7l3.5 7H1.5L5 7zM19 7l3.5 7h-7L19 7z"/>
      <line x1="3" y1="21" x2="21" y2="21"/>
    </svg>
  ),
  '设计师': (
    <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="13.5" cy="6.5" r="2.5"/>
      <path d="M17.44 10.44l-9.88 9.88a2 2 0 01-2.83-2.83l9.88-9.88"/>
      <path d="M3 21l3-1-2-2-1 3z"/>
    </svg>
  ),
  '会计财税': (
    <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <line x1="3" y1="21" x2="21" y2="21"/>
      <line x1="3" y1="3" x2="3" y2="21"/>
      <polyline points="7,16 7,10 12,10 12,5 17,5 17,16"/>
    </svg>
  ),
  '营销运营': (
    <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M22 12A10 10 0 1112 2"/>
      <path d="M22 2L12 12"/>
      <circle cx="12" cy="12" r="3"/>
    </svg>
  ),
  '程序员': (
    <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="16 18 22 12 16 6"/>
      <polyline points="8 6 2 12 8 18"/>
    </svg>
  ),
  '学生科研': (
    <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M2 3h6a4 4 0 014 4v14a3 3 0 00-3-3H2z"/>
      <path d="M22 3h-6a4 4 0 00-4 4v14a3 3 0 013-3h7z"/>
    </svg>
  ),
}

export const CATEGORIES = [
  { id: '', labelKey: 'tools_career' },
  { id: '律师', labelKey: 'career_lawyer' },
  { id: '设计师', labelKey: 'career_designer' },
  { id: '会计财税', labelKey: 'career_accountant' },
  { id: '营销运营', labelKey: 'career_marketing' },
  { id: '程序员', labelKey: 'career_developer' },
  { id: '学生科研', labelKey: 'career_student' },
]

export default function CategoryTags({ active = '', onChange }) {
  const { t } = useLang()
  return (
    <div className="flex flex-wrap gap-2">
      {CATEGORIES.map((cat) => (
        <button key={cat.id} onClick={() => onChange(cat.id)}
          className={`inline-flex items-center gap-1.5 px-4 py-1.5 rounded-full text-sm font-medium transition-colors border ${
            active === cat.id ? 'bg-blue-600 text-white border-blue-600 shadow-sm' : 'bg-white text-gray-600 border-gray-200 hover:border-blue-500 hover:text-blue-700'
          }`}>
          {CATEGORY_ICONS[cat.id] || null}
          {t(cat.labelKey)}
        </button>
      ))}
    </div>
  )
}
