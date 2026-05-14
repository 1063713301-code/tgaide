const SUPABASE_URL = 'https://pqladcebnqmovnskcklk.supabase.co'
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBxbGFkY2VibnFtb3Zuc2tja2xrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzY2OTI3MDQsImV4cCI6MjA5MjI2ODcwNH0.Bwv9xSdAacahySQt2I4wYoiU87QkQ0GwpGhj7Lv20kA'
const HEADERS = { apikey: SUPABASE_KEY, Authorization: `Bearer ${SUPABASE_KEY}`, 'Content-Type': 'application/json' }
const cors = { 'Access-Control-Allow-Origin': '*', 'Content-Type': 'application/json' }

function randomKey() {
  const chars = 'ABCDEFGHJKMNPQRSTWXYZabcdefhjkmnpqrstwxyz2345678'
  return 'tgaide-' + Array.from({ length: 32 }, () => chars[Math.floor(Math.random() * chars.length)]).join('')
}

export async function onRequest({ request }) {
  if (request.method === 'OPTIONS') return new Response(null, { headers: cors })
  if (request.method !== 'POST') return Response.json({ error: 'Method not allowed' }, { status: 405, headers: cors })

  let body
  try { body = await request.json() } catch { return Response.json({ error: 'Invalid JSON' }, { status: 400, headers: cors }) }

  const name  = (body.name  || '').trim()
  const email = (body.email || '').trim()
  if (!name || !email || !email.includes('@'))
    return Response.json({ error: '请填写姓名和有效邮箱' }, { status: 400, headers: cors })

  // 检查该邮箱是否已有 Key
  const check = await fetch(`${SUPABASE_URL}/rest/v1/api_keys?email=eq.${encodeURIComponent(email)}&select=key&limit=1`, { headers: HEADERS })
  const existing = await check.json()
  if (existing.length > 0) return Response.json({ key: existing[0].key, existed: true }, { headers: cors })

  const key = randomKey()
  const res = await fetch(`${SUPABASE_URL}/rest/v1/api_keys`, {
    method: 'POST',
    headers: { ...HEADERS, Prefer: 'return=minimal' },
    body: JSON.stringify({ key, name, email })
  })
  if (!res.ok) return Response.json({ error: '生成失败，请稍后重试' }, { status: 500, headers: cors })

  return Response.json({ key, existed: false }, { headers: cors })
}
