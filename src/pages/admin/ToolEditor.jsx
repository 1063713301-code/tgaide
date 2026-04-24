import { useEffect, useState, useRef } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import mammoth from 'mammoth'
import {
  adminCreateTool,
  adminUpdateTool,
  adminFetchToolById,
  uploadToolIconToStorage,
} from '../../lib/supabase'

// ─── Word 文档解析 ─────────────────────────────────────
function extractField(text, ...labels) {
  for (const label of labels) {
    const re = new RegExp(`${label}[：:：]\\s*(.+)`, 'i')
    const m = text.match(re)
    if (m) return m[1].trim()
  }
  return ''
}

async function parseWordDoc(file) {
  const arrayBuffer = await file.arrayBuffer()
  const { value: text } = await mammoth.extractRawText({ arrayBuffer })
  return {
    name:        extractField(text, '工具名称', '名称', 'Name'),
    name_en:     extractField(text, '英文名称', 'English Name', 'name_en'),
    category:    extractField(text, '职业分类', '分类', 'Category'),
    description: extractField(text, '工具描述', '描述', 'Description'),
    description_en: extractField(text, '英文描述', 'English Description'),
    highlights:  extractField(text, '核心亮点', '亮点', 'Highlights'),
    keywords:    extractField(text, '搜索关键词', '关键词', 'Keywords'),
    price:       extractField(text, '价格', 'Price'),
    official_url: extractField(text, '官方链接', '官网', 'URL', 'Website'),
    rating:      extractField(text, '评分', 'Rating'),
    features:    (() => {
      const m = text.match(/(?:核心功能|功能亮点|Features)[：:\s]*([\s\S]*?)(?:\n\n|\n[^\n]|$)/)
      return m ? m[1].trim() : ''
    })(),
  }
}

// ─── 工具分类选项（与 AllTools 页面一致） ──────────────
const TOOL_CATEGORIES = ['律师', '设计师', '会计', '营销', '程序员', '学生']

// ─── 图片压缩（Canvas，最大 256×256，jpeg 0.85） ──────
async function compressImage(file, size = 256) {
  return new Promise((resolve, reject) => {
    const img = new Image()
    const objectUrl = URL.createObjectURL(file)
    img.onload = () => {
      URL.revokeObjectURL(objectUrl)
      const ratio = Math.min(size / img.width, size / img.height, 1)
      const canvas = document.createElement('canvas')
      canvas.width  = Math.round(img.width  * ratio)
      canvas.height = Math.round(img.height * ratio)
      canvas.getContext('2d').drawImage(img, 0, 0, canvas.width, canvas.height)
      canvas.toBlob(resolve, 'image/jpeg', 0.85)
    }
    img.onerror = reject
    img.src = objectUrl
  })
}

// ─── 图标上传组件 ──────────────────────────────────────
function IconUploader({ iconUrl, onChange }) {
  const [dragging, setDragging]   = useState(false)
  const [uploading, setUploading] = useState(false)
  const [preview, setPreview]     = useState(iconUrl || '')
  const inputRef = useRef(null)

  // 外部 iconUrl 变化时同步预览（编辑模式回填）
  useEffect(() => { setPreview(iconUrl || '') }, [iconUrl])

  async function handleFile(file) {
    if (!file?.type.startsWith('image/')) {
      alert('请上传图片文件（jpg/png/gif/webp）')
      return
    }
    setUploading(true)
    try {
      const compressed = await compressImage(file)
      const url = await uploadToolIconToStorage(compressed)
      setPreview(url)
      onChange(url)
    } catch (e) {
      // 上传失败时使用 base64 本地预览
      const reader = new FileReader()
      reader.onload = (ev) => {
        setPreview(ev.target.result)
        onChange(ev.target.result)
      }
      reader.readAsDataURL(file)
    } finally {
      setUploading(false)
    }
  }

  return (
    <div className="flex items-start gap-4">
      {/* 预览框 */}
      {preview ? (
        <div className="relative flex-shrink-0">
          <img
            src={preview}
            alt="工具图标"
            className="w-20 h-20 rounded-2xl object-cover border border-gray-200"
          />
          <button
            type="button"
            onClick={() => { setPreview(''); onChange('') }}
            className="absolute -top-1.5 -right-1.5 w-5 h-5 bg-red-500 text-white rounded-full flex items-center justify-center text-xs font-bold hover:bg-red-600"
            title="移除图标"
          >
            ×
          </button>
        </div>
      ) : null}

      {/* 上传区域 */}
      <div
        onClick={() => inputRef.current?.click()}
        onDragOver={(e) => { e.preventDefault(); setDragging(true) }}
        onDragLeave={() => setDragging(false)}
        onDrop={(e) => {
          e.preventDefault()
          setDragging(false)
          handleFile(e.dataTransfer.files[0])
        }}
        className={`flex-1 flex flex-col items-center justify-center gap-2 p-5 border-2 border-dashed rounded-xl cursor-pointer transition-colors text-sm ${
          dragging
            ? 'border-emerald-400 bg-emerald-50'
            : 'border-gray-200 hover:border-emerald-400 hover:bg-gray-50'
        }`}
      >
        {uploading ? (
          <>
            <div className="w-6 h-6 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin" />
            <span className="text-gray-400">上传中…</span>
          </>
        ) : (
          <>
            <svg className="w-8 h-8 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
                    d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
            <span className="text-gray-500 font-medium">
              {preview ? '点击更换图标' : '点击或拖拽上传图标'}
            </span>
            <span className="text-gray-400 text-xs">支持 jpg/png/gif/webp，自动压缩至 256×256</span>
          </>
        )}
      </div>

      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={(e) => handleFile(e.target.files?.[0])}
      />
    </div>
  )
}

// slug 自动生成（简单拼音化：去除非ASCII，空格转横杠，转小写）
function toSlug(name) {
  return name.trim().toLowerCase().replace(/\s+/g, '-').replace(/[^\w-]/g, '')
}

// ─── 空表单 ────────────────────────────────────────────
const emptyForm = {
  name: '', name_en: '',
  category: '',
  description: '', description_en: '',
  highlights_en: '',
  keywords: '',
  rating: '5.0',
  price: '免费',
  official_url: '',
  features: '',
  icon_url: '',
  is_recommended: false,
  is_hot: false,
  is_new: false,
  sort_order: '0',
  status: 'active',
  // 新字段
  slug: '',
  short_tag: '',
  full_desc: '',
  new_highlights: '',
  drawbacks: '',
  tg_advice: '',
  tags: [],
}

// ─── 表单验证 ──────────────────────────────────────────
function validate(form) {
  const errs = {}
  if (!form.name.trim())     errs.name     = '请输入工具名称'
  if (!form.category)        errs.category = '请选择职业分类'
  const r = parseFloat(form.rating)
  if (isNaN(r) || r < 1 || r > 5) errs.rating = '评分范围 1.0 ~ 5.0'
  if (form.official_url && form.official_url.trim()) {
    try { new URL(form.official_url) } catch {
      errs.official_url = '请输入合法的 URL（如 https://example.com）'
    }
  }
  return errs
}

// ─── 主组件 ────────────────────────────────────────────
export default function AdminToolEditor({ mode }) {
  const { id } = useParams()
  const navigate = useNavigate()

  const [form, setForm]     = useState(emptyForm)
  const [loading, setLoading] = useState(mode === 'edit')
  const [saving, setSaving]   = useState(false)
  const [errors, setErrors]   = useState({})
  const [importing, setImporting] = useState(false)
  const wordInputRef = useRef(null)
  const pageTitle = mode === 'new' ? '新建AI工具' : '编辑AI工具'

  useEffect(() => {
    document.title = `${pageTitle} - TG AI工具库`
  }, [pageTitle])

  // 编辑模式：回填数据
  useEffect(() => {
    if (mode === 'edit' && id) {
      adminFetchToolById(id)
        .then((data) => {
          setForm({
            name:           data.name           || '',
            name_en:        data.name_en        || '',
            category:       data.category       || '',
            description:    data.description    || '',
            description_en: data.description_en || '',
            highlights_en:  data.highlights_en  || '',
            keywords:       data.keywords       || '',
            rating:         String(data.rating  ?? '5.0'),
            price:          data.price          || '免费',
            official_url:   data.official_url   || '',
            features:       Array.isArray(data.features) ? data.features.join('\n') : (data.features || ''),
            icon_url:       data.icon_url       || '',
            is_recommended: data.is_recommended ?? false,
            is_hot:         data.is_hot         ?? false,
            is_new:         data.is_new         ?? false,
            sort_order:     String(data.sort_order ?? 0),
            status:         data.status         || 'active',
            slug:           data.slug           || '',
            short_tag:      data.short_tag      || '',
            full_desc:      data.full_desc      || '',
            new_highlights: Array.isArray(data.highlights) ? data.highlights.join('\n') : '',
            drawbacks:      Array.isArray(data.drawbacks)  ? data.drawbacks.join('\n')  : '',
            tg_advice:      data.tg_advice      || '',
            tags:           Array.isArray(data.tags) ? data.tags : [],
          })
        })
        .catch((e) => alert('加载失败：' + e.message))
        .finally(() => setLoading(false))
    }
  }, [mode, id])

  const set = (key, value) => {
    setForm((prev) => {
      const next = { ...prev, [key]: value }
      // 名称变化时自动生成 slug（仅当 slug 为空或与旧名称生成的一致时）
      if (key === 'name' && (!prev.slug || prev.slug === toSlug(prev.name))) {
        next.slug = toSlug(value)
      }
      return next
    })
    if (errors[key]) setErrors((prev) => ({ ...prev, [key]: '' }))
  }

  async function handleWordImport(e) {
    const file = e.target.files?.[0]
    if (!file) return
    setImporting(true)
    try {
      const parsed = await parseWordDoc(file)
      setForm((prev) => ({
        ...prev,
        ...(parsed.name        && { name: parsed.name }),
        ...(parsed.name_en     && { name_en: parsed.name_en }),
        ...(parsed.category    && TOOL_CATEGORIES.includes(parsed.category) && { category: parsed.category }),
        ...(parsed.description && { description: parsed.description }),
        ...(parsed.description_en && { description_en: parsed.description_en }),
        ...(parsed.highlights  && { highlights: parsed.highlights }),
        ...(parsed.keywords    && { keywords: parsed.keywords }),
        ...(parsed.price       && { price: parsed.price }),
        ...(parsed.official_url && { official_url: parsed.official_url }),
        ...(parsed.rating      && !isNaN(parseFloat(parsed.rating)) && { rating: parsed.rating }),
        ...(parsed.features    && { features: parsed.features }),
      }))
      alert('导入成功，请检查并补充未识别的字段')
    } catch (err) {
      alert('导入失败：' + err.message)
    } finally {
      setImporting(false)
      e.target.value = ''
    }
  }

  // 保存
  async function handleSave(statusOverride) {
    const errs = validate(form)
    if (Object.keys(errs).length > 0) {
      setErrors(errs)
      window.scrollTo({ top: 0, behavior: 'smooth' })
      return
    }

    setSaving(true)
    const payload = {
      name:           form.name.trim(),
      name_en:        form.name_en.trim(),
      category:       form.category,
      description:    form.description.trim(),
      description_en: form.description_en.trim(),
      highlights_en:  form.highlights_en.trim(),
      keywords:       form.keywords.trim(),
      rating:         parseFloat(form.rating),
      price:          form.price.trim(),
      official_url:   form.official_url.trim(),
      features:       form.features.split('\n').map((s) => s.trim()).filter(Boolean),
      icon_url:       form.icon_url,
      is_recommended: form.is_recommended,
      is_hot:         form.is_hot,
      is_new:         form.is_new,
      sort_order:     parseInt(form.sort_order, 10) || 0,
      status:         statusOverride || form.status,
      slug:           form.slug.trim() || toSlug(form.name),
      short_tag:      form.short_tag.trim(),
      full_desc:      form.full_desc.trim(),
      highlights:     form.new_highlights.split('\n').map(s => s.trim()).filter(Boolean).slice(0, 3),
      drawbacks:      form.drawbacks.split('\n').map(s => s.trim()).filter(Boolean).slice(0, 2),
      tg_advice:      form.tg_advice.trim(),
      tags:           form.tags,
    }

    try {
      console.log('[save] highlights:', payload.highlights, 'drawbacks:', payload.drawbacks)
      if (mode === 'new') {
        await adminCreateTool(payload)
      } else {
        await adminUpdateTool(id, payload)
      }
      navigate('/admin/tools')
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
          <Link to="/admin/tools" className="text-gray-400 hover:text-gray-600">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </Link>
          <span className="font-semibold text-gray-800">{pageTitle}</span>
        </div>
        <div className="flex items-center gap-2">
          <input ref={wordInputRef} type="file" accept=".docx" className="hidden" onChange={handleWordImport} />
          <button type="button" onClick={() => wordInputRef.current?.click()} disabled={importing}
                  className="px-3 py-2 border border-blue-200 bg-blue-50 text-blue-600 rounded-lg text-sm hover:bg-blue-100 disabled:opacity-40">
            {importing ? '导入中…' : 'Word 导入'}
          </button>
          <button type="button" onClick={() => handleSave('draft')} disabled={saving}
                  className="px-3 py-2 border border-gray-200 rounded-lg text-sm text-gray-600 hover:bg-gray-50 disabled:opacity-40">
            存草稿
          </button>
          <button type="button" onClick={() => handleSave('active')} disabled={saving}
                  className="px-4 py-2 bg-emerald-500 hover:bg-emerald-600 text-white text-sm font-medium rounded-lg transition-colors disabled:opacity-40">
            {saving ? '保存中…' : '保存并发布'}
          </button>
        </div>
      </header>

      <div className="max-w-3xl mx-auto px-4 sm:px-6 py-6 space-y-5">
        {/* 全局错误提示 */}
        {Object.keys(errors).length > 0 && (
          <div className="bg-red-50 border border-red-200 rounded-xl p-4 text-sm text-red-600">
            <strong>请完善以下必填项：</strong>
            <ul className="mt-2 list-disc list-inside">
              {Object.values(errors).filter(Boolean).map((e, i) => <li key={i}>{e}</li>)}
            </ul>
          </div>
        )}

        {/* ── 工具名称 ── */}
        <div className="bg-white border border-gray-200 rounded-xl p-5">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            工具名称 <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            value={form.name}
            onChange={(e) => set('name', e.target.value)}
            placeholder="请输入工具名称，如：法查查AI"
            className={`w-full px-4 py-2.5 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 ${
              errors.name ? 'border-red-400 bg-red-50' : 'border-gray-300'
            }`}
          />
          {errors.name && <p className="mt-1 text-xs text-red-500">{errors.name}</p>}
          <label className="block text-sm font-medium text-gray-700 mt-3 mb-1">英文名称 (EN)</label>
          <input type="text" value={form.name_en} onChange={(e) => set('name_en', e.target.value)}
            placeholder="English name (optional)"
            className="w-full px-4 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500" />
        </div>

        {/* ── 基本信息 ── */}
        <div className="bg-white border border-gray-200 rounded-xl p-5 grid grid-cols-1 sm:grid-cols-3 gap-4">
          {/* 职业分类 */}
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
              {TOOL_CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
            </select>
            {errors.category && <p className="mt-1 text-xs text-red-500">{errors.category}</p>}
          </div>

          {/* 价格 */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">价格</label>
            <input
              type="text"
              value={form.price}
              onChange={(e) => set('price', e.target.value)}
              placeholder="免费 / ¥99/月 / 价格面议"
              className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />
          </div>

          {/* 评分 */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              评分 <span className="text-xs text-gray-400">(1.0 ~ 5.0)</span>
            </label>
            <input
              type="number"
              min="1" max="5" step="0.1"
              value={form.rating}
              onChange={(e) => set('rating', e.target.value)}
              className={`w-full px-3 py-2.5 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 ${
                errors.rating ? 'border-red-400 bg-red-50' : 'border-gray-300'
              }`}
            />
            {errors.rating && <p className="mt-1 text-xs text-red-500">{errors.rating}</p>}
          </div>
        </div>

        {/* ── 官方链接 ── */}
        <div className="bg-white border border-gray-200 rounded-xl p-5">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            官方网站链接
            <span className="ml-2 text-xs text-gray-400 font-normal">（点击「前往官网」按钮时打开此地址）</span>
          </label>
          <input
            type="url"
            value={form.official_url}
            onChange={(e) => set('official_url', e.target.value)}
            placeholder="https://example.com"
            className={`w-full px-4 py-2.5 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 ${
              errors.official_url ? 'border-red-400 bg-red-50' : 'border-gray-300'
            }`}
          />
          {errors.official_url && <p className="mt-1 text-xs text-red-500">{errors.official_url}</p>}
          {form.official_url && !errors.official_url && (
            <a href={form.official_url} target="_blank" rel="noopener noreferrer"
               className="mt-1 inline-block text-xs text-emerald-600 hover:underline">
              测试链接 ↗
            </a>
          )}
        </div>

        {/* ── 工具描述 ── */}
        <div className="bg-white border border-gray-200 rounded-xl p-5">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            工具描述
            <span className="ml-2 text-xs text-gray-400 font-normal">（显示在工具卡片中，建议50字以内）</span>
          </label>
          <textarea value={form.description} onChange={(e) => set('description', e.target.value)}
            placeholder="简短描述工具的核心功能和使用场景" rows={3} maxLength={500}
            className="w-full px-4 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 resize-none" />
          <div className="text-right mt-1 text-xs text-gray-400">{form.description.length}/500</div>
          <label className="block text-sm font-medium text-gray-700 mt-3 mb-1">英文描述 (EN)</label>
          <textarea value={form.description_en} onChange={(e) => set('description_en', e.target.value)}
            placeholder="English description (optional)" rows={2} maxLength={500}
            className="w-full px-4 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 resize-none" />
        </div>

        {/* ── 搜索关键词 ── */}
        <div className="bg-white border border-gray-200 rounded-xl p-5">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            搜索关键词
            <span className="ml-2 text-xs text-gray-400 font-normal">（用逗号分隔，如：合同审查,法律检索,律师助手）</span>
          </label>
          <input type="text" value={form.keywords} onChange={(e) => set('keywords', e.target.value)}
            placeholder="关键词1,关键词2,关键词3"
            className="w-full px-4 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500" />
        </div>

        {/* ── 核心功能 ── */}
        <div className="bg-white border border-gray-200 rounded-xl p-5">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            核心功能亮点
            <span className="ml-2 text-xs text-gray-400 font-normal">（每行一条，最多填写5条）</span>
          </label>
          <textarea
            value={form.features}
            onChange={(e) => set('features', e.target.value)}
            placeholder={"智能合同审查，3分钟出意见书\n覆盖300+常见法律场景\n支持批量审查"}
            rows={5}
            className="w-full px-4 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 resize-none font-mono"
          />
        </div>

        {/* ── 悬浮窗内容 ── */}
        <div className="bg-white border border-gray-200 rounded-xl p-5 space-y-4">
          <h3 className="text-sm font-semibold text-gray-700">悬浮窗内容</h3>

          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1">
              Slug <span className="text-gray-400 font-normal">（URL标识，自动生成可修改）</span>
            </label>
            <div className="flex gap-2">
              <input type="text" value={form.slug}
                onChange={(e) => set('slug', e.target.value)}
                placeholder="tool-name"
                className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500" />
              <button type="button"
                onClick={() => set('slug', toSlug(form.name))}
                className="px-3 py-2 border border-gray-200 rounded-lg text-xs text-gray-500 hover:bg-gray-50">
                自动生成
              </button>
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1">
              超短功能标签 <span className="text-gray-400 font-normal">（≤50字）</span>
            </label>
            <input type="text" value={form.short_tag} maxLength={50}
              onChange={(e) => set('short_tag', e.target.value)}
              placeholder="如：AI合同审查"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500" />
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1">
              一句话简介 <span className="text-gray-400 font-normal">（≤50字，显示在悬浮窗顶部）</span>
            </label>
            <input type="text" value={form.full_desc} maxLength={50}
              onChange={(e) => set('full_desc', e.target.value)}
              placeholder="专为律师设计的AI合同审查工具"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500" />
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1">
              ✅ 实测亮点 <span className="text-gray-400 font-normal">（每行一条，最多3条，每条≤15字）</span>
            </label>
            <textarea
              value={form.new_highlights}
              onChange={(e) => set('new_highlights', e.target.value)}
              placeholder={"3分钟出合同意见书\n支持300+法律场景\n批量审查效率高"}
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 resize-none font-mono" />
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1">
              ❌ 实测缺点 <span className="text-gray-400 font-normal">（每行一条，最多2条，每条≤15字）</span>
            </label>
            <textarea
              value={form.drawbacks}
              onChange={(e) => set('drawbacks', e.target.value)}
              placeholder={"免费版每月限50次\n不支持英文合同"}
              rows={2}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 resize-none font-mono" />
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1">
              💡 TG建议 <span className="text-gray-400 font-normal">（≤20字）</span>
            </label>
            <input type="text" value={form.tg_advice} maxLength={30}
              onChange={(e) => set('tg_advice', e.target.value)}
              placeholder="适合中小律所日常合同审查"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500" />
          </div>
        </div>

        {/* ── 工具图标 ── */}
        <div className="bg-white border border-gray-200 rounded-xl p-5">
          <label className="block text-sm font-medium text-gray-700 mb-3">
            工具图标
            <span className="ml-2 text-xs text-gray-400 font-normal">（支持拖拽，自动压缩至 256×256；不上传则显示首字母彩色头像）</span>
          </label>
          <IconUploader
            iconUrl={form.icon_url}
            onChange={(url) => set('icon_url', url)}
          />
        </div>

        {/* ── 标签与排序 ── */}
        <div className="bg-white border border-gray-200 rounded-xl p-5">
          <label className="block text-sm font-medium text-gray-700 mb-3">标签与排序</label>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* 复选标签 */}
            <div className="space-y-2">
              {[
                { key: 'is_recommended', label: '今日推荐', desc: '显示"今日推荐"灰色标签' },
                { key: 'is_hot',         label: '热门工具', desc: '显示"热门"红色标签' },
                { key: 'is_new',         label: '新上线',   desc: '显示"新上线"蓝色标签' },
              ].map(({ key, label, desc }) => (
                <label key={key} className="flex items-center gap-3 cursor-pointer group">
                  <input
                    type="checkbox"
                    checked={form[key]}
                    onChange={(e) => set(key, e.target.checked)}
                    className="w-4 h-4 rounded border-gray-300 text-emerald-500"
                  />
                  <span className="text-sm text-gray-700 font-medium">{label}</span>
                  <span className="text-xs text-gray-400">{desc}</span>
                </label>
              ))}
              {/* tags 数组标签 */}
              {['免费', '热门', '今日推荐', 'TG精选'].map((tag) => (
                <label key={tag} className="flex items-center gap-3 cursor-pointer group">
                  <input
                    type="checkbox"
                    checked={form.tags.includes(tag)}
                    onChange={(e) => {
                      const next = e.target.checked
                        ? [...form.tags, tag]
                        : form.tags.filter((t) => t !== tag)
                      set('tags', next)
                    }}
                    className="w-4 h-4 rounded border-gray-300 text-emerald-500"
                  />
                  <span className="text-sm text-gray-700 font-medium">{tag}</span>
                  <span className="text-xs text-gray-400">tags[]标签</span>
                </label>
              ))}
            </div>

            {/* 排序权重 + 状态 */}
            <div className="space-y-3">
              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1">
                  排序权重（越大越靠前，默认 0）
                </label>
                <input
                  type="number"
                  min="0" max="9999"
                  value={form.sort_order}
                  onChange={(e) => set('sort_order', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1">发布状态</label>
                <select
                  value={form.status}
                  onChange={(e) => set('status', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                >
                  <option value="active">已发布</option>
                  <option value="draft">草稿</option>
                </select>
              </div>
            </div>
          </div>
        </div>

        {/* ── 底部操作 ── */}
        <div className="flex justify-end gap-3 pb-8">
          <Link to="/admin/tools"
                className="px-5 py-2.5 border border-gray-200 rounded-lg text-sm text-gray-600 hover:bg-gray-50">
            取消
          </Link>
          <button type="button" onClick={() => handleSave('draft')} disabled={saving}
                  className="px-5 py-2.5 border border-gray-300 rounded-lg text-sm text-gray-700 hover:bg-gray-50 disabled:opacity-40">
            保存为草稿
          </button>
          <button type="button" onClick={() => handleSave('active')} disabled={saving}
                  className="px-5 py-2.5 bg-emerald-500 hover:bg-emerald-600 text-white text-sm font-semibold rounded-lg transition-colors disabled:opacity-40">
            {saving ? '保存中…' : '保存并发布'}
          </button>
        </div>
      </div>
    </div>
  )
}
