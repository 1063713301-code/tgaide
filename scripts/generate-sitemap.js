#!/usr/bin/env node
/**
 * 构建时生成 public/sitemap.xml，包含静态路由 + 动态工具/对比/文章URL
 */
import { createClient } from '@supabase/supabase-js'
import { writeFileSync, readFileSync } from 'fs'
import { fileURLToPath } from 'url'
import { dirname, join } from 'path'

const __dir = dirname(fileURLToPath(import.meta.url))
const SITE = 'https://tgaide.com'

const envPath = join(__dir, '../.env')
let url, key
try {
  const env = readFileSync(envPath, 'utf-8')
  url = env.match(/VITE_SUPABASE_URL=(\S+)/)?.[1]
  key = env.match(/VITE_SUPABASE_ANON_KEY=(\S+)/)?.[1]
} catch {}
url = url || process.env.VITE_SUPABASE_URL
key = key || process.env.VITE_SUPABASE_ANON_KEY

const sb = createClient(url, key)

const STATIC_ROUTES = [
  '/', '/tools', '/reviews', '/industry-reports',
  '/industry-reports/weekly', '/industry-reports/monthly', '/industry-reports/quarterly',
  '/ai-tool-selection', '/compare',
]

function urlEntry(path, lastmod) {
  const lm = lastmod ? `<lastmod>${new Date(lastmod).toISOString().split('T')[0]}</lastmod>` : ''
  return `  <url><loc>${SITE}${path}</loc>${lm}</url>`
}

async function main() {
  const lines = ['<?xml version="1.0" encoding="UTF-8"?>',
    '<urlset xmlns="http://www.sitemap.org/schemas/sitemap/0.9">']
  STATIC_ROUTES.forEach(p => lines.push(urlEntry(p)))

  const { data: tools } = await sb.from('tools').select('slug,updated_at,rating,sort_order')
    .eq('status', 'active').not('slug', 'is', null)
  const toolList = tools || []
  toolList.forEach(t => lines.push(urlEntry(`/tools/${t.slug}`, t.updated_at)))

  const byCategory = {}
  toolList.forEach(t => {
    if (t.category) (byCategory[t.category] = byCategory[t.category] || []).push(t)
  })
  const pairs = new Set()
  toolList.slice(0, 30).forEach(a => {
    toolList.filter(b => b.slug !== a.slug).slice(0, 5).forEach(b => {
      const k = [a.slug, b.slug].sort().join('-vs-')
      pairs.add(k)
    })
  })
  ;[...pairs].slice(0, 100).forEach(p => lines.push(urlEntry(`/compare/${p}`)))

  const { data: reports } = await sb.from('industry_reports').select('id,updated_at').eq('status','published')
  ;(reports || []).forEach(r => lines.push(urlEntry(`/industry-reports/${r.id}`, r.updated_at)))

  const { data: briefs } = await sb.from('daily_briefs').select('id,updated_at').eq('status','published')
  ;(briefs || []).forEach(b => lines.push(urlEntry(`/daily-briefs/${b.id}`, b.updated_at)))

  const { data: sel } = await sb.from('selection_guides').select('id,scene,updated_at').eq('status','published').eq('is_hidden', false)
  ;(sel || []).forEach(s => lines.push(urlEntry(`/ai-tool-selection/${s.scene}/${s.id}`, s.updated_at)))

  lines.push('</urlset>')
  writeFileSync(join(__dir, '../public/sitemap.xml'), lines.join('\n'))
  console.log(`sitemap.xml 已生成，共 ${lines.length - 3} 个URL`)
}

main().catch(e => { console.error(e); process.exit(1) })
