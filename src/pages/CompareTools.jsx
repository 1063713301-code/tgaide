import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import Navbar from '../components/Navbar'
import Footer from '../components/Footer'
import { useLang } from '../lib/i18n.jsx'

const LS_KEY = 'tgaide_compare'

function getCompare() {
  try { return JSON.parse(localStorage.getItem(LS_KEY) || '[]') } catch { return [] }
}

function ToolIcon({ tool }) {
  const [err, setErr] = useState(false)
  const GRAD = { 律师:'from-blue-400 to-blue-600', 设计师:'from-purple-400 to-purple-600', 会计:'from-yellow-400 to-amber-500', 营销:'from-orange-400 to-orange-600', 程序员:'from-blue-500 to-blue-700', 学生:'from-pink-400 to-pink-600' }
  if (tool.icon_url && !err)
    return <img src={tool.icon_url} alt={tool.name} onError={() => setErr(true)} className="w-14 h-14 rounded-xl object-cover mx-auto" />
  return <div className={`w-14 h-14 rounded-xl bg-gradient-to-br ${GRAD[tool.category]||'from-gray-400 to-gray-600'} flex items-center justify-center text-white font-bold text-xl mx-auto`}>{tool.name.charAt(0)}</div>
}

function CellValue({ rowKey, tool, t }) {
  if (rowKey === 'name') return <div className="font-bold text-gray-900 text-center">{tool.name}</div>
  if (rowKey === 'rating') return (
    <div className="flex items-center justify-center gap-1">
      <svg className="w-4 h-4 text-yellow-400" fill="currentColor" viewBox="0 0 20 20"><path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"/></svg>
      <span className="font-semibold">{Number(tool.rating).toFixed(1)}</span>
    </div>
  )
  if (rowKey === 'tags') return (
    <div className="flex flex-wrap gap-1 justify-center">
      {tool.is_recommended && <span className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded-md">{t('compare_tag_recommended')}</span>}
      {tool.is_hot && <span className="text-xs bg-red-50 text-red-500 px-2 py-0.5 rounded-md">{t('compare_tag_hot')}</span>}
      {tool.is_new && <span className="text-xs bg-blue-50 text-blue-500 px-2 py-0.5 rounded-md">{t('compare_tag_new')}</span>}
      {!tool.is_recommended && !tool.is_hot && !tool.is_new && <span className="text-xs text-gray-400">—</span>}
    </div>
  )
  if (rowKey === 'price') return (
    <span className={`text-sm font-medium ${tool.price === '免费' ? 'text-blue-600' : 'text-gray-700'}`}>{tool.price || '—'}</span>
  )
  return <span className="text-sm text-gray-700 text-center block">{tool[rowKey] || '—'}</span>
}

export default function CompareTools() {
  const [tools, setTools] = useState([])
  const navigate = useNavigate()
  const { t } = useLang()

  const ROWS = [
    { key: 'name', label: t('compare_row_name') },
    { key: 'category', label: t('compare_row_category') },
    { key: 'description', label: t('compare_row_desc') },
    { key: 'price', label: t('compare_row_price') },
    { key: 'rating', label: t('compare_row_rating') },
    { key: 'tags', label: t('compare_row_tags') },
  ]

  useEffect(() => {
    document.title = '工具对比 - TG AI工具库'
    setTools(getCompare())
  }, [])

  function remove(id) {
    const next = tools.filter(t => t.id !== id)
    setTools(next)
    localStorage.setItem(LS_KEY, JSON.stringify(next))
  }

  if (tools.length === 0) return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      <Navbar />
      <main className="flex-1 flex flex-col items-center justify-center text-gray-400 gap-4">
        <div className="text-5xl">📊</div>
        <p>{t('compare_empty')}</p>
        <button onClick={() => navigate('/tools')} className="px-5 py-2 bg-blue-600 text-white rounded-lg text-sm font-semibold hover:bg-blue-700">{t('compare_go_add')}</button>
      </main>
      <Footer />
    </div>
  )

  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      <Navbar />
      <main className="flex-1 max-w-5xl mx-auto w-full px-4 sm:px-6 py-10">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-bold text-gray-900">{t('compare_title')}</h1>
          <button onClick={() => navigate('/tools')} className="text-sm text-blue-600 hover:text-blue-700">{t('compare_back')}</button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full bg-white border border-gray-200 rounded-xl overflow-hidden" style={{ minWidth: tools.length * 200 + 120 }}>
            <thead>
              <tr className="border-b border-gray-100">
                <th className="w-28 px-4 py-3 text-left text-xs font-semibold text-gray-500 bg-gray-50" />
                {tools.map(tool => (
                  <th key={tool.id} className="px-4 py-4 text-center bg-gray-50">
                    <ToolIcon tool={tool} />
                    <div className="mt-2 font-bold text-gray-900 text-sm">{tool.name}</div>
                    <button onClick={() => remove(tool.id)} className="mt-2 text-xs text-red-400 hover:text-red-600 transition-colors">{t('compare_remove')}</button>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {ROWS.map((row, i) => (
                <tr key={row.key} className={i % 2 === 0 ? 'bg-white' : 'bg-gray-50/50'}>
                  <td className="px-4 py-3 text-xs font-semibold text-gray-500 whitespace-nowrap border-r border-gray-100">{row.label}</td>
                  {tools.map(tool => (
                    <td key={tool.id} className="px-4 py-3 text-center">
                      <CellValue rowKey={row.key} tool={tool} t={t} />
                    </td>
                  ))}
                </tr>
              ))}
              <tr>
                <td className="px-4 py-3 border-r border-gray-100" />
                {tools.map(tool => (
                  <td key={tool.id} className="px-4 py-3 text-center">
                    <a href={tool.official_url || '#'} target="_blank" rel="nofollow noopener noreferrer"
                      className="inline-block px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold rounded-lg transition-colors">
                      {t('compare_visit')}
                    </a>
                  </td>
                ))}
              </tr>
            </tbody>
          </table>
        </div>
      </main>
      <Footer />
    </div>
  )
}
