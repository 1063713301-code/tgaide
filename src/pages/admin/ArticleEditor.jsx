import { useEffect, useState, useRef } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import RichTextEditor from '../../components/RichTextEditor'
import { adminCreate, adminUpdate, adminFetchById, adminBatchCreateSelections } from '../../lib/supabase'
import { CATEGORIES } from '../../components/CategoryTags'
import { extractSelectionsFromReport } from '../../lib/aiExtract'

const CATEGORY_OPTIONS = CATEGORIES.filter((c) => c.id !== '')

const SELECTION_SCENE_OPTIONS = [
  { id: 'design',    label: '设计系统生成' },
  { id: 'video',     label: '视频内容制作' },
  { id: 'marketing', label: '全链路运营推广' },
  { id: 'legal',     label: '律师合同审查' },
  { id: 'content',   label: '商业内容营销' },
  { id: 'finance',   label: '专业财务分析' },
]

function today() {
  return new Date().toISOString().split('T')[0]
}

const emptyForm = {
  title: '',
  publish_date: today(),
  category: '',
  scene: '',
  period: '',
  summary: '',
  content: '',
  pdf_url: '',
  status: 'published',
}

export default function AdminArticleEditor({ type, mode }) {
  const { id } = useParams()
  const navigate = useNavigate()
  const [form, setForm] = useState(emptyForm)
  const [loading, setLoading] = useState(mode === 'edit')
  const [saving, setSaving] = useState(false)
  const [errors, setErrors] = useState({})
  const [preview, setPreview] = useState(false)
  const savedRef = useRef(false)

  const isReport = type === 'report'
  const isSelection = type === 'selection'
  const typeLabel = isReport ? '行业报告' : isSelection ? '选型方案' : '每日简报'
  const title = `${mode === 'new' ? '新建' : '编辑'}${typeLabel}`
  const listPath = isReport ? '/admin/reports' : isSelection ? '/admin/selections' : '/admin/briefs'

  useEffect(() => {
    document.title = `${title} - TG AI工具库`
  }, [title])

  useEffect(() => {
    if (mode === 'edit' && id) {
      adminFetchById(type, id)
        .then((data) => {
          setForm({
            title: data.title || '',
            publish_date: data.publish_date || today(),
            category: data.category || '',
            scene: data.scene || '',
            period: data.period || '',
            summary: data.summary || '',
            content: data.content || '',
            pdf_url: data.pdf_url || '',
            status: data.status || 'published',
          })
        })
        .catch((e) => alert('加载失败：' + e.message))
        .finally(() => setLoading(false))
    }
  }, [mode, id, type])

  const set = (key, value) => {
    setForm((prev) => ({ ...prev, [key]: value }))
    if (errors[key]) setErrors((prev) => ({ ...prev, [key]: '' }))
  }

  const validate = () => {
    const errs = {}
    if (!form.title.trim()) errs.title = '请输入标题'
    if (!isSelection && !form.category) errs.category = '请选择职业分类'
    if (isSelection && !form.scene) errs.scene = '请选择场景分类'
    if (!form.summary.trim()) errs.summary = '请输入摘要'
    if (!form.content || form.content === '<p></p>') errs.content = '请输入正文内容'
    setErrors(errs)
    return Object.keys(errs).length === 0
  }

  const handleSave = async (statusOverride) => {
    if (!validate()) {
      window.scrollTo({ top: 0, behavior: 'smooth' })
      return
    }

    setSaving(true)
    const payload = { ...form, status: statusOverride || form.status }

    try {
      let saved
      if (mode === 'new') {
        saved = await adminCreate(type, payload)
      } else {
        saved = await adminUpdate(type, id, payload)
      }

      // 发布行业报告时，异步触发 AI 提取选型内容
      if (isReport && payload.status === 'published') {
        const period = payload.publish_date?.slice(0, 7) + '-期'
        extractSelectionsFromReport({
          content: payload.content,
          reportTitle: payload.title,
          reportId: saved?.id || id,
          period,
        }).then(async (scenes) => {
          const records = scenes
            .filter(s => s.title)
            .map(s => ({
              title: s.title,
              scene: s.scene,
              period,
              publish_date: payload.publish_date,
              summary: s.summary || '',
              content: s.content || '',
              source_report_id: saved?.id || id,
              status: 'published',
            }))
          if (records.length > 0) {
            await adminBatchCreateSelections(records)
            console.log(`[选型速查] 已自动提取 ${records.length} 条选型方案`)
          }
        }).catch(e => console.warn('[选型速查] AI提取失败（不影响发布）:', e.message))
      }

      savedRef.current = true
      navigate(listPath)
    } catch (e) {
      alert('保存失败：' + e.message)
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-gray-400">加载中…</div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* 顶部 */}
      <header className="bg-white border-b border-gray-200 px-4 sm:px-6 py-4 flex items-center justify-between sticky top-0 z-40">
        <div className="flex items-center gap-3">
          <Link to={listPath} className="text-gray-400 hover:text-gray-600">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </Link>
          <span className="font-semibold text-gray-800">{title}</span>
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setPreview(!preview)}
            className="px-3 py-2 border border-gray-200 rounded-lg text-sm text-gray-600 hover:bg-gray-50"
          >
            {preview ? '编辑' : '预览'}
          </button>
          <button
            type="button"
            onClick={() => handleSave('draft')}
            disabled={saving}
            className="px-3 py-2 border border-gray-200 rounded-lg text-sm text-gray-600 hover:bg-gray-50 disabled:opacity-40"
          >
            存草稿
          </button>
          <button
            type="button"
            onClick={() => handleSave('published')}
            disabled={saving}
            className="px-4 py-2 bg-emerald-500 hover:bg-emerald-600 text-white text-sm font-medium rounded-lg transition-colors disabled:opacity-40"
          >
            {saving ? '保存中…' : '发布'}
          </button>
        </div>
      </header>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 py-6 space-y-5">
        {/* 全局错误提示 */}
        {Object.keys(errors).length > 0 && (
          <div className="bg-red-50 border border-red-200 rounded-xl p-4 text-sm text-red-600">
            <strong>请完善以下必填项：</strong>
            <ul className="mt-2 list-disc list-inside">
              {Object.values(errors).filter(Boolean).map((e, i) => <li key={i}>{e}</li>)}
            </ul>
          </div>
        )}

        {preview ? (
          /* 预览模式 */
          <div className="bg-white border border-gray-200 rounded-xl p-8">
            <h1 className="text-2xl font-bold text-gray-900 mb-2">{form.title || '（无标题）'}</h1>
            <div className="flex gap-3 text-sm text-gray-400 mb-6">
              <span>{form.publish_date}</span>
              {form.category && <span className="text-emerald-600">{form.category}</span>}
            </div>
            {form.summary && (
              <div className="mb-6 p-4 bg-gray-50 border-l-4 border-emerald-400 rounded-r text-sm text-gray-600">
                {form.summary}
              </div>
            )}
            <div
              className="rich-text-content"
              dangerouslySetInnerHTML={{ __html: form.content }}
            />
          </div>
        ) : (
          <>
            {/* 标题 */}
            <div className="bg-white border border-gray-200 rounded-xl p-5">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                标题 <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={form.title}
                onChange={(e) => set('title', e.target.value)}
                placeholder="请输入文章标题"
                className={`w-full px-4 py-2.5 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent ${
                  errors.title ? 'border-red-400 bg-red-50' : 'border-gray-300'
                }`}
              />
              {errors.title && <p className="mt-1 text-xs text-red-500">{errors.title}</p>}
            </div>

            {/* 基本信息 */}
            <div className="bg-white border border-gray-200 rounded-xl p-5 grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  发布日期 <span className="text-red-500">*</span>
                </label>
                <input
                  type="date"
                  value={form.publish_date}
                  onChange={(e) => set('publish_date', e.target.value)}
                  className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              {isSelection ? (
                <>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      场景分类 <span className="text-red-500">*</span>
                    </label>
                    <select
                      value={form.scene}
                      onChange={(e) => set('scene', e.target.value)}
                      className={`w-full px-3 py-2.5 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 ${
                        errors.scene ? 'border-red-400 bg-red-50' : 'border-gray-300'
                      }`}
                    >
                      <option value="">请选择场景</option>
                      {SELECTION_SCENE_OPTIONS.map((s) => (
                        <option key={s.id} value={s.id}>{s.label}</option>
                      ))}
                    </select>
                    {errors.scene && <p className="mt-1 text-xs text-red-500">{errors.scene}</p>}
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">期数标识</label>
                    <input
                      type="text"
                      value={form.period}
                      onChange={(e) => set('period', e.target.value)}
                      placeholder="如：2026-04-期"
                      className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    />
                  </div>
                </>
              ) : (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    职业分类 <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={form.category}
                    onChange={(e) => set('category', e.target.value)}
                    className={`w-full px-3 py-2.5 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 ${
                      errors.category ? 'border-red-400 bg-red-50' : 'border-gray-300'
                    }`}
                  >
                    <option value="">请选择分类</option>
                    {CATEGORY_OPTIONS.map((c) => (
                      <option key={c.id} value={c.id}>{c.icon} {c.id}</option>
                    ))}
                  </select>
                  {errors.category && <p className="mt-1 text-xs text-red-500">{errors.category}</p>}
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">发布状态</label>
                <select
                  value={form.status}
                  onChange={(e) => set('status', e.target.value)}
                  className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                >
                  <option value="published">已发布</option>
                  <option value="draft">草稿</option>
                </select>
              </div>
            </div>

            {/* 摘要 */}
            <div className="bg-white border border-gray-200 rounded-xl p-5">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                列表页摘要 <span className="text-red-500">*</span>
                <span className="ml-2 text-xs text-gray-400 font-normal">（最多500字，显示在列表页卡片中）</span>
              </label>
              <textarea
                value={form.summary}
                onChange={(e) => set('summary', e.target.value)}
                placeholder="请输入简短摘要，这将显示在列表页卡片中（建议100字以内）"
                rows={3}
                maxLength={500}
                className={`w-full px-4 py-2.5 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 resize-none ${
                  errors.summary ? 'border-red-400 bg-red-50' : 'border-gray-300'
                }`}
              />
              <div className="flex justify-between mt-1">
                {errors.summary ? <p className="text-xs text-red-500">{errors.summary}</p> : <span />}
                <span className="text-xs text-gray-400">{form.summary.length}/500</span>
              </div>
            </div>

            {/* PDF链接 */}
            <div className="bg-white border border-gray-200 rounded-xl p-5">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                PDF下载链接
                <span className="ml-2 text-xs text-gray-400 font-normal">（填写阿里云OSS的PDF公开链接，不填则不显示下载按钮）</span>
              </label>
              <input
                type="url"
                value={form.pdf_url}
                onChange={(e) => set('pdf_url', e.target.value)}
                placeholder="https://your-bucket.oss-cn-hangzhou.aliyuncs.com/reports/xxx.pdf"
                className="w-full px-4 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
              {form.pdf_url && (
                <a
                  href={form.pdf_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mt-1 inline-block text-xs text-emerald-600 hover:underline"
                >
                  测试链接 ↗
                </a>
              )}
            </div>

            {/* 富文本编辑器 */}
            <div className="bg-white border border-gray-200 rounded-xl p-5">
              <label className="block text-sm font-medium text-gray-700 mb-3">
                正文内容 <span className="text-red-500">*</span>
                <span className="ml-2 text-xs text-gray-400 font-normal">
                  （支持直接从 Word 粘贴，格式自动保留）
                </span>
              </label>
              {errors.content && (
                <p className="mb-2 text-xs text-red-500">{errors.content}</p>
              )}
              <RichTextEditor
                value={form.content}
                onChange={(html) => set('content', html)}
                placeholder="请输入正文内容，或直接从 Word 粘贴……"
              />
            </div>

            {/* 底部操作按钮 */}
            <div className="flex justify-end gap-3 pb-8">
              <Link
                to={listPath}
                className="px-5 py-2.5 border border-gray-200 rounded-lg text-sm text-gray-600 hover:bg-gray-50"
              >
                取消
              </Link>
              <button
                type="button"
                onClick={() => handleSave('draft')}
                disabled={saving}
                className="px-5 py-2.5 border border-gray-300 rounded-lg text-sm text-gray-700 hover:bg-gray-50 disabled:opacity-40"
              >
                存为草稿
              </button>
              <button
                type="button"
                onClick={() => handleSave('published')}
                disabled={saving}
                className="px-5 py-2.5 bg-emerald-500 hover:bg-emerald-600 text-white text-sm font-semibold rounded-lg transition-colors disabled:opacity-40"
              >
                {saving ? '保存中…' : '发布'}
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  )
}
