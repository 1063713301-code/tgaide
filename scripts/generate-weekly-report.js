#!/usr/bin/env node
/**
 * 每周自动生成职业AI周报
 * 运行时间：每周日凌晨
 * 输出：6篇周报（律师/会计/学生/程序员/设计师/营销），status=draft 待审核
 */
import { readFileSync } from 'fs'
import { fileURLToPath } from 'url'
import { dirname, join } from 'path'
import { createClient } from '@supabase/supabase-js'

const __dir = dirname(fileURLToPath(import.meta.url))
const ROLES = ['律师', '会计', '学生', '程序员', '设计师', '营销']

const ROLE_SCENE = {
  '律师': 'legal',
  '会计': 'finance',
  '设计师': 'design',
  '营销': 'marketing',
  '程序员': 'content',
  '学生': 'video',
}

// 职业专属关键词（用于筛选相关动态）
const ROLE_KEYWORDS = {
  '律师': ['司法', '法律', '合规', '合同', '判例', '法规', '诉讼'],
  '会计': ['财税', '审计', '合规', '金税', '电子发票', '报表', '税务'],
  '学生': ['论文', '查重', '考研', '学术', '文献', '笔记', '学习'],
  '程序员': ['开源', 'API', '模型', '框架', '代码', 'GitHub', 'Claude'],
  '设计师': ['Midjourney', 'DALL·E', 'Photoshop', 'Canva', 'UI', '插画'],
  '营销': ['广告', '投放', '数据分析', '内容营销', 'SEO', '文案', '社媒'],
}

// 经典工具（用于"同类工具对比"）
const CLASSIC_TOOLS = {
  '律师': ['通义法睿', '智谱法律', 'DeepSeek'],
  '会计': ['金蝶AI助手', '用友AI', 'ChatDOC'],
  '学生': ['ChatDOC', 'DeepSeek', '通义千问'],
  '程序员': ['GitHub Copilot', 'Claude Code', 'DeepSeek Coder'],
  '设计师': ['Midjourney', 'Photoshop AI', 'Canva AI'],
  '营销': ['通义千问', 'DeepSeek', 'Kimi'],
}

const API_KEY = process.env.DEEPSEEK_API_KEY
let SUPA_URL = process.env.VITE_SUPABASE_URL
let SUPA_KEY = process.env.VITE_SUPABASE_ANON_KEY

// 如果环境变量不存在，尝试从 .env 文件读取
if (!API_KEY || !SUPA_URL || !SUPA_KEY) {
  try {
    const envPath = join(__dir, '../.env')
    const env = readFileSync(envPath, 'utf-8')
    if (!API_KEY) {
      const match = env.match(/DEEPSEEK_API_KEY=(.+)/)
      if (match) process.env.DEEPSEEK_API_KEY = match[1].trim()
    }
    if (!SUPA_URL) {
      const match = env.match(/VITE_SUPABASE_URL=(.+)/)
      if (match) SUPA_URL = match[1].trim()
    }
    if (!SUPA_KEY) {
      const match = env.match(/VITE_SUPABASE_ANON_KEY=(.+)/)
      if (match) SUPA_KEY = match[1].trim()
    }
  } catch (e) {
    console.error('读取 .env 文件失败:', e.message)
  }
}

const FINAL_API_KEY = process.env.DEEPSEEK_API_KEY || API_KEY
if (!FINAL_API_KEY) { console.error('❌ 缺 DEEPSEEK_API_KEY'); process.exit(1) }
if (!SUPA_URL) { console.error('❌ 缺 SUPABASE_URL'); process.exit(1) }
if (!SUPA_KEY) { console.error('❌ 缺 SUPABASE_ANON_KEY'); process.exit(1) }

const sb = createClient(SUPA_URL, SUPA_KEY)

async function ds(prompt, json = true) {
  const res = await fetch('https://api.deepseek.com/chat/completions', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${FINAL_API_KEY}` },
    body: JSON.stringify({
      model: 'deepseek-chat',
      messages: [{ role: 'user', content: prompt }],
      ...(json ? { response_format: { type: 'json_object' } } : {}),
      temperature: 0.6,
    }),
  })
  if (!res.ok) throw new Error(`DeepSeek ${res.status}: ${await res.text()}`)
  const data = await res.json()
  const text = data.choices[0].message.content
  return json ? JSON.parse(text) : text
}

// ─── 数据查询 ────────────────────────────────────

/** 获取本周新入库的工具（按职业分组） */
async function fetchWeeklyTools() {
  const oneWeekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString()
  const { data, error } = await sb
    .from('tools')
    .select('name, category, description, short_tag, highlights, official_url, price, rating, slug')
    .eq('status', 'active')
    .gte('created_at', oneWeekAgo)
    .order('created_at', { ascending: false })

  if (error) throw error

  // 按职业分组
  const byRole = {}
  ROLES.forEach(r => { byRole[r] = [] })
  ;(data || []).forEach(t => {
    if (ROLES.includes(t.category)) {
      byRole[t.category].push(t)
    }
  })
  return byRole
}

/** 获取某职业的高评分工具（用于"同类工具对比"） */
async function fetchTopToolsByRole(role, limit = 5) {
  const { data, error } = await sb
    .from('tools')
    .select('name, slug, short_tag, rating')
    .eq('status', 'active')
    .eq('category', role)
    .order('rating', { ascending: false })
    .order('sort_order', { ascending: false })
    .limit(limit)

  if (error) throw error
  return data || []
}

/** 获取某职业的工具总数 */
async function fetchToolCountByRole(role) {
  const { count, error } = await sb
    .from('tools')
    .select('*', { count: 'exact', head: true })
    .eq('status', 'active')
    .eq('category', role)

  if (error) throw error
  return count || 0
}

/** 获取本周的日期范围（用于标题） */
function getWeekRange() {
  const now = new Date()
  const weekNum = Math.ceil((now - new Date(now.getFullYear(), 0, 1)) / (7 * 24 * 60 * 60 * 1000))
  const sunday = new Date(now)
  sunday.setDate(now.getDate() - now.getDay())
  const saturday = new Date(sunday)
  saturday.setDate(sunday.getDate() + 6)

  return {
    year: now.getFullYear(),
    weekNum,
    startDate: `${sunday.getMonth() + 1}月${sunday.getDate()}日`,
    endDate: `${saturday.getMonth() + 1}月${saturday.getDate()}日`,
  }
}

// ─── 周报生成 ────────────────────────────────────

/** 为单个职业生成周报 */
async function generateReportForRole(role, weeklyTools, topTools, totalCount, weekRange) {
  const newToolsCount = weeklyTools.length
  const hasNewTools = newToolsCount > 0

  const prompt = `你是 TG AI工具库的内容编辑，负责生成职业AI周报。

职业：${role}
本周新入库工具数：${newToolsCount}
该职业累计工具数：${totalCount}
周报标题：TG AI工具库 · ${role}AI周报 ${weekRange.year}年第${weekRange.weekNum}周（${weekRange.startDate}-${weekRange.endDate}）

${hasNewTools ? `本周新入库工具列表：
${weeklyTools.slice(0, 3).map((t, i) => `${i + 1}. ${t.name}
   - 简介：${t.description}
   - 标签：${t.short_tag}
   - 亮点：${(t.highlights || []).join('、')}
   - 价格：${t.price}
   - 评分：${t.rating}
   - 链接：https://tgaide.com/tools/${t.slug}`).join('\n\n')}` : '本周暂无新入库工具'}

该职业高评分工具（用于对比推荐）：
${topTools.map(t => `- ${t.name}（${t.short_tag}，评分${t.rating}）`).join('\n')}

请严格按照以下模板生成周报内容（Markdown格式）：

━━━━━━━━━━━━━━━━━━━━━
TG AI工具库 · ${role}AI周报
${weekRange.year}年第${weekRange.weekNum}周（${weekRange.startDate}-${weekRange.endDate}）
━━━━━━━━━━━━━━━━━━━━━

**本周数据：** 新增${role}工具${newToolsCount}个，累计收录${totalCount}个

${hasNewTools ? `---

### 【本周推荐工具】

${weeklyTools.slice(0, 3).map((t, i) => `#### ${i + 1}. ${t.name} - ${t.short_tag}

- **这是什么：** ${t.description}
- **${role}怎么用：** [必须写具体使用场景，面向${role}的真实工作，不能泛泛而谈]
- **为什么本周推荐：** [说明推荐理由：新入库/解决了什么痛点/用户反馈好]
- **价格：** ${t.price}
- → [查看详情](https://tgaide.com/tools/${t.slug})`).join('\n\n')}` : `---

### 【本周推荐工具】

本周暂无新入库的${role}AI工具。

#### 【本周重点推荐】（来自已有工具库）

${topTools[0].name} - ${topTools[0].short_tag}

**为什么本周再推一次：** [从以下3选1：本周用户使用数据最好/本周更新了新功能/很多用户还不知道这个工具]

**使用技巧：**
- [技巧1：具体可操作，不能是泛泛评价]
- [技巧2：同上]
- [技巧3：同上，没有就写2条]

**替代方案：** ${topTools[1]?.name || '无'} - [一句话区别]
→ [查看详情](https://tgaide.com/tools?category=${encodeURIComponent(role)})`}

---

### 【本周工具更新动态】

[从本周新入库工具中提取1-2条更新信息，格式：]
- **${weeklyTools[0]?.name || '某工具'}更新：** [一句话概述]
  - **和${role}有什么关系：** [具体说明对这个职业的影响]
  - **建议：** [这个职业的人该怎么应对]

---

### 【本周选型建议】

**场景：** [本周推荐的一个具体工作场景，必须是${role}的真实需求]

- **第一步：** 用[工具名]做[具体任务] → [链接]
- **第二步：** 用[工具名]做[具体任务] → [链接]
- **第三步（可选）：** 用[工具名]做[具体任务] → [链接]

→ [查看完整选型速查](https://tgaide.com/ai-tool-selection)

---

### 【同类工具对比】

如果你在用 **${topTools[0]?.name}**，可以试试 **${topTools[1]?.name}**
- **区别：** [一句话说明两者的核心差异]
- **适合谁：** [什么情况下选后者]

其他${role}常用工具：${topTools.slice(2).map(t => t.name).join('、')}

---

**本期编辑：** TG AI工具库 × AI生成 + 人工审核
**工具收录与反馈：** https://tgaide.com
**${role}专属工具库：** https://tgaide.com/tools?category=${encodeURIComponent(role)}

━━━━━━━━━━━━━━━━━━━━━

**质量要求：**
1. 每个推荐必须包含"适合谁/解决什么/亮点在哪"，不能只有简介
2. 禁止使用"可能""大概"等模糊词汇
3. 禁止编造工具，所有推荐必须来自上面提供的工具列表
4. "${role}怎么用"必须写具体场景，不能写成泛介绍
5. 使用技巧必须具体可操作，不做泛泛评价

输出 JSON 格式：
{
  "title": "周报标题",
  "summary": "一句话摘要（50字内）",
  "content": "完整周报内容（Markdown格式）",
  "selection": {
    "summary": "一句话摘要，说明覆盖哪些子方向、精选了哪些核心工具，60字内",
    "content": "完整选型方案内容（Markdown格式），包含2-4个子方向，每个子方向含：核心目标、推荐工具组合、每个工具的具体用法"
  }
}`

  return await ds(prompt)
}

// ─── Markdown → HTML ────────────────────────────────────

function markdownToHtml(md) {
  if (!md) return ''
  const lines = md.split('\n')
  const out = []
  let inUl = false

  const closeUl = () => { if (inUl) { out.push('</ul>'); inUl = false } }

  const inlineFormat = (s) => s
    .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
    .replace(/\*(.+?)\*/g, '<em>$1</em>')
    .replace(/`(.+?)`/g, '<code>$1</code>')
    .replace(/\[([^\]]+)\]\((https?:\/\/[^)]+)\)/g, '<a href="$2" target="_blank" rel="noopener noreferrer">$1</a>')

  for (const raw of lines) {
    const line = raw.trimEnd()

    // horizontal rule (━ or ---)
    if (/^━{3,}/.test(line) || /^-{3,}$/.test(line)) {
      closeUl()
      out.push('<hr>')
      continue
    }

    // headings
    const h4 = line.match(/^####\s+(.+)/)
    const h3 = line.match(/^###\s+(.+)/)
    const h2 = line.match(/^##\s+(.+)/)
    const h1 = line.match(/^#\s+(.+)/)
    if (h4) { closeUl(); out.push(`<h4>${inlineFormat(h4[1])}</h4>`); continue }
    if (h3) { closeUl(); out.push(`<h3>${inlineFormat(h3[1])}</h3>`); continue }
    if (h2) { closeUl(); out.push(`<h2>${inlineFormat(h2[1])}</h2>`); continue }
    if (h1) { closeUl(); out.push(`<h1>${inlineFormat(h1[1])}</h1>`); continue }

    // list item
    const li = line.match(/^[-*]\s+(.+)/)
    if (li) {
      if (!inUl) { out.push('<ul>'); inUl = true }
      out.push(`<li>${inlineFormat(li[1])}</li>`)
      continue
    }

    // blank line
    if (line.trim() === '') {
      closeUl()
      continue
    }

    // paragraph
    closeUl()
    out.push(`<p>${inlineFormat(line)}</p>`)
  }

  closeUl()
  return out.join('\n')
}

// ─── 主流程 ────────────────────────────────────

async function main() {
  console.log('▶ 1/4 查询本周数据...')
  const weekRange = getWeekRange()
  const weeklyToolsByRole = await fetchWeeklyTools()

  console.log('▶ 2/4 统计各职业数据...')
  const reports = []
  for (const role of ROLES) {
    const weeklyTools = weeklyToolsByRole[role] || []
    const topTools = await fetchTopToolsByRole(role, 5)
    const totalCount = await fetchToolCountByRole(role)

    console.log(`  ${role}: 本周新增${weeklyTools.length}个，累计${totalCount}个`)

    reports.push({
      role,
      weeklyTools,
      topTools,
      totalCount,
    })
  }

  console.log('▶ 3/4 生成周报内容...')
  let successCount = 0
  for (const r of reports) {
    try {
      console.log(`  生成 ${r.role} 周报...`)
      const result = await generateReportForRole(r.role, r.weeklyTools, r.topTools, r.totalCount, weekRange)

      const payload = {
        title: result.title,
        summary: result.summary,
        content: markdownToHtml(result.content),
        category: r.role,
        report_type: 'weekly',
        publish_date: new Date().toISOString().split('T')[0],
        status: 'draft',
      }

      const { data: inserted, error } = await sb.from('industry_reports').insert(payload).select('id').single()
      if (error) throw error

      // 同步生成选型方案
      if (result.selection?.content) {
        const selPayload = {
          title: `${r.role}AI工具选型 · ${weekRange.year}年第${weekRange.weekNum}周`,
          summary: result.selection.summary || '',
          content: markdownToHtml(result.selection.content),
          scene: ROLE_SCENE[r.role],
          period: `${weekRange.year}年第${weekRange.weekNum}周`,
          publish_date: new Date().toISOString().split('T')[0],
          source_report_id: inserted?.id || null,
          status: 'draft',
        }
        const { error: selErr } = await sb.from('selection_guides').insert(selPayload)
        if (selErr) console.warn(`  ⚠ ${r.role} 选型方案入库失败: ${selErr.message}`)
        else console.log(`  ✓ ${r.role} 选型方案已生成`)
      }

      console.log(`  ✓ ${r.role} 周报已生成（status=draft）`)
      successCount++
    } catch (e) {
      console.error(`  ✗ ${r.role} 周报生成失败: ${e.message}`)
    }
  }

  console.log(`▶ 4/4 完成: 成功生成 ${successCount}/${ROLES.length} 篇周报`)
  console.log('请前往后台审核：https://tgaide.com/admin/reports/weekly')
}

main().catch(e => { console.error(e); process.exit(1) })

