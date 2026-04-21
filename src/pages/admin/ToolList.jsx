import { useEffect, useState, useMemo } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { adminFetchTools, adminDeleteTool, adminBatchDeleteTools } from '../../lib/supabase'
import { adminLogout } from '../../hooks/useAuth'

function formatDate(dateStr) {
  if (!dateStr) return '-'
  return new Date(dateStr).toLocaleDateString('zh-CN')
}

function StarCount({ rating }) {
  return (
    <span className="flex items-center gap-1">
      <svg className="w-3.5 h-3.5 text-yellow-400 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
        <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
      </svg>
      <span className="text-gray-600 text-xs">{Number(rating).toFixed(1)}</span>
    </span>
  )
}

export default function AdminToolList() {
  const [tools, setTools]         = useState([])
  const [loading, setLoading]     = useState(true)
  const [search, setSearch]       = useState('')
  const [selected, setSelected]   = useState(new Set())
  const [deleting, setDeleting]   = useState(null)  // single id
  const [batchBusy, setBatchBusy] = useState(false)
  const navigate = useNavigate()

  useEffect(() => {
    document.title = 'AI工具管理 - TG AI工具库'
    loadData()
  }, [])

  async function loadData() {
    setLoading(true)
    try {
      const data = await adminFetchTools()
      setTools(data)
    } catch (e) {
      alert('加载失败：' + e.message)
    } finally {
      setLoading(false)
    }
  }

  // 客户端搜索过滤
  const filtered = useMemo(() => {
    if (!search.trim()) return tools
    const q = search.trim().toLowerCase()
    return tools.filter(
      (t) => t.name.toLowerCase().includes(q) || t.category.toLowerCase().includes(q),
    )
  }, [tools, search])

  // 全选 / 取消全选
  const allSelected = filtered.length > 0 && filtered.every((t) => selected.has(t.id))
  const toggleAll = () => {
    setSelected(allSelected ? new Set() : new Set(filtered.map((t) => t.id)))
  }
  const toggleOne = (id) => {
    setSelected((prev) => {
      const next = new Set(prev)
      next.has(id) ? next.delete(id) : next.add(id)
      return next
    })
  }

  // 单条删除
  async function handleDelete(id, name) {
    if (!window.confirm(`确认删除「${name}」？此操作不可恢复。`)) return
    setDeleting(id)
    try {
      await adminDeleteTool(id)
      setTools((prev) => prev.filter((t) => t.id !== id))
      setSelected((prev) => { const n = new Set(prev); n.delete(id); return n })
    } catch (e) {
      alert('删除失败：' + e.message)
    } finally {
      setDeleting(null)
    }
  }

  // 批量删除
  async function handleBatchDelete() {
    const ids = [...selected]
    if (!window.confirm(`确认批量删除选中的 ${ids.length} 个工具？此操作不可恢复。`)) return
    setBatchBusy(true)
    try {
      await adminBatchDeleteTools(ids)
      setTools((prev) => prev.filter((t) => !ids.includes(t.id)))
      setSelected(new Set())
    } catch (e) {
      alert('批量删除失败：' + e.message)
    } finally {
      setBatchBusy(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* 顶部 */}
      <header className="bg-white border-b border-gray-200 px-4 sm:px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Link to="/admin/dashboard" className="text-gray-400 hover:text-gray-600">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </Link>
          <span className="font-semibold text-gray-800">AI工具管理</span>
          <span className="ml-1 text-xs text-gray-400 bg-gray-100 px-2 py-0.5 rounded-full">
            {tools.length} 个
          </span>
        </div>
        <div className="flex items-center gap-3">
          <Link
            to="/admin/tools/new"
            className="px-4 py-2 bg-emerald-500 hover:bg-emerald-600 text-white text-sm font-medium rounded-lg transition-colors"
          >
            + 新建工具
          </Link>
          <button
            onClick={() => { adminLogout(); navigate('/admin') }}
            className="text-sm text-gray-400 hover:text-red-500"
          >
            退出
          </button>
        </div>
      </header>

      <div className="max-w-5xl mx-auto px-6 py-6">
        {/* 搜索 + 批量操作栏 */}
        <div className="flex flex-col sm:flex-row gap-3 mb-4">
          <div className="relative flex-1">
            <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none"
                 fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="搜索工具名称或职业分类"
              className="w-full pl-9 pr-4 py-2.5 bg-white border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />
            {search && (
              <button onClick={() => setSearch('')}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            )}
          </div>
          {selected.size > 0 && (
            <button
              onClick={handleBatchDelete}
              disabled={batchBusy}
              className="px-4 py-2.5 bg-red-500 hover:bg-red-600 text-white text-sm font-medium rounded-xl transition-colors disabled:opacity-40 whitespace-nowrap"
            >
              {batchBusy ? '删除中…' : `批量删除 (${selected.size})`}
            </button>
          )}
        </div>

        {loading ? (
          <div className="space-y-3">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="bg-white border border-gray-200 rounded-xl p-4 flex gap-3">
                <div className="skeleton w-4 h-4 rounded mt-0.5 flex-shrink-0" />
                <div className="flex-1">
                  <div className="skeleton h-4 w-1/2 rounded mb-2" />
                  <div className="skeleton h-3 w-1/4 rounded" />
                </div>
              </div>
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-16 text-gray-400">
            <div className="text-4xl mb-3">🔧</div>
            {search ? (
              <p>没有找到「{search}」相关工具</p>
            ) : (
              <>
                <p className="mb-4">还没有工具数据</p>
                <Link to="/admin/tools/new"
                      className="px-5 py-2.5 bg-emerald-500 text-white rounded-lg text-sm font-medium hover:bg-emerald-600">
                  立即创建第一个
                </Link>
              </>
            )}
          </div>
        ) : (
          <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-gray-50 border-b border-gray-200">
                    <th className="px-4 py-3 w-10">
                      <input
                        type="checkbox"
                        checked={allSelected}
                        onChange={toggleAll}
                        className="w-4 h-4 rounded border-gray-300 text-emerald-500 cursor-pointer"
                      />
                    </th>
                    <th className="text-left px-4 py-3 font-medium text-gray-600">工具名称</th>
                    <th className="text-left px-4 py-3 font-medium text-gray-600 hidden sm:table-cell">职业分类</th>
                    <th className="text-left px-4 py-3 font-medium text-gray-600 hidden md:table-cell">价格</th>
                    <th className="text-left px-4 py-3 font-medium text-gray-600 hidden md:table-cell">评分</th>
                    <th className="text-left px-4 py-3 font-medium text-gray-600">状态</th>
                    <th className="text-left px-4 py-3 font-medium text-gray-600 hidden lg:table-cell">创建时间</th>
                    <th className="text-right px-4 py-3 font-medium text-gray-600">操作</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((tool, idx) => (
                    <tr
                      key={tool.id}
                      className={`border-b border-gray-100 hover:bg-gray-50 transition-colors ${
                        idx === filtered.length - 1 ? 'border-0' : ''
                      } ${selected.has(tool.id) ? 'bg-blue-50/40' : ''}`}
                    >
                      {/* 复选框 */}
                      <td className="px-4 py-3">
                        <input
                          type="checkbox"
                          checked={selected.has(tool.id)}
                          onChange={() => toggleOne(tool.id)}
                          className="w-4 h-4 rounded border-gray-300 text-emerald-500 cursor-pointer"
                        />
                      </td>
                      {/* 工具名称（含图标） */}
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          {tool.icon_url ? (
                            <img src={tool.icon_url} alt={tool.name}
                                 className="w-7 h-7 rounded-lg object-cover flex-shrink-0" />
                          ) : (
                            <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-emerald-400 to-emerald-600 flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
                              {tool.name.charAt(0)}
                            </div>
                          )}
                          <span className="font-medium text-gray-800 truncate max-w-[160px]">{tool.name}</span>
                        </div>
                      </td>
                      {/* 分类 */}
                      <td className="px-4 py-3 hidden sm:table-cell">
                        <span className="text-gray-500">{tool.category || '-'}</span>
                      </td>
                      {/* 价格 */}
                      <td className="px-4 py-3 hidden md:table-cell">
                        <span className={`text-xs font-medium ${
                          tool.price === '免费' ? 'text-emerald-600' : 'text-gray-500'
                        }`}>{tool.price || '-'}</span>
                      </td>
                      {/* 评分 */}
                      <td className="px-4 py-3 hidden md:table-cell">
                        <StarCount rating={tool.rating || 0} />
                      </td>
                      {/* 状态 */}
                      <td className="px-4 py-3">
                        <span className={`inline-block px-2 py-0.5 rounded-full text-xs font-medium ${
                          tool.status === 'active'
                            ? 'bg-emerald-50 text-emerald-700'
                            : 'bg-yellow-50 text-yellow-700'
                        }`}>
                          {tool.status === 'active' ? '已发布' : '草稿'}
                        </span>
                      </td>
                      {/* 时间 */}
                      <td className="px-4 py-3 text-gray-400 hidden lg:table-cell">
                        {formatDate(tool.created_at)}
                      </td>
                      {/* 操作 */}
                      <td className="px-4 py-3 text-right">
                        <div className="flex items-center justify-end gap-3">
                          <Link
                            to={`/admin/tools/${tool.id}/edit`}
                            className="text-blue-600 hover:text-blue-700 font-medium"
                          >
                            编辑
                          </Link>
                          <button
                            onClick={() => handleDelete(tool.id, tool.name)}
                            disabled={deleting === tool.id}
                            className="text-red-500 hover:text-red-600 font-medium disabled:opacity-40"
                          >
                            {deleting === tool.id ? '删除中…' : '删除'}
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* 底部统计 */}
            <div className="px-4 py-3 border-t border-gray-100 bg-gray-50 flex items-center justify-between text-xs text-gray-400">
              <span>共 {filtered.length} 个工具{search ? `（已过滤）` : ''}</span>
              {selected.size > 0 && (
                <span className="text-blue-600 font-medium">已选 {selected.size} 个</span>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
