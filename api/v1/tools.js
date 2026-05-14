export const config = { runtime: 'edge' }

const SUPABASE_URL = 'https://pqladcebnqmovnskcklk.supabase.co'
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBxbGFkY2VibnFtb3Zuc2tja2xrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzY2OTI3MDQsImV4cCI6MjA5MjI2ODcwNH0.Bwv9xSdAacahySQt2I4wYoiU87QkQ0GwpGhj7Lv20kA'
const HEADERS = { apikey: SUPABASE_KEY, Authorization: `Bearer ${SUPABASE_KEY}` }

const cors = { 'Access-Control-Allow-Origin': '*', 'Content-Type': 'application/json' }

async function verifyKey(key) {
  if (!key) return false
  const res = await fetch(
    `${SUPABASE_URL}/rest/v1/api_keys?key=eq.${encodeURIComponent(key)}&select=id&limit=1`,
    { headers: HEADERS }
  )
  const data = await res.json()
  return Array.isArray(data) && data.length > 0
}

export default async function handler(req) {
  if (req.method === 'OPTIONS') return new Response(null, { headers: cors })

  const apiKey = req.headers.get('x-api-key')
  if (!await verifyKey(apiKey))
    return Response.json({ error: 'Invalid API key. Get yours at tgaide.com' }, { status: 401, headers: cors })

  const { searchParams } = new URL(req.url)
  const category = searchParams.get('category') || ''
  const keyword  = searchParams.get('keyword')  || ''
  const page     = Math.max(1, parseInt(searchParams.get('page') || '1'))
  const pageSize = Math.min(50, Math.max(1, parseInt(searchParams.get('page_size') || '20')))
  const slug     = searchParams.get('slug')     || ''

  // 单个工具详情
  if (slug) {
    const res = await fetch(
      `${SUPABASE_URL}/rest/v1/tools?slug=eq.${encodeURIComponent(slug)}&status=eq.active&select=name,slug,description,category,official_url,rating,price,is_hot,is_recommended,tags,highlights,drawbacks,tg_advice&limit=1`,
      { headers: HEADERS }
    )
    const data = await res.json()
    if (!data.length) return Response.json({ error: 'Tool not found' }, { status: 404, headers: cors })
    return Response.json({ data: data[0] }, { headers: cors })
  }

  // 列表查询
  let filter = 'status=eq.active'
  if (category) filter += `&category=eq.${encodeURIComponent(category)}`
  if (keyword)  filter += `&keywords=ilike.%25${encodeURIComponent(keyword)}%25`
  const from = (page - 1) * pageSize
  const to   = from + pageSize - 1

  const res = await fetch(
    `${SUPABASE_URL}/rest/v1/tools?${filter}&select=name,slug,description,category,official_url,rating,price,is_hot,is_recommended,tags&order=sort_order.desc&offset=${from}&limit=${pageSize}`,
    { headers: { ...HEADERS, Prefer: 'count=exact', Range: `${from}-${to}` } }
  )
  const data  = await res.json()
  const total = parseInt(res.headers.get('content-range')?.split('/')[1] || '0')

  return Response.json({
    data,
    pagination: { page, page_size: pageSize, total, total_pages: Math.ceil(total / pageSize) }
  }, { headers: cors })
}
