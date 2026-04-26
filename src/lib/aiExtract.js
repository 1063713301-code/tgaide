const WORKER_URL = import.meta.env.VITE_AI_EXTRACT_WORKER_URL
const WORKER_TOKEN = import.meta.env.VITE_AI_EXTRACT_TOKEN

/**
 * 调用 Cloudflare Worker 从报告内容中提取6大场景选型建议
 * @returns {Array} scenes — 6个场景对象 {scene, title, summary, content}
 */
export async function extractSelectionsFromReport({ content, reportTitle, reportId, period }) {
  if (!WORKER_URL || !WORKER_TOKEN) {
    throw new Error('缺少环境变量 VITE_AI_EXTRACT_WORKER_URL 或 VITE_AI_EXTRACT_TOKEN')
  }

  const resp = await fetch(WORKER_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${WORKER_TOKEN}`,
    },
    body: JSON.stringify({ content, reportTitle, reportId, period }),
  })

  if (!resp.ok) {
    const err = await resp.json().catch(() => ({}))
    throw new Error(err.error || `Worker 请求失败: ${resp.status}`)
  }

  const { scenes } = await resp.json()
  return scenes || []
}
