import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import Navbar from '../components/Navbar'
import Footer from '../components/Footer'
import { fetchLatestSelections } from '../lib/supabase'

export const SCENE_ICONS = {
  design: (
    <svg className="w-6 h-6" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="13.5" cy="6.5" r="2.5"/>
      <path d="M17.44 10.44l-9.88 9.88a2 2 0 01-2.83-2.83l9.88-9.88"/>
      <path d="M3 21l3-1-2-2-1 3z"/>
    </svg>
  ),
  video: (
    <svg className="w-6 h-6" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M2 3h6a4 4 0 014 4v14a3 3 0 00-3-3H2z"/>
      <path d="M22 3h-6a4 4 0 00-4 4v14a3 3 0 013-3h7z"/>
    </svg>
  ),
  marketing: (
    <svg className="w-6 h-6" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M22 12A10 10 0 1112 2"/>
      <path d="M22 2L12 12"/>
      <circle cx="12" cy="12" r="3"/>
    </svg>
  ),
  legal: (
    <svg className="w-6 h-6" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 3v18M5 7l7-4 7 4M5 7l3.5 7H1.5L5 7zM19 7l3.5 7h-7L19 7z"/>
      <line x1="3" y1="21" x2="21" y2="21"/>
    </svg>
  ),
  content: (
    <svg className="w-6 h-6" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="16 18 22 12 16 6"/>
      <polyline points="8 6 2 12 8 18"/>
    </svg>
  ),
  finance: (
    <svg className="w-6 h-6" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <line x1="3" y1="21" x2="21" y2="21"/>
      <line x1="3" y1="3" x2="3" y2="21"/>
      <polyline points="7,16 7,10 12,10 12,5 17,5 17,16"/>
    </svg>
  ),
}

export const SELECTION_SCENES = [
  { slug: 'design',    iconBg: 'bg-violet-500',  title: '设计系统生成',   desc: '海报/建模/视觉全套AI方案',     color: 'from-purple-50 to-purple-100', border: 'border-purple-200', tag: 'bg-purple-100 text-purple-700' },
  { slug: 'video',     iconBg: 'bg-rose-500',    title: '论文科研辅助',   desc: '论文写作/文献综述/数据分析工具', color: 'from-red-50 to-red-100',       border: 'border-red-200',    tag: 'bg-red-100 text-red-700'       },
  { slug: 'marketing', iconBg: 'bg-orange-500',  title: '全链路营销',     desc: '文案选题/投放/数据运营套装',   color: 'from-orange-50 to-orange-100', border: 'border-orange-200', tag: 'bg-orange-100 text-orange-700' },
  { slug: 'legal',     iconBg: 'bg-blue-500',    title: '律师合同审查',   desc: '文书拟写/风险检测/法律辅助',   color: 'from-blue-50 to-blue-100',     border: 'border-blue-200',   tag: 'bg-blue-100 text-blue-700'     },
  { slug: 'content',   iconBg: 'bg-emerald-500', title: '高效开发与调试', desc: 'AI编程/代码审查/调试部署工具', color: 'from-green-50 to-green-100',   border: 'border-green-200',  tag: 'bg-green-100 text-green-700'   },
  { slug: 'finance',   iconBg: 'bg-amber-500',   title: '专业财务分析',   desc: '报税做账/发票识别/报表分析',   color: 'from-yellow-50 to-yellow-100', border: 'border-yellow-200', tag: 'bg-yellow-100 text-yellow-700' },
]

export default function AIToolSelection() {
  const [latest, setLatest] = useState({})

  useEffect(() => {
    document.title = 'AI工具选型速查 | TG AI工具库'
    fetchLatestSelections().then(setLatest).catch(() => {})
  }, [])

  return (
    <div className="min-h-screen flex flex-col bg-white">
      <Navbar />
      <main className="flex-1 max-w-[1200px] mx-auto w-full px-4 sm:px-6 py-8">
        <nav className="text-xs text-gray-400 mb-6 flex items-center gap-1">
          <Link to="/" className="hover:text-gray-600">首页</Link>
          <span>/</span>
          <span className="text-gray-600">选型速查</span>
        </nav>

        <div className="text-center mb-10">
          <h1 className="text-3xl font-bold text-gray-900 mb-3">AI工具选型速查</h1>
          <p className="text-gray-500">成熟场景化工具组合，直接落地使用</p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {SELECTION_SCENES.map((scene) => {
            const item = latest[scene.slug]
            return (
              <Link
                key={scene.slug}
                to={`/ai-tool-selection/${scene.slug}`}
                className={`article-card flex flex-col p-5 rounded-xl bg-gradient-to-b ${scene.color} border ${scene.border} no-underline`}
              >
                <div className="flex items-center gap-3 mb-3">
                  <div className={`w-10 h-10 rounded-xl ${scene.iconBg} flex items-center justify-center flex-shrink-0 shadow-sm`}>
                    {SCENE_ICONS[scene.slug]}
                  </div>
                  <div>
                    <span className={`text-base font-semibold px-2 py-0.5 rounded-full ${scene.tag}`}>{scene.title}</span>
                    <p className="text-xs text-gray-500 mt-1">{scene.desc}</p>
                  </div>
                </div>
                {item ? (
                  <p className="text-xs text-gray-600 leading-relaxed line-clamp-2">{item.summary}</p>
                ) : (
                  <p className="text-xs text-gray-400">暂无内容，敬请期待</p>
                )}
                {item?.period && (
                  <span className="mt-2 text-xs text-gray-400">{item.period}</span>
                )}
              </Link>
            )
          })}
        </div>
      </main>
      <Footer />
    </div>
  )
}
