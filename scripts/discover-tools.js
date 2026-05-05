#!/usr/bin/env node
/**
 * 每日发现新工具：聚合多源候选 → 去重 → DeepSeek 分类 → 每职业1个 → 入库 status=pending
 */
import { readFileSync } from 'fs'
import { fileURLToPath } from 'url'
import { dirname, join } from 'path'
import { createClient } from '@supabase/supabase-js'

const __dir = dirname(fileURLToPath(import.meta.url))
const ROLES = ['律师', '设计师', '会计', '营销', '程序员', '学生']

const API_KEY = process.env.DEEPSEEK_API_KEY
let SUPA_URL = process.env.VITE_SUPABASE_URL
let SUPA_KEY = process.env.VITE_SUPABASE_ANON_KEY
try {
  const env = readFileSync(join(__dir, '../.env'), 'utf-8')
  SUPA_URL = SUPA_URL || env.match(/VITE_SUPABASE_URL=(\S+)/)?.[1]
  SUPA_KEY = SUPA_KEY || env.match(/VITE_SUPABASE_ANON_KEY=(\S+)/)?.[1]
} catch {}
if (!API_KEY) { console.error('❌ 缺 DEEPSEEK_API_KEY'); process.exit(1) }
if (!SUPA_URL) { console.error('❌ 缺 SUPABASE'); process.exit(1) }

const sb = createClient(SUPA_URL, SUPA_KEY)

async function ds(prompt, json = true) {
  const res = await fetch('https://api.deepseek.com/chat/completions', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${API_KEY}` },
    body: JSON.stringify({
      model: 'deepseek-chat',
      messages: [{ role: 'user', content: prompt }],
      ...(json ? { response_format: { type: 'json_object' } } : {}),
      temperature: 0.4,
    }),
  })
  if (!res.ok) throw new Error(`DeepSeek ${res.status}: ${await res.text()}`)
  const data = await res.json()
  const text = data.choices[0].message.content
  return json ? JSON.parse(text) : text
}

// ─── 数据源 ────────────────────────────────────

async function fetchGithubTrending() {
  // GitHub trending 没有官方 API，用 ossinsight 镜像 API（公开免费）
  try {
    const res = await fetch('https://api.ossinsight.io/v1/trends/repos/?period=past_24_hours&language=Python&limit=30')
    if (!res.ok) return []
    const data = await res.json()
    return (data.data?.rows || [])
      .filter(r => /ai|gpt|llm|agent|chat|ml/i.test((r.repo_name || '') + ' ' + (r.description || '')))
      .map(r => ({
        name: r.repo_name.split('/').pop(),
        url: `https://github.com/${r.repo_name}`,
        hint: r.description || '',
        source: 'github',
      }))
  } catch (e) { console.warn('GitHub trending 抓取失败:', e.message); return [] }
}

async function fetchAibase() {
  try {
    const res = await fetch('https://top.aibase.com/?type=newest', {
      headers: { 'User-Agent': 'Mozilla/5.0' },
    })
    if (!res.ok) return []
    const html = await res.text()
    const items = []
    const re = /<a[^>]+href="(\/tool\/[^"]+)"[^>]*>[^<]*<[^>]*>([^<]+)</g
    let m
    while ((m = re.exec(html)) && items.length < 30) {
      const name = m[2].trim()
      if (name && name.length < 50) {
        items.push({ name, url: 'https://top.aibase.com' + m[1], hint: '', source: 'aibase' })
      }
    }
    return items
  } catch (e) { console.warn('aibase 抓取失败:', e.message); return [] }
}

async function fetchTAAFT() {
  try {
    const res = await fetch('https://theresanaiforthat.com/just-launched/', {
      headers: { 'User-Agent': 'Mozilla/5.0' },
    })
    if (!res.ok) return []
    const html = await res.text()
    const items = []
    const re = /<a[^>]+class="[^"]*ai_link[^"]*"[^>]+href="([^"]+)"[^>]*>([^<]+)</g
    let m
    while ((m = re.exec(html)) && items.length < 30) {
      items.push({ name: m[2].trim(), url: m[1], hint: '', source: 'taaft' })
    }
    return items
  } catch (e) { console.warn('TAAFT 抓取失败:', e.message); return [] }
}

// ─── 主流程 ────────────────────────────────────

async function loadExistingNames() {
  const { data } = await sb.from('tools').select('name')
  return new Set((data || []).map(t => t.name.toLowerCase().trim()))
}

function dedupCandidates(candidates, existingSet) {
  const seen = new Set()
  return candidates.filter(c => {
    const key = c.name.toLowerCase().trim()
    if (!key || key.length < 2 || seen.has(key) || existingSet.has(key)) return false
    seen.add(key)
    return true
  })
}

async function classifyBatch(candidates) {
  const prompt = `你是 TG AI工具库 的内容编辑。下面是从多个数据源抓到的工具候选名单，请判断每一个：
1. 是不是真正的 AI 工具（不是教程/玩具/早期demo/普通软件）
2. 最适合哪个职业（必须从这6个里选一个）：律师/设计师/会计/营销/程序员/学生
3. 价值评分 1-10（10=非常实用、有差异化）

候选清单（共 ${candidates.length} 个）：
${candidates.map((c, i) => `${i + 1}. ${c.name} | ${c.url} | ${c.hint || '无描述'}`).join('\n')}

严格输出 JSON：
{
  "items": [
    {"index": 1, "is_ai_tool": true, "role": "程序员", "score": 8, "reason": "简短理由"},
    ...
  ]
}
对所有候选都要返回（按 index 顺序），不是 AI 工具的 is_ai_tool=false 即可。`
  const result = await ds(prompt)
  return result.items || []
}

async function generateContent(name, url, hint) {
  const prompt = `为 TG AI工具库 生成工具的中文介绍。
工具名: ${name}
官网/源: ${url}
已知信息: ${hint || '无'}

输出 JSON：
{
  "description": "一句话简介，50字内",
  "short_tag": "核心标签，10字内",
  "highlights": ["亮点1（10字内）","亮点2","亮点3"],
  "drawbacks": ["注意事项1","注意事项2"],
  "tg_advice": "TG使用建议：最适合谁、什么场景用，80字内"
}`
  return await ds(prompt)
}

function toSlug(name) {
  return name.toLowerCase()
    .replace(/[^\w\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '')
    .slice(0, 50) || 'tool-' + Date.now().toString(36)
}

async function main() {
  console.log('▶ 1/5 抓取候选...')
  const [gh, ab, ta] = await Promise.all([fetchGithubTrending(), fetchAibase(), fetchTAAFT()])
  const all = [...gh, ...ab, ...ta]
  console.log(`  GitHub:${gh.length} aibase:${ab.length} TAAFT:${ta.length} 合计:${all.length}`)

  console.log('▶ 2/5 去重...')
  const existing = await loadExistingNames()
  const candidates = dedupCandidates(all, existing)
  console.log(`  去重后: ${candidates.length}`)
  if (candidates.length === 0) { console.log('无新候选，结束'); return }

  console.log('▶ 3/5 DeepSeek 分类打分...')
  const classified = await classifyBatch(candidates.slice(0, 60))

  console.log('▶ 4/5 按职业挑 top 1...')
  const byRole = {}
  classified.forEach(c => {
    if (!c.is_ai_tool || !ROLES.includes(c.role) || c.score < 6) return
    const cand = candidates[c.index - 1]
    if (!cand) return
    if (!byRole[c.role] || byRole[c.role].score < c.score) {
      byRole[c.role] = { ...cand, role: c.role, score: c.score, reason: c.reason }
    }
  })
  const picks = Object.values(byRole)
  console.log(`  选中: ${picks.length} 个 (${picks.map(p => p.role).join(',')})`)

  console.log('▶ 5/5 生成内容并入库...')
  let ok = 0
  for (const p of picks) {
    try {
      const c = await generateContent(p.name, p.url, p.hint)
      const slug = toSlug(p.name)
      const payload = {
        name: p.name,
        slug,
        category: p.role,
        official_url: p.url,
        description: c.description,
        short_tag: c.short_tag,
        highlights: c.highlights || [],
        drawbacks: c.drawbacks || [],
        tg_advice: c.tg_advice,
        rating: 4.0,
        price: '待补充',
        is_new: true,
        status: 'pending',
        sort_order: 0,
      }
      const { error } = await sb.from('tools').insert(payload)
      if (error) throw error
      console.log(`  ✓ ${p.role}: ${p.name}`)
      ok++
    } catch (e) {
      console.error(`  ✗ ${p.name}: ${e.message}`)
    }
  }
  console.log(`完成: 成功入库 ${ok}/${picks.length}`)
}

main().catch(e => { console.error(e); process.exit(1) })
