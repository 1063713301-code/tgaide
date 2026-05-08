import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import Navbar from '../components/Navbar'
import Footer from '../components/Footer'
import { fetchLatestSelections } from '../lib/supabase'

export const SELECTION_SCENES = [
  { slug: 'design',    icon: '🎨', title: '设计系统生成',   desc: '海报/建模/视觉全套AI方案',     color: 'from-purple-50 to-purple-100', border: 'border-purple-200', tag: 'bg-purple-100 text-purple-700' },
  { slug: 'video',     icon: '🎬', title: '视频内容制作',   desc: '剪辑/数字人/短视频自动化工具', color: 'from-red-50 to-red-100',       border: 'border-red-200',    tag: 'bg-red-100 text-red-700'       },
  { slug: 'marketing', icon: '📣', title: '全链路运营推广', desc: '文案选题/投放/数据运营套装',   color: 'from-orange-50 to-orange-100', border: 'border-orange-200', tag: 'bg-orange-100 text-orange-700' },
  { slug: 'legal',     icon: '⚖️', title: '律师合同审查',   desc: '文书拟写/风险检测/法律辅助',   color: 'from-blue-50 to-blue-100',     border: 'border-blue-200',   tag: 'bg-blue-100 text-blue-700'     },
  { slug: 'content',   icon: '✍️', title: '商业内容营销',   desc: '品牌文案/策划/种草内容生成',   color: 'from-green-50 to-green-100',   border: 'border-green-200',  tag: 'bg-green-100 text-green-700'   },
  { slug: 'finance',   icon: '💹', title: '专业财务分析',   desc: '报税做账/发票识别/报表分析',   color: 'from-yellow-50 to-yellow-100', border: 'border-yellow-200', tag: 'bg-yellow-100 text-yellow-700' },
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
                  <span className="text-3xl">{scene.icon}</span>
                  <div>
                    <span className={`text-sm font-semibold px-2 py-0.5 rounded-full ${scene.tag}`}>{scene.title}</span>
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
