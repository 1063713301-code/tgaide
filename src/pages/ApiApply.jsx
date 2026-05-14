import { useState } from 'react'
import Navbar from '../components/Navbar'
import Footer from '../components/Footer'

export default function ApiApply() {
  const [name,    setName]    = useState('')
  const [email,   setEmail]   = useState('')
  const [key,     setKey]     = useState('')
  const [existed, setExisted] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error,   setError]   = useState('')

  async function handleSubmit(e) {
    e.preventDefault()
    setLoading(true); setError('')
    try {
      const res  = await fetch('/api/apply-key', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ name, email }) })
      const data = await res.json()
      if (!res.ok) { setError(data.error || '申请失败'); return }
      setKey(data.key); setExisted(data.existed)
    } catch { setError('网络错误，请重试') }
    finally { setLoading(false) }
  }

  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      <Navbar />
      <main className="flex-1 flex items-center justify-center px-4 py-16">
        <div className="w-full max-w-md">
          <div className="bg-white rounded-2xl border border-gray-200 p-8 shadow-sm">
            <h1 className="text-2xl font-bold text-gray-900 mb-2">申请 API Key</h1>
            <p className="text-sm text-gray-500 mb-6">免费获取，用于调用 TG AI工具库数据接口</p>

            {!key ? (
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">姓名 / 昵称</label>
                  <input value={name} onChange={e => setName(e.target.value)} required placeholder="你的名字"
                    className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">邮箱</label>
                  <input value={email} onChange={e => setEmail(e.target.value)} required type="email" placeholder="your@email.com"
                    className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400" />
                </div>
                {error && <p className="text-sm text-red-500">{error}</p>}
                <button type="submit" disabled={loading}
                  className="w-full bg-blue-600 text-white rounded-lg py-2.5 text-sm font-medium hover:bg-blue-700 disabled:opacity-50">
                  {loading ? '生成中...' : '免费获取 API Key'}
                </button>
              </form>
            ) : (
              <div className="space-y-4">
                <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                  <p className="text-sm text-green-700 font-medium mb-1">{existed ? '你已有 API Key：' : 'API Key 生成成功！'}</p>
                  <code className="block text-xs bg-white border border-green-200 rounded px-3 py-2 break-all select-all">{key}</code>
                </div>
                <p className="text-xs text-gray-400">请妥善保存，每个邮箱只能申请一次。如需重置请联系我们。</p>
                <div className="bg-gray-50 rounded-lg p-4 text-xs text-gray-600 space-y-1">
                  <p className="font-medium text-gray-700 mb-2">调用示例：</p>
                  <code className="block bg-white border border-gray-200 rounded px-2 py-1.5 break-all">
                    {`curl https://tgaide.com/api/v1/tools \\`}<br/>
                    {`  -H "x-api-key: ${key}"`}
                  </code>
                </div>
                <a href="/api-docs" className="block text-center text-sm text-blue-600 hover:text-blue-700">查看完整 API 文档 →</a>
              </div>
            )}
          </div>
        </div>
      </main>
      <Footer />
    </div>
  )
}
