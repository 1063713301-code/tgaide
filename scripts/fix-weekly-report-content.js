/**
 * 一次性修复：将数据库中已有的 Markdown 格式周报内容转换为 HTML
 * 运行一次即可，之后 generate-weekly-report.js 会自动输出 HTML
 */
import { readFileSync } from 'fs'
import { fileURLToPath } from 'url'
import { dirname, join } from 'path'
import { createClient } from '@supabase/supabase-js'

const __dir = dirname(fileURLToPath(import.meta.url))

let SUPA_URL = process.env.VITE_SUPABASE_URL
let SUPA_KEY = process.env.VITE_SUPABASE_ANON_KEY

if (!SUPA_URL || !SUPA_KEY) {
  try {
    const env = readFileSync(join(__dir, '../.env'), 'utf-8')
    if (!SUPA_URL) { const m = env.match(/VITE_SUPABASE_URL=(.+)/); if (m) SUPA_URL = m[1].trim() }
    if (!SUPA_KEY) { const m = env.match(/VITE_SUPABASE_ANON_KEY=(.+)/); if (m) SUPA_KEY = m[1].trim() }
  } catch (e) { console.error('读取 .env 失败:', e.message) }
}

if (!SUPA_URL || !SUPA_KEY) { console.error('❌ 缺 Supabase 配置'); process.exit(1) }

const sb = createClient(SUPA_URL, SUPA_KEY)

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

    if (/^━{3,}/.test(line) || /^-{3,}$/.test(line)) {
      closeUl(); out.push('<hr>'); continue
    }

    const h4 = line.match(/^####\s+(.+)/)
    const h3 = line.match(/^###\s+(.+)/)
    const h2 = line.match(/^##\s+(.+)/)
    const h1 = line.match(/^#\s+(.+)/)
    if (h4) { closeUl(); out.push(`<h4>${inlineFormat(h4[1])}</h4>`); continue }
    if (h3) { closeUl(); out.push(`<h3>${inlineFormat(h3[1])}</h3>`); continue }
    if (h2) { closeUl(); out.push(`<h2>${inlineFormat(h2[1])}</h2>`); continue }
    if (h1) { closeUl(); out.push(`<h1>${inlineFormat(h1[1])}</h1>`); continue }

    const li = line.match(/^[-*]\s+(.+)/)
    if (li) {
      if (!inUl) { out.push('<ul>'); inUl = true }
      out.push(`<li>${inlineFormat(li[1])}</li>`)
      continue
    }

    if (line.trim() === '') { closeUl(); continue }

    closeUl()
    out.push(`<p>${inlineFormat(line)}</p>`)
  }

  closeUl()
  return out.join('\n')
}

function isMarkdown(content) {
  // 如果内容包含 Markdown 特征但不是 HTML 标签开头，认为是 Markdown
  return content && !content.trim().startsWith('<') && (
    /^#{1,4}\s/m.test(content) ||
    /^\*\*/.test(content) ||
    /^━{3,}/m.test(content) ||
    /^[-*]\s/m.test(content)
  )
}

async function main() {
  console.log('查询所有周报...')
  const { data, error } = await sb
    .from('industry_reports')
    .select('id, title, content, report_type')
    .eq('report_type', 'weekly')

  if (error) { console.error('查询失败:', error); process.exit(1) }

  console.log(`找到 ${data.length} 篇周报`)

  let fixed = 0
  for (const report of data) {
    if (!isMarkdown(report.content)) {
      console.log(`  跳过（已是HTML）: ${report.title}`)
      continue
    }

    const html = markdownToHtml(report.content)
    const { error: updateError } = await sb
      .from('industry_reports')
      .update({ content: html })
      .eq('id', report.id)

    if (updateError) {
      console.error(`  ✗ 更新失败 [${report.id}]: ${updateError.message}`)
    } else {
      console.log(`  ✓ 已修复: ${report.title}`)
      fixed++
    }
  }

  console.log(`\n完成：修复了 ${fixed}/${data.length} 篇周报`)
}

main().catch(e => { console.error(e); process.exit(1) })
