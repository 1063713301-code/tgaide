import { useEffect, useState, useRef } from 'react'
import Navbar from '../components/Navbar'
import Footer from '../components/Footer'
import RichTextEditor from '../components/RichTextEditor'
import { fetchReviews, submitReview, supabase } from '../lib/supabase'
import { useLang } from '../lib/i18n.jsx'

const OCCUPATIONS = ['律师', '设计师', '会计', '营销', '程序员', '学生', '其他']
const LS_KEY = 'review_submissions'

function getRateLimit() {
  try {
    const arr = JSON.parse(localStorage.getItem(LS_KEY) || '[]')
    const now = Date.now()
    const last24h = arr.filter((t) => now - t < 86400000)
    const lastMin = last24h.filter((t) => now - t < 60000)
    return { last24h, lastMin }
  } catch { return { last24h: [], lastMin: [] } }
}

function recordSubmission() {
  const { last24h } = getRateLimit()
  localStorage.setItem(LS_KEY, JSON.stringify([...last24h, Date.now()]))
}

async function uploadReviewImage(file) {
  const ext = file.name.split('.').pop().toLowerCase()
  const name = `reviews/${Date.now()}-${Math.random().toString(36).slice(2, 7)}.${ext}`
  const { error } = await supabase.storage.from('article-images').upload(name, file, { contentType: file.type, upsert: false })
  if (error) throw error
  const { data } = supabase.storage.from('article-images').getPublicUrl(name)
  return data.publicUrl
}

function StarPicker({ value, onChange }) {
  const [hover, setHover] = useState(0)
  return (
    <span className="flex gap-1">
      {[1,2,3,4,5].map((n) => (
        <button key={n} type="button" onMouseEnter={() => setHover(n)} onMouseLeave={() => setHover(0)} onClick={() => onChange(n)} className="focus:outline-none">
          <svg className={`w-7 h-7 transition-colors ${n <= (hover || value) ? 'text-yellow-400' : 'text-gray-200'}`} fill="currentColor" viewBox="0 0 20 20">
            <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
          </svg>
        </button>
      ))}
    </span>
  )
}

function StarDisplay({ rating }) {
  return (
    <span className="flex gap-0.5">
      {[1,2,3,4,5].map((n) => (
        <svg key={n} className={`w-4 h-4 ${n <= rating ? 'text-yellow-400' : 'text-gray-200'}`} fill="currentColor" viewBox="0 0 20 20">
          <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
        </svg>
      ))}
    </span>
  )
}

const emptyForm = {
  user_nickname: '', user_occupation: '律师', tool_name: '', rating: 5,
  content: '', email: '',
}

function ImageUploader({ images, onChange }) {
  const [uploading, setUploading] = useState(false)
  const [dragOver, setDragOver] = useState(false)
  const inputRef = useRef(null)
  const { t } = useLang()

  async function handleFiles(files) {
    const valid = Array.from(files).filter((f) => {
      if (!['image/jpeg', 'image/png'].includes(f.type)) { alert(t('reviews_upload_hint')); return false }
      if (f.size > 5 * 1024 * 1024) { alert(t('reviews_upload_hint')); return false }
      return true
    })
    if (!valid.length) return
    if (images.length + valid.length > 3) { alert(t('reviews_upload_hint')); return }
    setUploading(true)
    try {
      const urls = await Promise.all(valid.map(uploadReviewImage))
      onChange([...images, ...urls])
    } catch (e) {
      alert('上传失败：' + e.message)
    } finally {
      setUploading(false)
    }
  }

  return (
    <div>
      <div className="flex gap-2 flex-wrap mb-2">
        {images.map((url, i) => (
          <div key={i} className="relative w-20 h-20 flex-shrink-0">
            <img src={url} alt="" className="w-20 h-20 object-cover rounded-lg border border-gray-200" />
            <button type="button" onClick={() => onChange(images.filter((_, j) => j !== i))}
              className="absolute -top-1.5 -right-1.5 w-5 h-5 bg-red-500 text-white rounded-full text-xs flex items-center justify-center hover:bg-red-600">×</button>
          </div>
        ))}
        {images.length < 3 && (
          <div
            onClick={() => inputRef.current?.click()}
            onDragOver={(e) => { e.preventDefault(); setDragOver(true) }}
            onDragLeave={() => setDragOver(false)}
            onDrop={(e) => { e.preventDefault(); setDragOver(false); handleFiles(e.dataTransfer.files) }}
            className={`w-20 h-20 border-2 border-dashed rounded-lg flex flex-col items-center justify-center cursor-pointer text-xs text-gray-400 transition-colors ${dragOver ? 'border-blue-400 bg-blue-50' : 'border-gray-300 hover:border-blue-400'}`}>
            {uploading ? <div className="w-5 h-5 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" /> : <><span className="text-lg">+</span><span>{t('reviews_upload_btn')}</span></>}
          </div>
        )}
      </div>
      <p className="text-xs text-gray-400">{t('reviews_upload_hint')}</p>
      <input ref={inputRef} type="file" accept="image/jpeg,image/png" multiple className="hidden" onChange={(e) => handleFiles(e.target.files)} />
    </div>
  )
}

function SubmitModal({ onClose, onSuccess }) {
  const [form, setForm] = useState(emptyForm)
  const [images, setImages] = useState([])
  const [errors, setErrors] = useState({})
  const [submitting, setSubmitting] = useState(false)
  const [showMedia, setShowMedia] = useState(false)
  const [mediaAccounts, setMediaAccounts] = useState([{ platform: '', account: '' }])
  const { t } = useLang()

  const set = (k, v) => { setForm((p) => ({ ...p, [k]: v })); setErrors((p) => ({ ...p, [k]: '' })) }

  function validate() {
    const e = {}
    if (!form.user_nickname.trim()) e.user_nickname = t('reviews_err_nickname')
    else if (form.user_nickname.length > 20) e.user_nickname = t('reviews_err_nickname_len')
    if (!form.tool_name.trim()) e.tool_name = t('reviews_err_tool')
    else if (form.tool_name.length > 50) e.tool_name = t('reviews_err_tool_len')
    const plainText = form.content.replace(/<[^>]*>/g, '').trim()
    if (!plainText) e.content = t('reviews_err_content')
    else if (plainText.length < 10) e.content = `${t('reviews_err_content_min')}（当前${plainText.length}字）`
    else if (plainText.length > 500) e.content = `${t('reviews_err_content_max')}（当前${plainText.length}字）`
    return e
  }

  async function handleSubmit() {
    const { lastMin, last24h } = getRateLimit()
    if (lastMin.length > 0) return setErrors({ _global: t('reviews_err_rate_min') })
    if (last24h.length >= 3) return setErrors({ _global: t('reviews_err_rate_day') })
    const e = validate()
    if (Object.keys(e).length > 0) return setErrors(e)
    setSubmitting(true)
    try {
      await submitReview({
        user_nickname: form.user_nickname.trim(),
        user_occupation: form.user_occupation,
        tool_name: form.tool_name.trim(),
        rating: form.rating,
        content: form.content.trim(),
        email: form.email.trim(),
        submit_ip: '',
        images,
        weibo: '',
        xiaohongshu: '',
        bilibili: '',
        douyin: '',
        media_accounts: mediaAccounts.filter(m => m.platform.trim() && m.account.trim()),
      })
      recordSubmission()
      onSuccess()
    } catch (err) {
      setErrors({ _global: '提交失败：' + err.message })
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <h2 className="font-bold text-gray-900 text-lg">{t('reviews_modal_title')}</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 text-xl leading-none">×</button>
        </div>
        <div className="mx-6 mt-4 bg-gray-50 border border-gray-200 rounded-lg px-4 py-3 text-xs text-gray-500 space-y-1">
          <p className="font-medium text-gray-600">{t('reviews_notice_title')}</p>
          <p>{t('reviews_notice1')}</p>
          <p>{t('reviews_notice2')}</p>
          <p>{t('reviews_notice3')}</p>
          <p>{t('reviews_notice4')}</p>
        </div>
        <div className="px-6 py-4 space-y-4">
          {errors._global && <div className="bg-red-50 border border-red-200 rounded-lg px-4 py-2 text-sm text-red-600">{errors._global}</div>}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">{t('reviews_nickname')} <span className="text-red-500">*</span></label>
              <input value={form.user_nickname} onChange={(e) => set('user_nickname', e.target.value)} maxLength={20} placeholder="最多20字" className={`w-full px-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 ${errors.user_nickname ? 'border-red-400' : 'border-gray-300'}`} />
              {errors.user_nickname && <p className="text-xs text-red-500 mt-1">{errors.user_nickname}</p>}
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">{t('reviews_occupation')} <span className="text-red-500">*</span></label>
              <select value={form.user_occupation} onChange={(e) => set('user_occupation', e.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
                {OCCUPATIONS.map((o) => <option key={o} value={o}>{o}</option>)}
              </select>
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">{t('reviews_tool')} <span className="text-red-500">*</span></label>
            <input value={form.tool_name} onChange={(e) => set('tool_name', e.target.value)} maxLength={50} placeholder={t('reviews_tool_placeholder')} className={`w-full px-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 ${errors.tool_name ? 'border-red-400' : 'border-gray-300'}`} />
            {errors.tool_name && <p className="text-xs text-red-500 mt-1">{errors.tool_name}</p>}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">{t('reviews_rating')}</label>
            <StarPicker value={form.rating} onChange={(v) => set('rating', v)} />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">{t('reviews_content')} <span className="text-red-500">*</span> <span className="text-xs text-gray-400 font-normal">{t('reviews_content_hint')}</span></label>
            <div className={`border rounded-lg overflow-hidden ${errors.content ? 'border-red-400' : 'border-gray-300'}`}>
              <RichTextEditor value={form.content} onChange={(v) => set('content', v)} placeholder={t('reviews_content_placeholder')} />
            </div>
            <div className="flex justify-between mt-1">
              {errors.content ? <p className="text-xs text-red-500">{errors.content}</p> : <span />}
              <span className="text-xs text-gray-400">{form.content.replace(/<[^>]*>/g, '').length}/500</span>
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">{t('reviews_images')} <span className="text-xs text-gray-400 font-normal">{t('reviews_images_hint')}</span></label>
            <ImageUploader images={images} onChange={setImages} />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">{t('reviews_email')} <span className="text-xs text-gray-400 font-normal">{t('reviews_email_hint')}</span></label>
            <input type="email" value={form.email} onChange={(e) => set('email', e.target.value)} placeholder={t('reviews_email_placeholder')} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
          </div>
          <div>
            <button type="button" onClick={() => setShowMedia(!showMedia)} className="flex items-center gap-1 text-sm text-blue-600 hover:text-blue-700 font-medium">
              <svg className={`w-4 h-4 transition-transform ${showMedia ? 'rotate-90' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>
              {t('reviews_media')}
            </button>
            <p className="text-xs text-gray-400 mt-0.5">{t('reviews_media_hint')}</p>
            {showMedia && (
              <div className="mt-3 space-y-2">
                {mediaAccounts.map((m, i) => (
                  <div key={i} className="flex gap-2 items-center">
                    <input value={m.platform} onChange={e => setMediaAccounts(prev => prev.map((x,j) => j===i ? {...x, platform: e.target.value} : x))}
                      placeholder={t('reviews_media_platform')} className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
                    <input value={m.account} onChange={e => setMediaAccounts(prev => prev.map((x,j) => j===i ? {...x, account: e.target.value} : x))}
                      placeholder={t('reviews_media_account')} className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
                    {mediaAccounts.length > 1 && (
                      <button type="button" onClick={() => setMediaAccounts(prev => prev.filter((_,j) => j!==i))} className="text-gray-400 hover:text-red-500 text-lg leading-none">×</button>
                    )}
                  </div>
                ))}
                {mediaAccounts.length < 5 && (
                  <button type="button" onClick={() => setMediaAccounts(prev => [...prev, { platform: '', account: '' }])}
                    className="text-xs text-blue-600 hover:text-blue-700">{t('reviews_media_add')}</button>
                )}
              </div>
            )}
          </div>
        </div>

        <div className="flex gap-3 px-6 py-4 border-t border-gray-100">
          <button onClick={onClose} className="flex-1 px-4 py-2.5 border border-gray-200 rounded-lg text-sm text-gray-600 hover:bg-gray-50">{t('reviews_cancel')}</button>
          <button onClick={handleSubmit} disabled={submitting} className="flex-1 px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold rounded-lg disabled:opacity-50 transition-colors">
            {submitting ? t('reviews_submitting') : t('reviews_submit')}
          </button>
        </div>
      </div>
    </div>
  )
}

function LightboxModal({ src, onClose }) {
  return (
    <div className="fixed inset-0 z-[60] bg-black/80 flex items-center justify-center p-4" onClick={onClose}>
      <img src={src} alt="" className="max-w-full max-h-full rounded-lg object-contain" />
    </div>
  )
}

export default function Reviews() {
  const [reviews, setReviews] = useState([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [showSuccess, setShowSuccess] = useState(false)
  const [lightbox, setLightbox] = useState(null)
  const { t } = useLang()

  useEffect(() => {
    document.title = '用户评测 - TG AI工具库'
    fetchReviews().then(setReviews).catch(console.error).finally(() => setLoading(false))
  }, [])

  function handleSuccess() {
    setShowModal(false)
    setShowSuccess(true)
    setTimeout(() => setShowSuccess(false), 6000)
  }

  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      <Navbar />
      <main className="flex-1 max-w-4xl mx-auto w-full px-4 sm:px-6 py-10">
        <div className="flex items-start justify-between mb-6 flex-wrap gap-3">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 mb-1">{t('reviews_title')}</h1>
            <p className="text-gray-500 text-sm">{t('reviews_sub')}</p>
          </div>
          <button onClick={() => setShowModal(true)} className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold rounded-lg transition-colors">
            {t('reviews_submit_btn')}
          </button>
        </div>

        {showSuccess && (
          <div className="mb-6 bg-blue-50 border border-blue-200 rounded-xl px-5 py-4 text-sm text-blue-800 flex items-start gap-3">
            <svg className="w-5 h-5 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" /></svg>
            {t('reviews_success')}
          </div>
        )}

        {loading ? (
          <div className="space-y-4">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="bg-white border border-gray-200 rounded-xl p-6">
                <div className="flex gap-3 mb-4">
                  <div className="skeleton w-10 h-10 rounded-full flex-shrink-0" />
                  <div className="flex-1"><div className="skeleton h-4 w-24 rounded mb-2" /><div className="skeleton h-3 w-16 rounded" /></div>
                </div>
                <div className="skeleton h-4 w-full rounded mb-2" /><div className="skeleton h-4 w-4/5 rounded" />
              </div>
            ))}
          </div>
        ) : reviews.length === 0 ? (
          <div className="text-center py-20 text-gray-400">{t('reviews_empty')}</div>
        ) : (
          <div className="space-y-4">
            {reviews.map((r) => (
              <div key={r.id} className="bg-white border border-gray-200 rounded-xl p-6">
                <div className="flex items-start gap-4 mb-3">
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-400 to-blue-600 flex items-center justify-center text-white font-bold text-sm flex-shrink-0">
                    {(r.user_nickname || r.nickname)?.charAt(0) || '匿'}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-semibold text-gray-800 text-sm">{r.user_nickname || r.nickname}</span>
                      {(r.user_occupation || r.occupation) && (
                        <span className="text-xs bg-blue-50 text-blue-600 px-2 py-0.5 rounded-full">{r.user_occupation || r.occupation}</span>
                      )}
                    </div>
                    <div className="flex items-center gap-2 mt-1">
                      <StarDisplay rating={r.rating || 5} />
                      <span className="text-xs text-gray-400">{new Date(r.created_at).toLocaleDateString('zh-CN')}</span>
                    </div>
                  </div>
                </div>
                <p className="text-gray-700 text-sm leading-relaxed mb-3">{r.content}</p>
                {/* 图片 */}
                {Array.isArray(r.images) && r.images.length > 0 && (
                  <div className="flex gap-2 mb-3 flex-wrap">
                    {r.images.slice(0, 3).map((url, i) => (
                      <img key={i} src={url} alt="" onClick={() => setLightbox(url)}
                        className="w-20 h-20 object-cover rounded-lg border border-gray-200 cursor-pointer hover:opacity-90 transition-opacity" />
                    ))}
                  </div>
                )}
                {r.tool_name && (
                  <div className="flex items-center gap-1.5 text-xs text-gray-500 mb-2">
                    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                    推荐工具：<span className="text-blue-600 font-medium">{r.tool_name}</span>
                  </div>
                )}
                {/* 媒体账号 */}
                {Array.isArray(r.media_accounts) && r.media_accounts.length > 0 && (
                  <div className="flex flex-wrap gap-2 mt-2">
                    {r.media_accounts.map((m, i) => (
                      <span key={i} className="text-xs bg-blue-50 text-blue-600 px-2 py-0.5 rounded-full">{m.platform}：{m.account}</span>
                    ))}
                  </div>
                )}
                {/* 兼容旧字段 */}
                {(!r.media_accounts || r.media_accounts.length === 0) && (r.weibo || r.xiaohongshu || r.bilibili || r.douyin) && (
                  <div className="flex flex-wrap gap-2 mt-2">
                    {r.weibo && <span className="text-xs bg-red-50 text-red-500 px-2 py-0.5 rounded-full">微博：{r.weibo}</span>}
                    {r.xiaohongshu && <span className="text-xs bg-pink-50 text-pink-500 px-2 py-0.5 rounded-full">小红书：{r.xiaohongshu}</span>}
                    {r.bilibili && <span className="text-xs bg-blue-50 text-blue-500 px-2 py-0.5 rounded-full">B站：{r.bilibili}</span>}
                    {r.douyin && <span className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full">抖音：{r.douyin}</span>}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </main>
      <Footer />
      {showModal && <SubmitModal onClose={() => setShowModal(false)} onSuccess={handleSuccess} />}
      {lightbox && <LightboxModal src={lightbox} onClose={() => setLightbox(null)} />}
    </div>
  )
}
