function setMeta(property, content, isName = false) {
  const attr = isName ? 'name' : 'property'
  let el = document.querySelector(`meta[${attr}="${property}"]`)
  if (!el) {
    el = document.createElement('meta')
    el.setAttribute(attr, property)
    document.head.appendChild(el)
  }
  el.setAttribute('content', content)
}

export function setToolOGTags(tool) {
  const slug = tool.slug || tool.id
  const title = `${tool.name} - TG AI工具库`
  const desc = tool.full_desc || tool.description || ''
  const url = `https://tgaide.com/tools/${slug}`

  document.title = title
  setMeta('og:title', title)
  setMeta('og:description', desc)
  setMeta('og:url', url)
  setMeta('og:image', tool.icon_url || 'https://tgaide.com/og-default.png')
  setMeta('og:type', 'website')
  setMeta('twitter:card', 'summary_large_image', true)
  setMeta('description', desc, true)
}

export function resetOGTags() {
  const defaultTitle = 'TG AI工具库 | AI工具导航与行业报告'
  document.title = defaultTitle
  setMeta('og:title', defaultTitle)
  setMeta('og:description', '每日更新最新AI工具上线、重大更新、行业趋势与避坑指南')
  setMeta('og:url', 'https://tgaide.com')
  setMeta('og:image', 'https://tgaide.com/og-default.png')
}
