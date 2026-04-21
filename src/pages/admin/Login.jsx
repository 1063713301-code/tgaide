import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { adminLogin, isAdminAuthenticated } from '../../hooks/useAuth'

export default function AdminLogin() {
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const navigate = useNavigate()

  useEffect(() => {
    document.title = '后台登录 - TG AI工具库'
    if (isAdminAuthenticated()) {
      navigate('/admin/dashboard', { replace: true })
    }
  }, [navigate])

  const handleSubmit = (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    setTimeout(() => {
      if (adminLogin(password)) {
        navigate('/admin/dashboard', { replace: true })
      } else {
        setError('密码错误，请重试')
        setLoading(false)
      }
    }, 400)
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 to-gray-800 flex items-center justify-center px-4">
      <div className="bg-white rounded-2xl shadow-2xl p-8 w-full max-w-sm">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="w-14 h-14 bg-emerald-500 rounded-2xl flex items-center justify-center text-white font-extrabold text-xl mx-auto mb-3">
            TG
          </div>
          <h1 className="text-xl font-bold text-gray-900">后台管理系统</h1>
          <p className="text-sm text-gray-400 mt-1">TG AI工具库</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">
              管理员密码
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="请输入管理密码"
              autoComplete="current-password"
              className="w-full px-4 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
              required
            />
          </div>

          {error && (
            <div className="flex items-center gap-2 p-3 bg-red-50 text-red-600 rounded-lg text-sm">
              <svg className="w-4 h-4 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
              </svg>
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading || !password}
            className="w-full py-2.5 bg-emerald-500 hover:bg-emerald-600 disabled:bg-gray-200 text-white font-semibold rounded-lg transition-colors text-sm"
          >
            {loading ? '验证中…' : '登录'}
          </button>
        </form>

        <p className="mt-6 text-center text-xs text-gray-400">
          默认密码：admin123（可在 .env 文件中修改）
        </p>
      </div>
    </div>
  )
}
