import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import Navbar from '../components/Navbar'
import Footer from '../components/Footer'
import { fetchSelectionsByScene } from '../lib/supabase'
import { SELECTION_SCENES } from './AIToolSelection'

export default function AIToolSelectionScene() {
  const { scene } = useParams()
  const [items, setItems] = useState([])
  const [loading, setLoading] = useState(true)

  const sceneInfo = SELECTION_SCENES.find(s => s.slug === scene)

  useEffect(() => {
    if (!sceneInfo) return
    document.title = `${sceneInfo.title} 选型方案 | TG AI工具库`
    fetchSelectionsByScene(scene)
      .then(setItems)
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [scene, sceneInfo])

  if (!sceneInfo) {
    return (
      <div className="min-h-screen flex flex-col bg-white">
        <Navbar />
        <main className="flex-1 flex items-center justify-center text-gray-400">场景不存在</main>
        <Footer />
      </div>
    )
  }

  return (
    <div className="min-h-screen flex flex-col bg-white">
      <Navbar />
      <main className="flex-1 max-w-4xl mx-auto w-full px-4 sm:px-6 py-8">
        <nav className="text-xs text-gray-400 mb-6 flex items-center gap-1">
          <Link to="/" className="hover:text-gray-600">首页</Link>
          <span>/</span>
          <Link to="/ai-tool-selection" className="hover:text-gray-600">选型速查</Link>
          <span>/</span>
          <span className="text-gray-600">{sceneInfo.title}</span>
        </nav>

        <div className="flex items-center gap-3 mb-8">
          <span className="text-4xl">{sceneInfo.icon}</span>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">{sceneInfo.title}</h1>
            <p className="text-sm text-gray-500 mt-1">{sceneInfo.desc}</p>
          </div>
        </div>

        {loading ? (
          <div className="space-y-4">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="bg-white border border-gray-200 rounded-xl p-5">
                <div className="skeleton h-5 w-2/3 rounded mb-3" />
                <div className="skeleton h-4 w-full rounded mb-2" />
                <div className="skeleton h-4 w-4/5 rounded" />
              </div>
            ))}
          </div>
        ) : items.length === 0 ? (
          <div className="text-center py-20 text-gray-400">
            <div className="text-4xl mb-3">📭</div>
            <p>暂无选型方案，敬请期待</p>
          </div>
        ) : (
          <div className="space-y-4">
            {items.map(item => (
              <Link
                key={item.id}
                to={`/ai-tool-selection/${scene}/${item.id}`}
                className="block article-card p-5 no-underline"
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <h2 className="text-base font-semibold text-gray-900 mb-1 truncate">{item.title}</h2>
                    <p className="text-sm text-gray-500 line-clamp-2">{item.summary}</p>
                  </div>
                  <div className="text-right shrink-0">
                    {item.period && <div className="text-xs text-gray-400">{item.period}</div>}
                    <div className="text-xs text-gray-400 mt-1">{item.publish_date}</div>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </main>
      <Footer />
    </div>
  )
}
