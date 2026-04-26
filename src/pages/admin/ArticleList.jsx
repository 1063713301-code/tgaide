import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { adminFetchAll, adminDelete, adminBatchDelete, adminBatchUpdateStatus } from '../../lib/supabase'
import { adminLogout } from '../../hooks/useAuth'

function formatDate(dateStr) {
  if (!dateStr) return '-'
  return new Date(dateStr).toLocaleDateString('zh-CN')
}

export default function AdminArticleList({ type }) {
  const [articles, setArticles] = useState([])
  const [loading, setLoading] = useState(true)
  const [deleting, setDeleting] = useState(null)
  const [selected, setSelected] = useState(new Set())
  const [bulkBusy, setBulkBusy] = useState(false)
  const navigate = useNavigate()

  const isReport = type === 'report'
  const isSelection = type === 'selection'
  const title = isReport ? '行业报告管理' : isSelection ? '选型速查管理' : '每日简报管理'
  const newPath = isReport ? '/admin/reports/new' : isSelection ? '/admin/selections/new' : '/admin/briefs/new'
  const editBase = isReport ? '/admin/reports/edit' : isSelection ? '/admin/selections/edit' : '/admin/briefs/edit'

  useEffect(() => {
    document.title = `${title} - TG AI工具库`
    loadData()
  }, [type])

  async function loadData() {
    setLoading(true)
    setSelected(new Set())
    try {
      const data = await adminFetchAll(type)
      setArticles(data)
    } catch (e) {
      alert('加载数据失败：' + e.message)
    } finally {
      setLoading(false)
    }
  }

  async function handleDelete(id, t) {
    if (!window.confirm(`确认删除「${t}」？此操作不可恢复。`)) return
    setDeleting(id)
    try {
      await adminDelete(type, id)
      setArticles((prev) => prev.filter((a) => a.id !== id))
      setSelected((prev) => { const s = new Set(prev); s.delete(id); return s })
    } catch (e) {
      alert('删除失败：' + e.message)
    } finally {
      setDeleting(null)
    }
  }

  function toggleAll(checked) {
    setSelected(checked ? new Set(articles.map((a) => a.id)) : new Set())
  }

  function toggleOne(id) {
    setSelected((prev) => {
      const s = new Set(prev)
      s.has(id) ? s.delete(id) : s.add(id)
      return s
    })
  }

  async function handleBulkDelete() {
    if (!selected.size) return
    if (!window.confirm(`确认删除选中的 ${selected.size} 篇？此操作不可恢复。`)) return
    setBulkBusy(true)
    try {
      await adminBatchDelete(type, [...selected])
      setArticles((prev) => prev.filter((a) => !selected.has(a.id)))
      setSelected(new Set())
    } catch (e) {
      alert('批量删除失败：' + e.message)
    } finally {
      setBulkBusy(false)
    }
  }

  async function handleBulkStatus(status) {
    if (!selected.size) return
    setBulkBusy(true)
    try {
      await adminBatchUpdateStatus(type, [...selected], status)
      setArticles((prev) => prev.map((a) => selected.has(a.id) ? { ...a, status } : a))
      setSelected(new Set())
    } catch (e) {
      alert('批量操作失败：' + e.message)
    } finally {
      setBulkBusy(false)
    }
  }

  const allChecked = articles.length > 0 && selected.size === articles.length

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b border-gray-200 px-4 sm:px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Link to="/admin/dashboard" className="text-gray-400 hover:text-gray-600">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </Link>
          <span className="font-semibold text-gray-800">{title}</span>
          <span className="text-xs text-gray-400 bg-gray-100 px-2 py-0.5 rounded-full">{articles.length} 篇</span>
        </div>
        <div className="flex items-center gap-3">
          <Link to={newPath} className="px-4 py-2 bg-emerald-500 hover:bg-emerald-600 text-white text-sm font-medium rounded-lg transition-colors">+ 新建</Link>
          <button onClick={() => { adminLogout(); navigate('/admin') }} className="text-sm text-gray-400 hover:text-red-500">退出</button>
        </div>
      </header>

      <div className="max-w-5xl mx-auto px-6 py-6">
        {selected.size > 0 && (
          <div className="mb-4 flex items-center gap-3 bg-blue-50 border border-blue-200 rounded-xl px-4 py-2.5">
            <span className="text-sm text-blue-700 font-medium">已选 {selected.size} 篇</span>
            <button onClick={() => handleBulkStatus('published')} disabled={bulkBusy} className="px-3 py-1 bg-emerald-500 hover:bg-emerald-600 text-white text-xs rounded-lg disabled:opacity-40">批量发布</button>
            <button onClick={() => handleBulkStatus('draft')} disabled={bulkBusy} className="px-3 py-1 bg-yellow-500 hover:bg-yellow-600 text-white text-xs rounded-lg disabled:opacity-40">批量存草稿</button>
            <button onClick={handleBulkDelete} disabled={bulkBusy} className="px-3 py-1 bg-red-500 hover:bg-red-600 text-white text-xs rounded-lg disabled:opacity-40">批量删除</button>
            <button onClick={() => setSelected(new Set())} className="ml-auto text-xs text-gray-400 hover:text-gray-600">取消选择</button>
          </div>
        )}

        {loading ? (
          <div className="space-y-3">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="bg-white border border-gray-200 rounded-xl p-4">
                <div className="skeleton h-4 w-1/2 rounded mb-2" />
                <div className="skeleton h-3 w-1/4 rounded" />
              </div>
            ))}
          </div>
        ) : articles.length === 0 ? (
          <div className="text-center py-16 text-gray-400">
            <div className="text-4xl mb-3">📭</div>
            <p className="mb-4">还没有内容</p>
            <Link to={newPath} className="px-5 py-2.5 bg-emerald-500 text-white rounded-lg text-sm font-medium hover:bg-emerald-600">立即创建第一篇</Link>
          </div>
        ) : (
          <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-200">
                  <th className="px-4 py-3 w-8">
                    <input type="checkbox" checked={allChecked} onChange={(e) => toggleAll(e.target.checked)} className="rounded" />
                  </th>
                  <th className="text-left px-4 py-3 font-medium text-gray-600">标题</th>
                  <th className="text-left px-4 py-3 font-medium text-gray-600 hidden sm:table-cell">分类</th>
                  <th className="text-left px-4 py-3 font-medium text-gray-600 hidden sm:table-cell">发布日期</th>
                  <th className="text-left px-4 py-3 font-medium text-gray-600">状态</th>
                  <th className="text-right px-4 py-3 font-medium text-gray-600">操作</th>
                </tr>
              </thead>
              <tbody>
                {articles.map((article, idx) => (
                  <tr key={article.id} className={`border-b border-gray-100 hover:bg-gray-50 transition-colors ${idx === articles.length - 1 ? 'border-0' : ''} ${selected.has(article.id) ? 'bg-blue-50' : ''}`}>
                    <td className="px-4 py-3">
                      <input type="checkbox" checked={selected.has(article.id)} onChange={() => toggleOne(article.id)} className="rounded" />
                    </td>
                    <td className="px-4 py-3">
                      <span className="font-medium text-gray-800 line-clamp-1">{article.title}</span>
                    </td>
                    <td className="px-4 py-3 text-gray-500 hidden sm:table-cell">
                      {isSelection ? (article.scene || '-') : (article.category || '-')}
                    </td>
                    <td className="px-4 py-3 text-gray-400 hidden sm:table-cell">{formatDate(article.publish_date)}</td>
                    <td className="px-4 py-3">
                      <span className={`inline-block px-2 py-0.5 rounded-full text-xs font-medium ${article.status === 'published' ? 'bg-emerald-50 text-emerald-700' : 'bg-yellow-50 text-yellow-700'}`}>
                        {article.status === 'published' ? '已发布' : '草稿'}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <Link to={`${editBase}/${article.id}`} className="text-blue-600 hover:text-blue-700 font-medium">编辑</Link>
                        <button onClick={() => handleDelete(article.id, article.title)} disabled={deleting === article.id} className="text-red-500 hover:text-red-600 font-medium disabled:opacity-40">
                          {deleting === article.id ? '删除中…' : '删除'}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}
