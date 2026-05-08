import { createClient } from '@supabase/supabase-js'

const sb = createClient(
  'https://pqladcebnqmovnskcklk.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBxbGFkY2VibnFtb3Zuc2tja2xrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzY2OTI3MDQsImV4cCI6MjA5MjI2ODcwNH0.Bwv9xSdAacahySQt2I4wYoiU87QkQ0GwpGhj7Lv20kA'
)

const { data, error } = await sb
  .from('industry_reports')
  .select('id, title, category, summary, content, created_at')
  .eq('report_type', 'weekly')
  .eq('status', 'draft')
  .order('created_at', { ascending: false })
  .limit(6)

if (error) {
  console.error('查询失败:', error)
  process.exit(1)
}

console.log(`\n找到 ${data.length} 篇周报草稿：\n`)

data.forEach((report, i) => {
  console.log(`━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`)
  console.log(`${i + 1}. ${report.title}`)
  console.log(`   职业：${report.category}`)
  console.log(`   摘要：${report.summary}`)
  console.log(`   生成时间：${report.created_at}`)
  console.log(`   内容预览（前500字）：`)
  console.log(report.content.slice(0, 500) + '...\n')
})
