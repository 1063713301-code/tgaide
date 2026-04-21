import { useEffect, useState } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { adminCreateReview, adminUpdateReview, adminFetchReviews } from '../../lib/supabase'

const empty = { nickname: '', occupation: '', rating: '5', content: '', tool_name: '', status: 'published' }

export default function AdminReviewEditor({ mode }) {
  const { id } = useParams()
  const navigate = useNavigate()
  const [form, setForm] = useState(empty)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    if (mode === 'edit' && id) {
      adminFetchReviews().then((list) => {
        const r = list.find((x) => x.id === id)
        if (r) setForm({ nickname: r.nickname || '', occupation: r.occupation || '', rating: String(r.rating || 5), content: r.content || '', tool_name: r.tool_name || '', status: r.status || 'published' })
      })
    }
  }, [mode, id])

  const set = (k, v) => setForm((p) => ({ ...p, [k]: v }))

  async function handleSave() {
    if (!form.nickname.trim() || !form.content.trim()) return alert('请填写用户昵称和评测内容')
    setSaving(true)
    const payload = { ...form, rating: parseInt(form.rating, 10) || 5 }
    try {
      if (mode === 'new') await adminCreateReview(payload)
      else await adminUpdateReview(id, payload)
      navigate('/admin/reviews')
    } catch (e) {
      alert('保存失败：' + e.message)
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between sticky top-0 z-40">
        <div className="flex items-center gap-3">
          <Link to="/admin/reviews" className="text-gray-400 hover:text-gray-600">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </Link>
          <span className="font-semibold text-gray-800">{mode === 'new' ? '新建评测' : '编辑评测'}</span>
        </div>
        <button onClick={handleSave} disabled={saving} className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-lg disabled:opacity-40">
          {saving ? '保存中…' : '保存'}
        </button>
      </header>

      <div className="max-w-2xl mx-auto px-4 py-6 space-y-4">
        <div className="bg-white border border-gray-200 rounded-xl p-5 grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">用户昵称 <span className="text-red-500">*</span></label>
            <input value={form.nickname} onChange={(e) => set('nickname', e.target.value)} placeholder="如：张律师" className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">职业</label>
            <input value={form.occupation} onChange={(e) => set('occupation', e.target.value)} placeholder="如：律师" className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">推荐工具</label>
            <input value={form.tool_name} onChange={(e) => set('tool_name', e.target.value)} placeholder="如：法查查AI" className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">评分（1-5）</label>
            <select value={form.rating} onChange={(e) => set('rating', e.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
              {[5,4,3,2,1].map((n) => <option key={n} value={n}>{n} 星</option>)}
            </select>
          </div>
        </div>

        <div className="bg-white border border-gray-200 rounded-xl p-5">
          <label className="block text-sm font-medium text-gray-700 mb-1">评测内容 <span className="text-red-500">*</span></label>
          <textarea value={form.content} onChange={(e) => set('content', e.target.value)} rows={5} placeholder="请输入用户的真实评测内容" className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none" />
        </div>

        <div className="bg-white border border-gray-200 rounded-xl p-5">
          <label className="block text-sm font-medium text-gray-700 mb-1">发布状态</label>
          <select value={form.status} onChange={(e) => set('status', e.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
            <option value="published">已发布</option>
            <option value="draft">草稿</option>
          </select>
        </div>

        <div className="flex justify-end gap-3 pb-8">
          <Link to="/admin/reviews" className="px-5 py-2.5 border border-gray-200 rounded-lg text-sm text-gray-600 hover:bg-gray-50">取消</Link>
          <button onClick={handleSave} disabled={saving} className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold rounded-lg disabled:opacity-40">
            {saving ? '保存中…' : '保存'}
          </button>
        </div>
      </div>
    </div>
  )
}
