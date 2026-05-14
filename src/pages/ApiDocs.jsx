import Navbar from '../components/Navbar'
import Footer from '../components/Footer'

const BASE = 'https://tgaide.com/api/v1'

function Block({ method, path, desc, params, example, response }) {
  return (
    <div className="bg-white border border-gray-200 rounded-xl p-6 space-y-4">
      <div className="flex items-center gap-3">
        <span className="px-2 py-0.5 bg-blue-100 text-blue-700 text-xs font-bold rounded">{method}</span>
        <code className="text-sm font-mono text-gray-800">{BASE}{path}</code>
      </div>
      <p className="text-sm text-gray-600">{desc}</p>
      {params && (
        <div>
          <p className="text-xs font-semibold text-gray-500 mb-2">请求参数</p>
          <table className="w-full text-xs">
            <thead><tr className="text-gray-400 border-b border-gray-100"><th className="text-left pb-1">参数</th><th className="text-left pb-1">类型</th><th className="text-left pb-1">说明</th></tr></thead>
            <tbody>{params.map(([k,t,d],i) => <tr key={i} className="border-b border-gray-50 last:border-0"><td className="py-1.5 font-mono text-blue-600">{k}</td><td className="py-1.5 text-gray-400">{t}</td><td className="py-1.5 text-gray-600">{d}</td></tr>)}</tbody>
          </table>
        </div>
      )}
      <div>
        <p className="text-xs font-semibold text-gray-500 mb-2">请求示例</p>
        <pre className="bg-gray-50 border border-gray-100 rounded-lg px-4 py-3 text-xs text-gray-700 overflow-x-auto whitespace-pre-wrap">{example}</pre>
      </div>
      <div>
        <p className="text-xs font-semibold text-gray-500 mb-2">返回示例</p>
        <pre className="bg-gray-50 border border-gray-100 rounded-lg px-4 py-3 text-xs text-gray-700 overflow-x-auto whitespace-pre-wrap">{response}</pre>
      </div>
    </div>
  )
}

export default function ApiDocs() {
  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      <Navbar />
      <main className="flex-1 max-w-3xl mx-auto w-full px-4 py-12 space-y-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">API 文档</h1>
          <p className="text-gray-500 text-sm">基础地址：<code className="bg-gray-100 px-1.5 py-0.5 rounded text-blue-600">{BASE}</code></p>
          <div className="mt-3 bg-amber-50 border border-amber-200 rounded-lg px-4 py-3 text-sm text-amber-700">
            所有接口需在请求头携带 <code className="font-mono">x-api-key: 你的Key</code>，
            <a href="/api-apply" className="underline ml-1">免费申请 Key</a>
          </div>
        </div>

        <Block
          method="GET" path="/tools"
          desc="获取 AI 工具列表，支持分类筛选、关键词搜索和分页。"
          params={[
            ['category','string','职业分类，如：律师、设计师、程序员、会计、营销、学生'],
            ['keyword', 'string','关键词搜索'],
            ['page',    'number','页码，默认 1'],
            ['page_size','number','每页数量，默认 20，最大 50'],
          ]}
          example={`curl "${BASE}/tools?category=律师&page_size=5" \\\n  -H "x-api-key: 你的Key"`}
          response={`{\n  "data": [\n    {\n      "name": "ChatGPT",\n      "slug": "chatgpt",\n      "description": "OpenAI 出品的对话式 AI...",\n      "category": "律师",\n      "official_url": "https://chat.openai.com",\n      "rating": 4.8,\n      "price": "免费+$20/月",\n      "is_hot": true,\n      "tags": ["推荐"]\n    }\n  ],\n  "pagination": {\n    "page": 1,\n    "page_size": 5,\n    "total": 42,\n    "total_pages": 9\n  }\n}`}
        />

        <Block
          method="GET" path="/tools?slug=xxx"
          desc="获取单个工具的完整详情，包含 TG 实测建议、亮点和缺点。"
          params={[['slug','string','工具的唯一标识，如：chatgpt、cursor-ai']]}
          example={`curl "${BASE}/tools?slug=cursor-ai" \\\n  -H "x-api-key: 你的Key"`}
          response={`{\n  "data": {\n    "name": "Cursor AI",\n    "slug": "cursor-ai",\n    "description": "AI代码编辑器...",\n    "category": "程序员",\n    "official_url": "https://cursor.sh",\n    "rating": 4.8,\n    "price": "免费+$20/月",\n    "highlights": ["代码补全准确率高", "支持多文件上下文"],\n    "drawbacks": ["需要科学上网"],\n    "tg_advice": "强烈推荐程序员使用"\n  }\n}`}
        />

        <Block
          method="GET" path="/categories"
          desc="获取所有职业分类及各分类下的工具数量。"
          params={null}
          example={`curl "${BASE}/categories" \\\n  -H "x-api-key: 你的Key"`}
          response={`{\n  "data": [\n    { "name": "程序员", "count": 58 },\n    { "name": "设计师", "count": 43 },\n    { "name": "律师",   "count": 31 }\n  ]\n}`}
        />

        <div className="bg-white border border-gray-200 rounded-xl p-6 text-sm text-gray-600 space-y-2">
          <p className="font-semibold text-gray-800 mb-3">注意事项</p>
          <p>· 每个邮箱只能申请一个 Key，请妥善保存</p>
          <p>· 数据仅供个人开发和学习使用，禁止商业转售</p>
          <p>· 如需重置 Key 或有其他问题，请联系：3863779908@qq.com</p>
        </div>
      </main>
      <Footer />
    </div>
  )
}
