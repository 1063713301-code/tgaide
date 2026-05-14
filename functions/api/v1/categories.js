const SUPABASE_URL = 'https://pqladcebnqmovnskcklk.supabase.co'
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBxbGFkY2VibnFtb3Zuc2tja2xrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzY2OTI3MDQsImV4cCI6MjA5MjI2ODcwNH0.Bwv9xSdAacahySQt2I4wYoiU87QkQ0GwpGhj7Lv20kA'
const HEADERS = { apikey: SUPABASE_KEY, Authorization: `Bearer ${SUPABASE_KEY}` }
const cors = { 'Access-Control-Allow-Origin': '*', 'Content-Type': 'application/json' }

async function verifyKey(key) {
  if (!key) return false
  const res = await fetch(`${SUPABASE_URL}/rest/v1/api_keys?key=eq.${encodeURIComponent(key)}&select=id&limit=1`, { headers: HEADERS })
  const data = await res.json()
  return Array.isArray(data) && data.length > 0
}

export async function onRequest({ request }) {
  if (request.method === 'OPTIONS') return new Response(null, { headers: cors })
  if (!await verifyKey(request.headers.get('x-api-key')))
    return Response.json({ error: 'Invalid API key' }, { status: 401, headers: cors })

  const res = await fetch(
    `${SUPABASE_URL}/rest/v1/tools?status=eq.active&select=category`,
    { headers: HEADERS }
  )
  const data = await res.json()
  const countMap = {}
  ;(data || []).forEach(r => { if (r.category) countMap[r.category] = (countMap[r.category] || 0) + 1 })
  const categories = Object.entries(countMap).sort((a, b) => b[1] - a[1]).map(([name, count]) => ({ name, count }))
  return Response.json({ data: categories }, { headers: cors })
}
