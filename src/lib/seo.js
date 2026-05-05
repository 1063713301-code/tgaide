const SITE = 'https://tgaide.com'

export function setSEO({ title, description, path = '/', jsonLD = null, hreflang = null }) {
  if (title) document.title = title

  let metaDesc = document.querySelector('meta[name="description"]')
  if (!metaDesc) { metaDesc = document.createElement('meta'); metaDesc.name = 'description'; document.head.appendChild(metaDesc) }
  if (description) metaDesc.content = description

  const isEn = path.startsWith('/en/') || path === '/en'
  const zhPath = isEn ? (path === '/en' ? '/' : path.replace(/^\/en/, '')) : path
  const enPath = isEn ? path : (path === '/' ? '/en' : `/en${path}`)

  let canonical = document.querySelector('link[rel="canonical"]')
  if (!canonical) { canonical = document.createElement('link'); canonical.rel = 'canonical'; document.head.appendChild(canonical) }
  canonical.href = SITE + path

  document.querySelectorAll('link[rel="alternate"][data-seo]').forEach(el => el.remove())
  const hr = hreflang || { 'zh-CN': SITE + zhPath, 'en': SITE + enPath, 'x-default': SITE + zhPath }
  Object.entries(hr).forEach(([lang, url]) => {
    const link = document.createElement('link')
    link.rel = 'alternate'
    link.hreflang = lang
    link.href = url
    link.dataset.seo = '1'
    document.head.appendChild(link)
  })

  document.querySelectorAll('script[data-seo-jsonld]').forEach(el => el.remove())
  if (jsonLD) {
    const arr = Array.isArray(jsonLD) ? jsonLD : [jsonLD]
    arr.forEach((obj, i) => {
      const s = document.createElement('script')
      s.type = 'application/ld+json'
      s.dataset.seoJsonld = String(i)
      s.text = JSON.stringify(obj)
      document.head.appendChild(s)
    })
  }
}

export const breadcrumb = (items) => ({
  '@context': 'https://schema.org',
  '@type': 'BreadcrumbList',
  itemListElement: items.map((it, i) => ({
    '@type': 'ListItem', position: i + 1, name: it.name, item: SITE + it.path,
  })),
})

export const orgJsonLD = {
  '@context': 'https://schema.org',
  '@type': 'Organization',
  name: 'TG AI工具库',
  url: SITE,
  logo: SITE + '/logo.png',
}
