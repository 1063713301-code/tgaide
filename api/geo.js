export const config = { runtime: 'edge' }

const CN_PROVINCES = {
  'Beijing':'北京','Tianjin':'天津','Shanghai':'上海','Chongqing':'重庆',
  'Hebei':'河北','Shanxi':'山西','Inner Mongolia':'内蒙古','Liaoning':'辽宁',
  'Jilin':'吉林','Heilongjiang':'黑龙江','Jiangsu':'江苏','Zhejiang':'浙江',
  'Anhui':'安徽','Fujian':'福建','Jiangxi':'江西','Shandong':'山东',
  'Henan':'河南','Hubei':'湖北','Hunan':'湖南','Guangdong':'广东',
  'Guangxi':'广西','Hainan':'海南','Sichuan':'四川','Guizhou':'贵州',
  'Yunnan':'云南','Tibet':'西藏','Shaanxi':'陕西','Gansu':'甘肃',
  'Qinghai':'青海','Ningxia':'宁夏','Xinjiang':'新疆',
  'Hong Kong':'香港','Macao':'澳门','Taiwan':'台湾',
}

export default async function handler(req) {
  const xff = req.headers.get('x-forwarded-for') || ''
  const ip = xff.split(',')[0].trim() || req.headers.get('x-real-ip') || ''

  if (!ip) return Response.json({ province: null, city: null })

  try {
    const res = await fetch(`https://ipapi.co/${ip}/json/`, { signal: AbortSignal.timeout(3000) })
    if (!res.ok) throw new Error()
    const { region, city, country_name } = await res.json()
    const province = country_name === 'China' ? (CN_PROVINCES[region] || region || null) : (country_name || null)
    return Response.json({ province, city: city || null })
  } catch {
    return Response.json({ province: null, city: null })
  }
}
