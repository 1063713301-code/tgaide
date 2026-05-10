#!/usr/bin/env node
/**
 * 每日发现新工具：DeepSeek 生成候选 → 去重 → 每职业1个 → 入库 status=pending
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
      temperature: 0.7,
    }),
  })
  if (!res.ok) throw new Error(`DeepSeek ${res.status}: ${await res.text()}`)
  const data = await res.json()
  const text = data.choices[0].message.content
  return json ? JSON.parse(text) : text
}

async function loadExistingNames() {
  const { data } = await sb.from('tools').select('name')
  return new Set((data || []).map(t => t.name.toLowerCase().trim()))
}

/** 让 DeepSeek 直接推荐每个职业1个近期值得收录的 AI 工具 */
async function discoverByAI(existingNames, today) {
  const existingList = [...existingNames].slice(0, 150).join('、')
  const prompt = `今天是 ${today}。你是 TG AI工具库 的内容编辑，负责每日发现值得收录的 AI 工具。

请为以下6个职业各推荐3个近期（2024年至今）发布或更新、真实存在、有独立官网的 AI 工具：
律师、设计师、会计、营销、程序员、学生

要求：
1. 必须是真实存在的 AI 工具，有独立官网（非 GitHub/npm 等代码托管平台）
2. 尽量避免以下已收录工具（${existingNames.size}个，列举部分）：${existingList}
3. 每个工具评分 1-10（10=非常实用、有差异化），只推荐评分 ≥ 7 的
4. 尽量推荐近期有热度或更新的工具，不要推荐过于冷门的
5. 每个职业给3个候选，方便去重后仍有足够选择

输出 JSON：
{
  "items": [
    {
      "role": "律师",
      "name": "工具英文名",
      "official_url": "https://...",
      "score": 8,
      "hint": "一句话描述这个工具是什么"
    }
  ]
}`
  const result = await ds(prompt)
  const filtered = (result.items || []).filter(item =>
    item.name && item.official_url && item.score >= 7 &&
    !existingNames.has(item.name.toLowerCase().trim())
  )
  // 每个职业只取最高分的1个
  const byRole = {}
  for (const item of filtered) {
    if (!byRole[item.role] || byRole[item.role].score < item.score) byRole[item.role] = item
  }
  return Object.values(byRole)
}

async function generateContent(name, officialUrl, hint) {
  const prompt = `为 TG AI工具库 生成工具的中文介绍。
工具名: ${name}
官网: ${officialUrl}
已知信息: ${hint || '无'}

输出 JSON：
{
  "description": "一句话简介，50字内",
  "short_tag": "核心标签，10字内",
  "price": "价格，如：免费、免费/付费、$20/月、按量计费，10字内",
  "highlights": ["亮点1（10字内）","亮点2","亮点3"],
  "drawbacks": ["注意事项1","注意事项2"],
  "tg_advice": "TG使用建议：最适合谁、什么场景用，80字内"
}`
  return await ds(prompt)
}

function getFaviconUrl(officialUrl) {
  try {
    const { hostname } = new URL(officialUrl)
    return `https://www.google.com/s2/favicons?domain=${hostname}&sz=128`
  } catch { return null }
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
  const today = new Date().toISOString().slice(0, 10)

  console.log('▶ 1/4 加载已有工具名单...')
  const existing = await loadExistingNames()
  console.log(`  已收录: ${existing.size} 个`)

  console.log('▶ 2/4 DeepSeek AI 推荐候选工具...')
  const picks = await discoverByAI(existing, today)
  console.log(`  推荐: ${picks.length} 个 (${picks.map(p => p.role).join(',')})`)
  if (picks.length === 0) { console.log('无新候选，结束'); return }

  console.log('▶ 3/4 生成详细内容...')
  let ok = 0
  for (const p of picks) {
    try {
      const c = await generateContent(p.name, p.official_url, p.hint)
      const slug = toSlug(p.name)
      const { error } = await sb.from('tools').insert({
        name: p.name,
        slug,
        category: p.role,
        official_url: p.official_url,
        icon_url: getFaviconUrl(p.official_url),
        description: c.description,
        short_tag: c.short_tag,
        highlights: c.highlights || [],
        drawbacks: c.drawbacks || [],
        tg_advice: c.tg_advice,
        rating: 4.0,
        price: c.price || '待补充',
        is_new: true,
        status: 'pending',
        sort_order: 0,
      })
      if (error) throw error
      console.log(`  ✓ ${p.role}: ${p.name} (${p.official_url})`)
      ok++
    } catch (e) {
      console.error(`  ✗ ${p.name}: ${e.message}`)
    }
  }
  console.log(`▶ 4/4 完成: 成功入库 ${ok}/${picks.length}`)
}

main().catch(e => { console.error(e); process.exit(1) })
