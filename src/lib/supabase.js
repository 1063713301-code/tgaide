import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('[Supabase] 缺少环境变量 VITE_SUPABASE_URL 或 VITE_SUPABASE_ANON_KEY，请检查 .env 文件')
}

export const supabase = createClient(
  supabaseUrl || 'https://placeholder.supabase.co',
  supabaseAnonKey || 'placeholder',
)

// ─── 表名映射 ────────────────────────────────────
export const TABLE = {
  report: 'industry_reports',
  brief: 'daily_briefs',
  selection: 'selection_guides',
}

// ─── 行业报告 & 每日简报 公共 CRUD ───────────────

/** 获取列表（仅已发布，按日期降序） */
export async function fetchArticles(type, { category = null, limit = 20, offset = 0 } = {}) {
  let query = supabase
    .from(TABLE[type])
    .select('id, title, publish_date, category, summary, pdf_url, status, created_at')
    .eq('status', 'published')
    .order('publish_date', { ascending: false })
    .order('created_at', { ascending: false })
    .range(offset, offset + limit - 1)

  if (category) {
    query = query.eq('category', category)
  }

  const { data, error } = await query
  if (error) throw error
  return data || []
}

/** 获取首页最新 N 篇（同时读两张表） */
export async function fetchLatestArticles(type, limit = 6) {
  return fetchArticles(type, { limit })
}

/** 获取详情（含完整 content） */
export async function fetchArticleById(type, id) {
  const { data, error } = await supabase
    .from(TABLE[type])
    .select('*')
    .eq('id', id)
    .eq('status', 'published')
    .single()
  if (error) throw error
  return data
}

/** 获取文章总数 */
export async function fetchArticleCount(type, category = null) {
  let query = supabase
    .from(TABLE[type])
    .select('id', { count: 'exact', head: true })
    .eq('status', 'published')

  if (category) query = query.eq('category', category)

  const { count, error } = await query
  if (error) throw error
  return count || 0
}

// ─── 后台 CRUD（使用 anon key，需禁用或宽松配置 RLS） ─

export async function adminFetchAll(type) {
  const { data, error } = await supabase
    .from(TABLE[type])
    .select('id, title, publish_date, category, status, created_at')
    .order('created_at', { ascending: false })
  if (error) throw error
  return data || []
}

export async function adminFetchById(type, id) {
  const { data, error } = await supabase
    .from(TABLE[type])
    .select('*')
    .eq('id', id)
    .single()
  if (error) throw error
  return data
}

export async function adminCreate(type, payload) {
  const { data, error } = await supabase
    .from(TABLE[type])
    .insert([{ ...payload, updated_at: new Date().toISOString() }])
    .select()
    .single()
  if (error) throw error
  return data
}

export async function adminUpdate(type, id, payload) {
  const { data, error } = await supabase
    .from(TABLE[type])
    .update({ ...payload, updated_at: new Date().toISOString() })
    .eq('id', id)
    .select()
    .single()
  if (error) throw error
  return data
}

export async function adminDelete(type, id) {
  const { error } = await supabase
    .from(TABLE[type])
    .delete()
    .eq('id', id)
  if (error) throw error
}

// ─── 图片上传到 Supabase Storage ─────────────────
export async function uploadImageToStorage(file) {
  const ext = file.type.split('/')[1] || 'png'
  const fileName = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`

  const { error: uploadError } = await supabase.storage
    .from('article-images')
    .upload(fileName, file, { contentType: file.type, upsert: false })

  if (uploadError) throw uploadError

  const { data } = supabase.storage
    .from('article-images')
    .getPublicUrl(fileName)

  return data.publicUrl
}

// ─── 工具表 CRUD ─────────────────────────────────

/** 获取工具列表（支持分类筛选、搜索、排序） */
export async function fetchTools({ category = null, search = null, sort = 'hot', limit = null, page = 1, pageSize = 48 } = {}) {
  let query = supabase
    .from('tools')
    .select('*', { count: 'exact' })
    .eq('status', 'active')

  if (category) {
    query = query.eq('category', category)
  }

  // 排序
  if (sort === 'rating') {
    query = query.order('rating', { ascending: false })
  } else if (sort === 'newest') {
    query = query.eq('is_new', true).order('created_at', { ascending: false })
  } else if (sort === 'free') {
    query = query.eq('price', '免费').order('sort_order', { ascending: false })
  } else if (sort === 'recommended') {
    query = query.eq('is_recommended', true).order('sort_order', { ascending: false })
  } else if (sort === 'tg_selected') {
    query = query.contains('tags', ['TG精选']).order('sort_order', { ascending: false })
  } else if (sort === 'hot') {
    query = query.order('sort_order', { ascending: false }).order('created_at', { ascending: false })
  } else if (sort === 'is_hot') {
    query = query.eq('is_hot', true).order('sort_order', { ascending: false })
  } else {
    // 默认按热度 = sort_order 降序
    query = query.order('sort_order', { ascending: false }).order('created_at', { ascending: false })
  }

  if (limit) query = query.limit(limit)
  else {
    const from = (page - 1) * pageSize
    query = query.range(from, from + pageSize - 1)
  }

  // 服务端搜索
  if (search && search.trim()) {
    query = query.ilike('keywords', `%${search.trim()}%`)
  }

  const { data, count, error } = await query
  if (error) throw error
  return { data: data || [], count: count || 0 }
}

/** 获取工具总数 */
export async function fetchToolCount() {
  const { count, error } = await supabase
    .from('tools')
    .select('*', { count: 'exact', head: true })
    .eq('status', 'active')
  if (error) throw error
  return count || 0
}

/** 获取各分类工具数量 */
export async function fetchCategoryCount() {
  const categories = ['律师', '设计师', '会计', '营销', '程序员', '学生']

  // 一次查询获取所有活跃工具的分类
  const { data, error } = await supabase
    .from('tools')
    .select('category')
    .eq('status', 'active')

  if (error) throw error

  // 在客户端统计各分类数量
  const counts = {}
  categories.forEach(cat => counts[cat] = 0)

  data.forEach(tool => {
    if (categories.includes(tool.category)) {
      counts[tool.category]++
    }
  })

  return counts
}

/** 后台：获取所有工具（包含草稿） */
export async function adminFetchTools() {
  const { data, error } = await supabase
    .from('tools')
    .select('id, name, category, rating, price, is_recommended, is_hot, status, created_at')
    .order('sort_order', { ascending: false })
  if (error) throw error
  return data || []
}

/** 后台：创建工具 */
export async function adminCreateTool(payload) {
  const { data, error } = await supabase
    .from('tools')
    .insert([{ ...payload, updated_at: new Date().toISOString() }])
    .select()
    .single()
  if (error) throw error
  return data
}

/** 后台：更新工具 */
export async function adminUpdateTool(id, payload) {
  const { data, error } = await supabase
    .from('tools')
    .update({ ...payload, updated_at: new Date().toISOString() })
    .eq('id', id)
    .select()
    .single()
  if (error) throw error
  return data
}

/** 后台：删除工具 */
export async function adminDeleteTool(id) {
  const { error } = await supabase.from('tools').delete().eq('id', id)
  if (error) throw error
}

/** 后台：按 ID 获取工具详情 */
export async function adminFetchToolById(id) {
  const { data, error } = await supabase
    .from('tools')
    .select('*')
    .eq('id', id)
    .single()
  if (error) throw error
  return data
}

/** 后台：批量更新工具字段（如批量设置标签、上下线） */
export async function adminBatchUpdateTools(ids, payload) {
  const { error } = await supabase
    .from('tools')
    .update({ ...payload, updated_at: new Date().toISOString() })
    .in('id', ids)
  if (error) throw error
}

/** 后台：批量删除工具 */
export async function adminBatchDeleteTools(ids) {
  const { error } = await supabase.from('tools').delete().in('id', ids)
  if (error) throw error
}

/** 工具图标上传到 Supabase Storage（tool-icons 桶） */
export async function uploadToolIconToStorage(blob) {
  const fileName = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}.jpg`
  const { error: uploadError } = await supabase.storage
    .from('tool-icons')
    .upload(fileName, blob, { contentType: 'image/jpeg', upsert: false })
  if (uploadError) throw uploadError
  const { data } = supabase.storage.from('tool-icons').getPublicUrl(fileName)
  return data.publicUrl
}

// ─── 评测 CRUD ───────────────────────────────────

export async function fetchReviews({ limit = 20, offset = 0 } = {}) {
  const { data, error } = await supabase
    .from('reviews')
    .select('*')
    .eq('status', 'approved')
    .order('created_at', { ascending: false })
    .range(offset, offset + limit - 1)
  if (error) throw error
  return data || []
}

export async function submitReview(payload) {
  const { data, error } = await supabase
    .from('reviews')
    .insert([{ ...payload, status: 'pending' }])
    .select()
    .single()
  if (error) throw error
  return data
}

export async function adminApproveReview(id) {
  const { error } = await supabase
    .from('reviews')
    .update({ status: 'approved', updated_at: new Date().toISOString() })
    .eq('id', id)
  if (error) throw error
}

export async function adminRejectReview(id, reason) {
  const { error } = await supabase
    .from('reviews')
    .update({ status: 'rejected', reject_reason: reason, updated_at: new Date().toISOString() })
    .eq('id', id)
  if (error) throw error
}

export async function adminFetchReviews() {
  const { data, error } = await supabase
    .from('reviews')
    .select('*')
    .order('created_at', { ascending: false })
  if (error) throw error
  return data || []
}

export async function adminCreateReview(payload) {
  const { data, error } = await supabase
    .from('reviews')
    .insert([payload])
    .select()
    .single()
  if (error) throw error
  return data
}

export async function adminUpdateReview(id, payload) {
  const { data, error } = await supabase
    .from('reviews')
    .update(payload)
    .eq('id', id)
    .select()
    .single()
  if (error) throw error
  return data
}

export async function adminDeleteReview(id) {
  const { error } = await supabase.from('reviews').delete().eq('id', id)
  if (error) throw error
}

/** 按工具名批量获取官网地址（选型详情页工具链接用） */
export async function fetchToolOfficialUrls(names) {
  const { data, error } = await supabase
    .from('tools')
    .select('name, official_url')
    .in('name', names)
    .eq('status', 'active')
  if (error) throw error
  const map = {}
  ;(data || []).forEach(t => { if (t.official_url && !map[t.name]) map[t.name] = t.official_url })
  return map
}

// ─── 选型速查 ────────────────────────────────────

const SELECTION_SCENES = ['design', 'video', 'marketing', 'legal', 'content', 'finance']

/** 首页用：每个场景各取最新1条 */
export async function fetchLatestSelections() {
  const results = await Promise.all(
    SELECTION_SCENES.map(scene =>
      supabase
        .from('selection_guides')
        .select('id, title, scene, period, publish_date, summary')
        .eq('scene', scene)
        .eq('status', 'published')
        .eq('is_hidden', false)
        .order('publish_date', { ascending: false })
        .limit(1)
        .single()
        .then(({ data }) => data)
        .catch(() => null)
    )
  )
  const map = {}
  results.forEach(item => { if (item) map[item.scene] = item })
  return map
}

/** 场景归档页：获取某场景全部历史 */
export async function fetchSelectionsByScene(scene, { limit = 20, offset = 0 } = {}) {
  const { data, error } = await supabase
    .from('selection_guides')
    .select('id, title, scene, period, publish_date, summary, source_report_id')
    .eq('scene', scene)
    .eq('status', 'published')
    .eq('is_hidden', false)
    .order('publish_date', { ascending: false })
    .range(offset, offset + limit - 1)
  if (error) throw error
  return data || []
}

/** 后台：获取选型速查总数 */
export async function adminFetchSelectionCount() {
  const { count, error } = await supabase
    .from('selection_guides')
    .select('id', { count: 'exact', head: true })
  if (error) throw error
  return count || 0
}

/** 后台：批量写入AI提取的选型方案（每次发布报告后调用） */
export async function adminBatchCreateSelections(records) {
  const { error } = await supabase
    .from('selection_guides')
    .insert(records.map(r => ({ ...r, updated_at: new Date().toISOString() })))
  if (error) throw error
}

// ─── 生成 Sitemap 数据 ───────────────────────────
export async function fetchSitemapUrls() {
  const [reports, briefs] = await Promise.all([
    supabase.from('industry_reports').select('id, updated_at').eq('status', 'published'),
    supabase.from('daily_briefs').select('id, updated_at').eq('status', 'published'),
  ])

  return {
    reports: reports.data || [],
    briefs: briefs.data || [],
  }
}
