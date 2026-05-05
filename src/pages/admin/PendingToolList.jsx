import { useEffect, useState, useMemo } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { adminFetchPendingTools, adminApproveTools, adminBatchDeleteTools } from '../../lib/supabase'
import { adminLogout } from '../../hooks/useAuth'

export default function PendingToolList() {
  const [tools, setTools] = useState([])
  const [loading, setLoading] = useState(true)
  const [selected, setSelected] = useState(new Set())
  const [busy, setBusy] = useState(false)
  const navigate = useNavigate()

  useEffect(() => {
    document.title = '待审核工具 - TG AI工具库'
    load()
  }, [])

  async function load() {
    setLoading(true)
    try {
      const data = await adminFetchPendingTools()
      setTools(data)
      setSelected(new Set(data.map(t => t.id)))
    } catch (e) { alert('加载失败：' + e.message) }
    finally { setLoading(false) }
  }

  const allChecked = tools.length > 0 && selected.size === tools.length
  const toggleAll = () => setSelected(allChecked ? new Set() : new Set(tools.map(t => t.id)))
  const toggleOne = id => {
    const s = new Set(selected); s.has(id) ? s.delete(id) : s.add(id); setSelected(s)
  }

  async function approveAll() {
    if (selected.size === 0) return alert('请先勾选要发布的工具')
    if (!confirm(`确认发布选中的 ${selected.size} 个工具？`)) return
    setBusy(true)
    try {
      await adminApproveTools([...selected])
      await load()
    } catch (e) { alert('发布失败：' + e.message) }
    finally { setBusy(false) }
  }

  async function deleteSelected() {
    if (selected.size === 0) return
    if (!confirm(`确认删除选中的 ${selected.size} 个工具？此操作不可撤销`)) return
    setBusy(true)
    try {
      await adminBatchDeleteTools([...selected])
      await load()
    } catch (e) { alert('删除失败：' + e.message) }
    finally { setBusy(false) }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b border-gray-200 px-4 sm:px-6 py-3 flex items-center justify-between sticky top-0 z-30">
        <div className="flex items-center gap-3">
          <Link to="/admin/dashboard" className="text-sm text-gray-500 hover:text-blue-600">← 返回</Link>
          <span className="text-gray-300">/</span>
          <span className="font-semibold text-gray-800">待审核工具</span>
        </div>
        <button onClick={() => { adminLogout(); navigate('/admin') }} className="text-sm text-gray-500 hover:text-red-500">退出</button>
      </header>

      <main className="max-w-6xl mx-auto px-4 sm:px-6 py-6">
        <div className="bg-white border border-gray-200 rounded-2xl p-5 mb-5 flex items-center justify-between">
          <div>
            <h1 className="text-lg font-bold text-gray-900">每日 AI 发现 · 待审核 ({tools.length})</h1>
            <p className="text-sm text-gray-500 mt-1">由 GitHub Action 每日自动抓取并 AI 分类，请扫描标题/分类后批量发布</p>
          </div>
          <div className="flex gap-2">
            <button onClick={deleteSelected} disabled={busy || selected.size === 0}
              className="px-4 py-2 border border-red-200 text-red-500 hover:bg-red-50 rounded-lg text-sm disabled:opacity-40">
              删除选中
            </button>
            <button onClick={approveAll} disabled={busy || selected.size === 0}
              className="px-4 py-2 bg-emerald-500 hover:bg-emerald-600 text-white rounded-lg text-sm font-semibold disabled:opacity-40">
              {busy ? '处理中…' : `一键发布 (${selected.size})`}
            </button>
          </div>
        </div>

        {loading ? (
          <div className="text-center py-16 text-gray-400">加载中…</div>
        ) : tools.length === 0 ? (
          <div className="bg-white border border-gray-200 rounded-2xl p-16 text-center">
            <div className="text-5xl mb-3">🎉</div>
            <p className="text-gray-500">暂无待审核工具</p>
            <p className="text-xs text-gray-400 mt-2">明天凌晨2点 Action 自动抓取后会出现</p>
          </div>
        ) : (
          <div className="bg-white border border-gray-200 rounded-2xl overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="w-10 px-4 py-3"><input type="checkbox" checked={allChecked} onChange={toggleAll} /></th>
                  <th className="text-left px-4 py-3 font-medium text-gray-600">名称</th>
                  <th className="text-left px-4 py-3 font-medium text-gray-600 w-20">职业</th>
                  <th className="text-left px-4 py-3 font-medium text-gray-600">简介</th>
                  <th className="text-left px-4 py-3 font-medium text-gray-600 w-32">官网</th>
                  <th className="text-right px-4 py-3 font-medium text-gray-600 w-20">操作</th>
                </tr>
              </thead>
              <tbody>
                {tools.map(t => (
                  <tr key={t.id} className="border-b border-gray-50 last:border-0 hover:bg-gray-50">
                    <td className="px-4 py-3"><input type="checkbox" checked={selected.has(t.id)} onChange={() => toggleOne(t.id)} /></td>
                    <td className="px-4 py-3">
                      <div className="font-semibold text-gray-800">{t.name}</div>
                      {t.short_tag && <div className="text-xs text-gray-400 mt-0.5">{t.short_tag}</div>}
                    </td>
                    <td className="px-4 py-3"><span className="text-xs px-2 py-0.5 bg-blue-50 text-blue-600 rounded">{t.category}</span></td>
                    <td className="px-4 py-3 text-gray-600 text-xs">{t.description}</td>
                    <td className="px-4 py-3">
                      {t.official_url && (
                        <a href={t.official_url} target="_blank" rel="noopener noreferrer" className="text-xs text-blue-500 hover:underline truncate block max-w-[150px]">访问 ↗</a>
                      )}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <Link to={`/admin/tools/${t.id}/edit`} className="text-xs text-gray-500 hover:text-blue-600">编辑</Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </main>
    </div>
  )
}
