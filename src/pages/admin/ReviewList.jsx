import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { adminFetchReviews, adminDeleteReview, adminApproveReview, adminRejectReview } from '../../lib/supabase'
import { adminLogout } from '../../hooks/useAuth'

const STATUS_LABELS = { pending: '待审核', approved: '已通过', rejected: '已拒绝' }
const STATUS_COLORS = {
  pending:  'bg-yellow-50 text-yellow-700',
  approved: 'bg-emerald-50 text-emerald-700',
  rejected: 'bg-red-50 text-red-600',
}

export default function AdminReviewList() {
  const [reviews, setReviews]     = useState([])
  const [loading, setLoading]     = useState(true)
  const [filter, setFilter]       = useState('all')
  const [busy, setBusy]           = useState(null)
  const [rejectId, setRejectId]   = useState(null)
  const [rejectReason, setRejectReason] = useState('')
  const [expandedId, setExpandedId] = useState(null)
  const navigate = useNavigate()

  useEffect(() => {
    document.title = '评测管理 - TG AI工具库'
    adminFetchReviews()
      .then(setReviews)
      .catch((e) => alert('加载失败：' + e.message))
      .finally(() => setLoading(false))
  }, [])

  const filtered = filter === 'all' ? reviews : reviews.filter((r) => r.status === filter)

  async function handleApprove(id) {
    setBusy(id)
    try {
      await adminApproveReview(id)
      setReviews((prev) => prev.map((r) => r.id === id ? { ...r, status: 'approved' } : r))
    } catch (e) { alert('操作失败：' + e.message) }
    finally { setBusy(null) }
  }

  async function handleReject(id) {
    if (!rejectReason.trim()) return alert('请填写拒绝原因')
    setBusy(id)
    try {
      await adminRejectReview(id, rejectReason.trim())
      setReviews((prev) => prev.map((r) => r.id === id ? { ...r, status: 'rejected', reject_reason: rejectReason.trim() } : r))
      setRejectId(null)
      setRejectReason('')
    } catch (e) { alert('操作失败：' + e.message) }
    finally { setBusy(null) }
  }

  async function handleDelete(id, nickname) {
    if (!window.confirm(`确认删除「${nickname}」的评测？`)) return
    setBusy(id)
    try {
      await adminDeleteReview(id)
      setReviews((prev) => prev.filter((r) => r.id !== id))
    } catch (e) { alert('删除失败：' + e.message) }
    finally { setBusy(null) }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b border-gray-200 px-4 sm:px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Link to="/admin/dashboard" className="text-gray-400 hover:text-gray-600">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </Link>
          <span className="font-semibold text-gray-800">用户评测管理</span>
          <span className="text-xs text-gray-400 bg-gray-100 px-2 py-0.5 rounded-full">{reviews.length} 条</span>
        </div>
        <button onClick={() => { adminLogout(); navigate('/admin') }} className="text-sm text-gray-400 hover:text-red-500">退出</button>
      </header>

      <div className="max-w-6xl mx-auto px-6 py-6">
        {/* 状态筛选 */}
        <div className="flex gap-2 mb-4">
          {['all', 'pending', 'approved', 'rejected'].map((s) => (
            <button key={s} onClick={() => setFilter(s)}
              className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${filter === s ? 'bg-blue-600 text-white' : 'bg-white border border-gray-200 text-gray-600 hover:bg-gray-50'}`}>
              {s === 'all' ? '全部' : STATUS_LABELS[s]}
              {s !== 'all' && <span className="ml-1 text-xs opacity-70">({reviews.filter((r) => r.status === s).length})</span>}
            </button>
          ))}
        </div>

        {loading ? (
          <div className="space-y-3">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="bg-white border border-gray-200 rounded-xl p-4">
                <div className="skeleton h-4 w-1/3 rounded mb-2" /><div className="skeleton h-3 w-1/2 rounded" />
              </div>
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-16 text-gray-400">暂无数据</div>
        ) : (
          <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-gray-50 border-b border-gray-200">
                    <th className="text-left px-4 py-3 font-medium text-gray-600">用户</th>
                    <th className="text-left px-4 py-3 font-medium text-gray-600 hidden sm:table-cell">职业</th>
                    <th className="text-left px-4 py-3 font-medium text-gray-600 hidden md:table-cell">推荐工具</th>
                    <th className="text-left px-4 py-3 font-medium text-gray-600 hidden lg:table-cell">提交IP</th>
                    <th className="text-left px-4 py-3 font-medium text-gray-600 hidden lg:table-cell">时间</th>
                    <th className="text-left px-4 py-3 font-medium text-gray-600">状态</th>
                    <th className="text-right px-4 py-3 font-medium text-gray-600">操作</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((r, idx) => (
                    <>
                      <tr key={r.id} className={`border-b border-gray-100 hover:bg-gray-50 ${idx === filtered.length - 1 && rejectId !== r.id && expandedId !== r.id ? 'border-0' : ''}`}>
                        <td className="px-4 py-3">
                          <div className="font-medium text-gray-800">{r.user_nickname || r.nickname}</div>
                          <div className="text-xs text-gray-400 truncate max-w-[180px]">{r.content?.slice(0, 35)}…</div>
                          <button onClick={() => setExpandedId(expandedId === r.id ? null : r.id)}
                            className="text-xs text-blue-600 hover:text-blue-700 mt-1">
                            {expandedId === r.id ? '收起' : '查看详情'}
                          </button>
                        </td>
                        <td className="px-4 py-3 text-gray-500 hidden sm:table-cell">{r.user_occupation || r.occupation || '-'}</td>
                        <td className="px-4 py-3 text-gray-500 hidden md:table-cell">{r.tool_name || '-'}</td>
                        <td className="px-4 py-3 text-gray-400 text-xs hidden lg:table-cell">{r.submit_ip || '-'}</td>
                        <td className="px-4 py-3 text-gray-400 text-xs hidden lg:table-cell">{new Date(r.created_at).toLocaleDateString('zh-CN')}</td>
                        <td className="px-4 py-3">
                          <span className={`inline-block px-2 py-0.5 rounded-full text-xs font-medium ${STATUS_COLORS[r.status] || STATUS_COLORS.pending}`}>
                            {STATUS_LABELS[r.status] || r.status}
                          </span>
                          {r.status === 'rejected' && r.reject_reason && (
                            <div className="text-xs text-red-400 mt-0.5 max-w-[120px] truncate" title={r.reject_reason}>{r.reject_reason}</div>
                          )}
                        </td>
                        <td className="px-4 py-3 text-right">
                          <div className="flex items-center justify-end gap-2 flex-wrap">
                            {r.status !== 'approved' && (
                              <button onClick={() => handleApprove(r.id)} disabled={busy === r.id}
                                className="text-emerald-600 hover:text-emerald-700 font-medium disabled:opacity-40 text-xs">通过</button>
                            )}
                            {r.status !== 'rejected' && (
                              <button onClick={() => { setRejectId(r.id); setRejectReason('') }} disabled={busy === r.id}
                                className="text-orange-500 hover:text-orange-600 font-medium disabled:opacity-40 text-xs">拒绝</button>
                            )}
                            <button onClick={() => handleDelete(r.id, r.user_nickname || r.nickname)} disabled={busy === r.id}
                              className="text-red-500 hover:text-red-600 font-medium disabled:opacity-40 text-xs">删除</button>
                          </div>
                        </td>
                      </tr>
                      {expandedId === r.id && (
                        <tr key={`detail-${r.id}`} className="bg-blue-50 border-b border-gray-100">
                          <td colSpan={7} className="px-4 py-4">
                            <div className="space-y-3">
                              <div>
                                <div className="text-xs text-gray-500 mb-1">评测内容：</div>
                                <div className="text-sm text-gray-700 leading-relaxed bg-white rounded-lg p-3 border border-blue-100">{r.content}</div>
                              </div>
                              <div className="grid grid-cols-2 gap-3 text-xs">
                                <div><span className="text-gray-500">评分：</span><span className="text-yellow-600 font-medium">{'★'.repeat(r.rating || 5)}{'☆'.repeat(5 - (r.rating || 5))}</span></div>
                                <div><span className="text-gray-500">邮箱：</span><span className="text-gray-700">{r.email || '未填写'}</span></div>
                                {r.weibo && <div><span className="text-gray-500">微博：</span><span className="text-gray-700">{r.weibo}</span></div>}
                                {r.xiaohongshu && <div><span className="text-gray-500">小红书：</span><span className="text-gray-700">{r.xiaohongshu}</span></div>}
                                {r.bilibili && <div><span className="text-gray-500">B站：</span><span className="text-gray-700">{r.bilibili}</span></div>}
                                {r.douyin && <div><span className="text-gray-500">抖音：</span><span className="text-gray-700">{r.douyin}</span></div>}
                              </div>
                              {Array.isArray(r.images) && r.images.length > 0 && (
                                <div>
                                  <div className="text-xs text-gray-500 mb-2">上传图片：</div>
                                  <div className="flex gap-2 flex-wrap">
                                    {r.images.map((url, i) => (
                                      <img key={i} src={url} alt="" className="w-20 h-20 object-cover rounded-lg border border-gray-200" />
                                    ))}
                                  </div>
                                </div>
                              )}
                            </div>
                          </td>
                        </tr>
                      )}
                      {rejectId === r.id && (
                        <tr key={`reject-${r.id}`} className="bg-orange-50 border-b border-gray-100">
                          <td colSpan={7} className="px-4 py-3">
                            <div className="flex items-center gap-3">
                              <input value={rejectReason} onChange={(e) => setRejectReason(e.target.value)}
                                placeholder="请填写拒绝原因（必填）"
                                className="flex-1 px-3 py-1.5 border border-orange-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-orange-400" />
                              <button onClick={() => handleReject(r.id)} disabled={busy === r.id}
                                className="px-3 py-1.5 bg-orange-500 hover:bg-orange-600 text-white text-sm rounded-lg disabled:opacity-40">确认拒绝</button>
                              <button onClick={() => setRejectId(null)} className="px-3 py-1.5 border border-gray-200 text-gray-500 text-sm rounded-lg hover:bg-gray-50">取消</button>
                            </div>
                          </td>
                        </tr>
                      )}
                    </>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
