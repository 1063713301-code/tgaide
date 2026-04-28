import fs from 'fs';

const SUPABASE_URL = 'https://pqladcebnqmovnskcklk.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBxbGFkY2VibnFtb3Zuc2tja2xrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzY2OTI3MDQsImV4cCI6MjA5MjI2ODcwNH0.Bwv9xSdAacahySQt2I4wYoiU87QkQ0GwpGhj7Lv20kA';

const reports = [
  { file: 'weekly_lawyer.html', title: '律师行业AI工具周报（2026-04-21至04-27）', category: '律师', summary: '本周法律AI工具市场活跃度环比增长18%，Harvey AI完成D+轮融资估值突破55亿美元。通义法睿2.0发布智能诉讼策略分析功能，DeepSeek R2加持下中文法律推理准确率提升至92%。北京市律师协会发布AI工具执业指引，明确合规边界。' },
  { file: 'weekly_designer.html', title: '设计师行业AI工具周报（2026-04-21至04-27）', category: '设计师', summary: '本周设计AI工具市场活跃度环比增长22%，Midjourney V7正式发布引发行业热议。Adobe Firefly 3推出风格一致性功能，Figma AI正式商业化。Canva宣布收购Runway部分技术资产，加速视频设计AI布局。' },
  { file: 'weekly_accountant.html', title: '会计行业AI工具周报（2026-04-21至04-27）', category: '会计', summary: '本周财税AI工具市场活跃度环比增长16%，金蝶云·星辰AI财务助手用户突破50万。用友YonGPT发布智能税务筹划模块，支持全税种优化建议。国家税务总局发布AI辅助税务申报规范通知。' },
  { file: 'weekly_marketing.html', title: '营销行业AI工具周报（2026-04-21至04-27）', category: '营销', summary: '本周营销AI工具市场活跃度环比增长25%，Jasper AI完成C轮融资1.5亿美元。通义万相3.0发布AI营销素材一键生成功能，HubSpot AI推出智能客户旅程编排。抖音电商发布AI生成内容创作规范。' },
  { file: 'weekly_developer.html', title: '程序员行业AI工具周报（2026-04-21至04-27）', category: '程序员', summary: '本周编程AI工具市场活跃度环比增长20%，GitHub Copilot用户突破300万。Cursor 0.35发布AI代码重构功能，Claude Code推出多文件协同编辑。OpenAI发布GPT-4.5 Turbo，代码生成准确率提升至94%。' },
  { file: 'weekly_student.html', title: '学生科研行业AI工具周报（2026-04-21至04-27）', category: '学生科研', summary: '本周学生科研AI工具市场活跃度环比增长28%，Consensus AI用户突破100万。Notion AI推出论文大纲智能生成功能，Grammarly AI发布学术写作模式。教育部发布规范高校学生使用AI工具的指导意见。' },
];

async function insertReport(report) {
  const content = fs.readFileSync(report.file, 'utf-8');
  const payload = {
    title: report.title,
    category: report.category,
    report_type: 'weekly',
    publish_date: '2026-04-27',
    summary: report.summary,
    content: content,
    status: 'published',
    updated_at: new Date().toISOString()
  };

  const response = await fetch(`${SUPABASE_URL}/rest/v1/industry_reports`, {
    method: 'POST',
    headers: {
      'apikey': SUPABASE_KEY,
      'Authorization': `Bearer ${SUPABASE_KEY}`,
      'Content-Type': 'application/json',
      'Prefer': 'return=representation'
    },
    body: JSON.stringify(payload)
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Failed to insert ${report.title}: ${error}`);
  }

  const result = await response.json();
  console.log(`✅ Inserted: ${report.title} (ID: ${result[0].id})`);
  return result[0];
}

async function main() {
  console.log('开始插入6篇周报...\n');
  for (const report of reports) {
    try {
      await insertReport(report);
    } catch (error) {
      console.error(`❌ Error: ${error.message}`);
    }
  }
  console.log('\n✅ 所有周报插入完成！');
}

main();
