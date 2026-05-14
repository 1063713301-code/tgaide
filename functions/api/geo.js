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

export async function onRequest({ request }) {
  const country = request.cf?.country || ''
  const region  = request.cf?.region  || ''
  const city    = request.cf?.city    || ''

  if (!country) return Response.json({ province: null, city: null })

  let province = null
  if (country === 'CN') {
    province = CN_REGION_CODES[region] || null
  } else {
    try { province = new Intl.DisplayNames(['zh-CN'], { type: 'region' }).of(country) || country } catch { province = country }
  }

  return Response.json({ province, city: city || null })
}
