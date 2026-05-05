#!/usr/bin/env node
/**
 * 轻量预渲染：为关键路由生成带完整 SEO meta 的 HTML 文件。
 * 爬虫（含百度/Google/AI scraper）首屏即拿到 title/description/canonical/JSON-LD/h1。
 * React 应用照常 hydrate，用户体验不变。
 */
import { createClient } from '@supabase/supabase-js'
import { readFileSync, writeFileSync, mkdirSync, existsSync } from 'fs'
import { fileURLToPath } from 'url'
import { dirname, join } from 'path'

const __dir = dirname(fileURLToPath(import.meta.url))
const DIST = join(__dir, '../dist')
const TEMPLATE = readFileSync(join(DIST, 'index.html'), 'utf-8')
const SITE = 'https://tgaide.com'

let url, key
try {
  const env = readFileSync(join(__dir, '../.env'), 'utf-8')
  url = env.match(/VITE_SUPABASE_URL=(\S+)/)?.[1]
  key = env.match(/VITE_SUPABASE_ANON_KEY=(\S+)/)?.[1]
} catch {}
url = url || process.env.VITE_SUPABASE_URL
key = key || process.env.VITE_SUPABASE_ANON_KEY
const sb = createClient(url, key)

function esc(s) {
  return String(s || '').replace(/[&<>"']/g, c => ({ '&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;' }[c]))
}

function buildHTML({ path, title, description, h1, body = '', jsonLD = null }) {
  const canonical = SITE + path
  const isEn = path.startsWith('/en/') || path === '/en'
  const zhPath = isEn ? (path === '/en' ? '/' : path.replace(/^\/en/, '')) : path
  const enPath = isEn ? path : (path === '/' ? '/en' : `/en${path}`)

  const ldArr = jsonLD ? (Array.isArray(jsonLD) ? jsonLD : [jsonLD]) : []
  const ldHTML = ldArr.map(o => `<script type="application/ld+json">${JSON.stringify(o)}</script>`).join('\n    ')

  let html = TEMPLATE
  html = html.replace(/<title>[^<]*<\/title>/, `<title>${esc(title)}</title>`)
  html = html.replace(/<meta name="description" content="[^"]*"\s*\/>/, `<meta name="description" content="${esc(description)}" />`)
  html = html.replace(/<meta property="og:title" content="[^"]*"\s*\/>/, `<meta property="og:title" content="${esc(title)}" />`)
  html = html.replace(/<meta property="og:description" content="[^"]*"\s*\/>/, `<meta property="og:description" content="${esc(description)}" />`)
  html = html.replace(/<meta property="og:url" content="[^"]*"\s*\/>/, `<meta property="og:url" content="${canonical}" />`)
  html = html.replace(/<link rel="canonical" href="[^"]*"\s*\/>/, `<link rel="canonical" href="${canonical}" />`)

  const inject = `
    <link rel="alternate" hreflang="zh-CN" href="${SITE}${zhPath}" />
    <link rel="alternate" hreflang="en" href="${SITE}${enPath}" />
    <link rel="alternate" hreflang="x-default" href="${SITE}${zhPath}" />
    ${ldHTML}
  </head>`
  html = html.replace('</head>', inject)

  if (h1 || body) {
    const seoBlock = `<div id="seo-prerender" style="display:none">
      ${h1 ? `<h1>${esc(h1)}</h1>` : ''}
      ${body || ''}
    </div>`
    html = html.replace('<div id="root"></div>', `<div id="root"></div>\n${seoBlock}`)
  }
  return html
}

function writePage(path, html) {
  const filePath = path === '/' ? join(DIST, 'index.html')
    : join(DIST, path.replace(/^\//, ''), 'index.html')
  const dir = dirname(filePath)
  if (!existsSync(dir)) mkdirSync(dir, { recursive: true })
  writeFileSync(filePath, html)
}

const STATIC_PAGES = [
  { path: '/', title: 'TG AI工具库 | 职场人专属 AI 工具指南，效率翻倍神器库',
    description: 'TG AI工具库 - 只推荐实测好用的职业AI工具，覆盖律师、设计师、会计财税、营销运营、程序员、学生科研，全站内容免费浏览，无需登录。',
    h1: 'TG AI工具库 | 职场人专属 AI 工具指南' },
  { path: '/tools', title: '全部AI工具 - TG AI工具库',
    description: '收录律师、设计师、会计、营销、程序员、学生科研六大职业精选AI工具，支持评分、价格、分类筛选。',
    h1: '全部AI工具' },
  { path: '/industry-reports', title: '行业报告 - TG AI工具库',
    description: 'AI工具行业周报、月报、季报，深度分析趋势与赛道动态。', h1: 'AI工具行业报告' },
  { path: '/industry-reports/weekly', title: '周报 - TG AI工具库', description: '每周AI工具行业动态与趋势速览', h1: 'AI工具周报' },
  { path: '/industry-reports/monthly', title: '月报 - TG AI工具库', description: '每月AI工具行业深度分析报告', h1: 'AI工具月报' },
  { path: '/industry-reports/quarterly', title: '季报 - TG AI工具库', description: '季度AI工具行业全景报告', h1: 'AI工具季报' },
  { path: '/ai-tool-selection', title: '场景选型速查 - TG AI工具库',
    description: '设计、视频、营销、法律、内容、财务六大场景AI工具选型方案。', h1: 'AI工具场景选型速查' },
  { path: '/reviews', title: '用户评测 - TG AI工具库', description: '真实用户的AI工具使用体验与评测分享', h1: '用户真实评测' },
  { path: '/en', title: 'TG AI Tools | AI Tools for Professionals',
    description: 'Curated AI tools for lawyers, designers, accountants, marketers, developers and researchers.',
    h1: 'AI Tools for Professionals' },
  { path: '/en/tools', title: 'All AI Tools - TG AI Tools',
    description: 'Browse curated AI tools across six professions, sorted by rating and category.', h1: 'All AI Tools' },
]

async function main() {
  let count = 0
  for (const p of STATIC_PAGES) {
    writePage(p.path, buildHTML(p))
    count++
  }

  const { data: tools } = await sb.from('tools').select('name,slug,description,category,short_tag,price,rating,official_url,highlights,drawbacks,tg_advice')
    .eq('status', 'active').not('slug', 'is', null)

  for (const t of (tools || [])) {
    const path = `/tools/${t.slug}`
    const title = `${t.name} - AI工具详情 | TG AI工具库`
    const description = (t.description || t.short_tag || '').slice(0, 160)
    const ld = {
      '@context': 'https://schema.org', '@type': 'SoftwareApplication',
      name: t.name, description: t.description, url: t.official_url || (SITE + path),
      applicationCategory: 'BusinessApplication',
      ...(t.rating ? { aggregateRating: { '@type': 'AggregateRating', ratingValue: t.rating, bestRating: 5 } } : {}),
      publisher: { '@type': 'Organization', name: 'TG AI工具库', url: SITE },
    }
    const high = Array.isArray(t.highlights) ? t.highlights : []
    const draw = Array.isArray(t.drawbacks) ? t.drawbacks : []
    const body = `
      <p>${esc(t.description || '')}</p>
      ${t.short_tag ? `<p>标签：${esc(t.short_tag)}</p>` : ''}
      ${t.price ? `<p>价格：${esc(t.price)}</p>` : ''}
      ${high.length ? `<h2>核心亮点</h2><ul>${high.map(x => `<li>${esc(x)}</li>`).join('')}</ul>` : ''}
      ${draw.length ? `<h2>注意事项</h2><ul>${draw.map(x => `<li>${esc(x)}</li>`).join('')}</ul>` : ''}
      ${t.tg_advice ? `<h2>TG使用建议</h2><p>${esc(t.tg_advice)}</p>` : ''}
    `
    writePage(path, buildHTML({ path, title, description, h1: t.name, body, jsonLD: ld }))
    count++
  }

  const { data: reports } = await sb.from('industry_reports').select('id,title,summary').eq('status', 'published')
  for (const r of (reports || [])) {
    const path = `/industry-reports/${r.id}`
    writePage(path, buildHTML({ path, title: `${r.title} - TG AI工具库`,
      description: (r.summary || '').slice(0, 160), h1: r.title }))
    count++
  }

  console.log(`prerender: 已生成 ${count} 个静态HTML`)
}

main().catch(e => { console.error(e); process.exit(1) })
