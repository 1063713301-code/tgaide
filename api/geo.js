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

// Vercel 省份代码 → 中文（ISO 3166-2:CN 子区域代码）
const CN_REGION_CODES = {
  'BJ':'北京','TJ':'天津','SH':'上海','CQ':'重庆',
  'HE':'河北','SX':'山西','NM':'内蒙古','LN':'辽宁',
  'JL':'吉林','HL':'黑龙江','JS':'江苏','ZJ':'浙江',
  'AH':'安徽','FJ':'福建','JX':'江西','SD':'山东',
  'HA':'河南','HB':'湖北','HN':'湖南','GD':'广东',
  'GX':'广西','HI':'海南','SC':'四川','GZ':'贵州',
  'YN':'云南','XZ':'西藏','SN':'陕西','GS':'甘肃',
  'QH':'青海','NX':'宁夏','XJ':'新疆',
  'HK':'香港','MO':'澳门','TW':'台湾',
}

export default async function handler(req) {
  const country = req.headers.get('x-vercel-ip-country') || ''
  const region  = req.headers.get('x-vercel-ip-country-region') || ''
  const city    = req.headers.get('x-vercel-ip-city') || ''

  if (!country) return Response.json({ province: null, city: null })

  let province = null
  if (country === 'CN') {
    province = CN_REGION_CODES[region] || null
  } else {
    // 非中国用户显示国家名
    const names = new Intl.DisplayNames(['zh-CN'], { type: 'region' })
    try { province = names.of(country) || country } catch { province = country }
  }

  return Response.json({ province, city: decodeURIComponent(city) || null })
}
