export default {
  async fetch(request, env) {
    if (request.method === 'OPTIONS') {
      return corsResponse(null, 204)
    }

    if (request.method !== 'POST') {
      return corsResponse(JSON.stringify({ error: 'Method not allowed' }), 405)
    }

    const auth = request.headers.get('Authorization') || ''
    if (auth !== `Bearer ${env.ALLOWED_TOKEN}`) {
      return corsResponse(JSON.stringify({ error: 'Unauthorized' }), 401)
    }

    let body
    try {
      body = await request.json()
    } catch {
      return corsResponse(JSON.stringify({ error: 'Invalid JSON' }), 400)
    }

    const { content, reportTitle, reportId, period } = body
    if (!content || !reportTitle) {
      return corsResponse(JSON.stringify({ error: 'Missing content or reportTitle' }), 400)
    }

    const prompt = `你是一个AI工具选型专家。请从以下行业报告中，提取与这6个场景相关的AI工具选型建议：
1. design（设计系统生成：海报/建模/视觉）
2. video（视频内容制作：剪辑/数字人/短视频）
3. marketing（全链路运营推广：文案/投放/数据）
4. legal（律师合同审查：文书/风险/法律辅助）
5. content（商业内容营销：品牌文案/策划/种草）
6. finance（专业财务分析：报税/发票/报表）

报告标题：${reportTitle}
报告内容：
${content.slice(0, 8000)}

请严格按以下JSON格式输出，不要输出其他内容：
[
  {"scene":"design","title":"标题","summary":"一句话摘要（50字内）","content":"详细工具组合建议（HTML格式）"},
  {"scene":"video","title":"标题","summary":"...","content":"..."},
  {"scene":"marketing","title":"标题","summary":"...","content":"..."},
  {"scene":"legal","title":"标题","summary":"...","content":"..."},
  {"scene":"content","title":"标题","summary":"...","content":"..."},
  {"scene":"finance","title":"标题","summary":"...","content":"..."}
]
如果某个场景在报告中没有相关内容，该场景的title设为空字符串""，summary和content也设为""。`

    const resp = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': env.ANTHROPIC_API_KEY,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: 'claude-haiku-4-5-20251001',
        max_tokens: 4096,
        messages: [{ role: 'user', content: prompt }],
      }),
    })

    if (!resp.ok) {
      const err = await resp.text()
      return corsResponse(JSON.stringify({ error: 'Claude API error', detail: err }), 502)
    }

    const result = await resp.json()
    const text = result.content?.[0]?.text || '[]'

    let scenes
    try {
      scenes = JSON.parse(text)
    } catch {
      return corsResponse(JSON.stringify({ error: 'Failed to parse Claude response', raw: text }), 502)
    }

    return corsResponse(JSON.stringify({ scenes, reportId, period }), 200)
  },
}

function corsResponse(body, status) {
  return new Response(body, {
    status,
    headers: {
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
    },
  })
}
