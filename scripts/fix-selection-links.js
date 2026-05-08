/**
 * 一次性修复：清理选型方案内容中的 → 查看详情 链接和 → 查看完整选型速查
 * 工具名保留为 <strong>，前端会自动注入站内链接
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
  } catch {}
}
const sb = createClient(SUPA_URL, SUPA_KEY)

function cleanContent(html) {
  return html
    // 去掉 → <a ...>查看详情</a>
    .replace(/\s*→\s*<a[^>]*>查看详情<\/a>/g, '')
    // 去掉 → <a ...>查看完整选型速查</a> 整行
    .replace(/<p>\s*→\s*<a[^>]*>查看完整选型速查<\/a>\s*<\/p>\n?/g, '')
    // 去掉纯文本箭头 → [链接文字]
    .replace(/\s*→\s*\[.*?\]/g, '')
}

async function main() {
  const { data, error } = await sb.from('selection_guides').select('id, title, content')
  if (error) { console.error(error); process.exit(1) }

  console.log(`共 ${data.length} 条选型方案\n`)
  let fixed = 0
  for (const row of data) {
    const cleaned = cleanContent(row.content)
    if (cleaned === row.content) { console.log(`  跳过（无需修改）: ${row.title}`); continue }
    const { error: e } = await sb.from('selection_guides').update({ content: cleaned }).eq('id', row.id)
    if (e) console.error(`  ✗ ${row.title}: ${e.message}`)
    else { console.log(`  ✓ 已修复: ${row.title}`); fixed++ }
  }
  console.log(`\n完成：修复了 ${fixed} 条`)
}

main().catch(e => { console.error(e); process.exit(1) })
