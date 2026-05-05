#!/usr/bin/env node
/**
 * 用 DeepSeek API 自动生成工具内容，更新数据库 tools 表（缺失字段补全）
 * 用法:
 *   node scripts/generate-tool-content.js --name "Cursor" --url "https://cursor.sh"
 *   node scripts/generate-tool-content.js --all     批量补全数据库中缺亮点/建议的工具
 *   node scripts/generate-tool-content.js --json    只更新 tools.json 文件
 */

import { readFileSync, writeFileSync } from 'fs'
import { fileURLToPath } from 'url'
import { dirname, join } from 'path'
import { createClient } from '@supabase/supabase-js'

const __dir = dirname(fileURLToPath(import.meta.url))
const TOOLS_PATH = join(__dir, '../tools.json')

const API_KEY = process.env.DEEPSEEK_API_KEY
if (!API_KEY) {
  console.error('❌ 缺少 DEEPSEEK_API_KEY 环境变量')
  process.exit(1)
}

let SUPA_URL, SUPA_KEY
try {
  const env = readFileSync(join(__dir, '../.env'), 'utf-8')
  SUPA_URL = env.match(/VITE_SUPABASE_URL=(\S+)/)?.[1]
  SUPA_KEY = env.match(/VITE_SUPABASE_ANON_KEY=(\S+)/)?.[1]
} catch {}
SUPA_URL = SUPA_URL || process.env.VITE_SUPABASE_URL
SUPA_KEY = SUPA_KEY || process.env.VITE_SUPABASE_ANON_KEY
const sb = SUPA_URL && SUPA_KEY ? createClient(SUPA_URL, SUPA_KEY) : null

async function callDeepSeek(prompt) {
  const res = await fetch('https://api.deepseek.com/chat/completions', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${API_KEY}` },
    body: JSON.stringify({
      model: 'deepseek-chat',
      messages: [{ role: 'user', content: prompt }],
      response_format: { type: 'json_object' },
      temperature: 0.5,
    }),
  })
  if (!res.ok) throw new Error(`DeepSeek API ${res.status}: ${await res.text()}`)
  const data = await res.json()
  return JSON.parse(data.choices[0].message.content)
}

function buildPrompt(name, url, hint = '') {
  return `你是 TG AI工具库 的资深编辑。请根据以下工具信息生成结构化中文内容。

工具名称: ${name}
官网: ${url}
${hint ? `已知信息: ${hint}\n` : ''}
严格输出JSON（不要任何额外文字）：
{
  "description": "一句话简介，50字内",
  "short_tag": "核心标签，10字内",
  "highlights": ["亮点1（10字内）","亮点2","亮点3"],
  "drawbacks": ["注意事项1","注意事项2"],
  "tg_advice": "TG使用建议：最适合谁、什么场景用，80字内",
  "roles": ["适用职业，从这6个里选：律师/设计师/会计/营销/程序员/学生"]
}`
}

async function processOne(name, url, hint = '') {
  console.log(`▶ 生成: ${name}`)
  const result = await callDeepSeek(buildPrompt(name, url, hint))
  console.log(`  ${result.short_tag} | ${result.highlights?.length || 0}个亮点`)
  return result
}

function loadJson() { return JSON.parse(readFileSync(TOOLS_PATH, 'utf-8')) }
function saveJson(d) { writeFileSync(TOOLS_PATH, JSON.stringify(d, null, 2), 'utf-8') }

async function processOneToJson(name, url) {
  const tools = loadJson()
  const r = await processOne(name, url)
  const slug = name.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '')
  const existing = tools.find(t => t.name === name)
  if (existing) Object.assign(existing, r, { url, reviewed: false })
  else tools.push({ id: slug, name, slug, url, ...r, reviewed: false })
  saveJson(tools)
}

async function processAllDB() {
  if (!sb) { console.error('❌ 无法连接 Supabase'); process.exit(1) }
  const { data } = await sb.from('tools')
    .select('id,name,description,short_tag,highlights,drawbacks,tg_advice,official_url')
    .eq('status', 'active')
  const need = (data || []).filter(t =>
    !t.short_tag || !t.tg_advice ||
    !Array.isArray(t.highlights) || t.highlights.length === 0 ||
    !Array.isArray(t.drawbacks) || t.drawbacks.length === 0
  )
  console.log(`待处理: ${need.length}/${data.length} 个工具`)
  let ok = 0, fail = 0
  for (const t of need) {
    try {
      const r = await processOne(t.name, t.official_url || '', t.description || '')
      const update = {
        short_tag: t.short_tag || r.short_tag,
        highlights: (Array.isArray(t.highlights) && t.highlights.length) ? t.highlights : r.highlights,
        drawbacks: (Array.isArray(t.drawbacks) && t.drawbacks.length) ? t.drawbacks : r.drawbacks,
        tg_advice: t.tg_advice || r.tg_advice,
      }
      const { error } = await sb.from('tools').update(update).eq('id', t.id)
      if (error) throw error
      ok++
      await new Promise(r => setTimeout(r, 300))
    } catch (e) {
      fail++
      console.error(`  ✗ ${t.name}: ${e.message}`)
    }
  }
  console.log(`完成: 成功 ${ok}, 失败 ${fail}`)
}

const args = process.argv.slice(2)
const get = (flag) => { const i = args.indexOf(flag); return i >= 0 ? args[i + 1] : null }

if (args.includes('--all')) {
  processAllDB().catch(e => { console.error(e); process.exit(1) })
} else if (args.includes('--json')) {
  const name = get('--name'), url = get('--url')
  if (!name || !url) { console.error('--json 模式需要 --name 和 --url'); process.exit(1) }
  processOneToJson(name, url).catch(e => { console.error(e); process.exit(1) })
} else {
  const name = get('--name'), url = get('--url')
  if (!name) {
    console.error('用法:\n  --name "工具名" --url "https://..." [--json]\n  --all  批量补全数据库')
    process.exit(1)
  }
  processOne(name, url || '').then(r => console.log(JSON.stringify(r, null, 2)))
    .catch(e => { console.error(e); process.exit(1) })
}
