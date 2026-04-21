import { useLang } from '../lib/i18n.jsx'

export const CATEGORIES = [
  { id: '', labelKey: 'tools_career', icon: '' },
  { id: '律师', labelKey: 'career_lawyer', icon: '⚖️' },
  { id: '设计师', labelKey: 'career_designer', icon: '🎨' },
  { id: '会计财税', labelKey: 'career_accountant', icon: '💼' },
  { id: '营销运营', labelKey: 'career_marketing', icon: '📣' },
  { id: '程序员', labelKey: 'career_developer', icon: '💻' },
  { id: '学生科研', labelKey: 'career_student', icon: '🎓' },
]

export default function CategoryTags({ active = '', onChange }) {
  const { t } = useLang()
  return (
    <div className="flex flex-wrap gap-2">
      {CATEGORIES.map((cat) => (
        <button key={cat.id} onClick={() => onChange(cat.id)}
          className={`px-4 py-1.5 rounded-full text-sm font-medium transition-colors border ${
            active === cat.id ? 'bg-blue-600 text-white border-blue-600 shadow-sm' : 'bg-white text-gray-600 border-gray-200 hover:border-blue-500 hover:text-blue-700'
          }`}>
          {cat.icon} {t(cat.labelKey)}
        </button>
      ))}
    </div>
  )
}
