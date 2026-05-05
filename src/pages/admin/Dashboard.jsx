import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { adminLogout } from '../../hooks/useAuth'
import { adminFetchAll, adminFetchTools, adminFetchReviews, adminFetchSelectionCount, adminFetchPendingToolsCount } from '../../lib/supabase'

function StatCard({ label, value, color, link, icon }) {
  return (
    <Link to={link} className="bg-white border border-gray-200 rounded-xl p-5 hover:shadow-md transition-shadow block">
      <div className="flex items-start justify-between">
        <div>
          <div className={`text-3xl font-bold ${color} mb-1`}>{value}</div>
          <div className="text-sm text-gray-500">{label}</div>
        </div>
        <span className="text-2xl opacity-60">{icon}</span>
      </div>
    </Link>
  )
}

const QUICK_ACTIONS = [
  { to: '/admin/reports/new',          icon: '📊', label: '新建行业报告' },
  { to: '/admin/reports/weekly/new',   icon: '📅', label: '新建周报' },
  { to: '/admin/reports/monthly/new',  icon: '📈', label: '新建月报' },
  { to: '/admin/tools/new',            icon: '🔧', label: '新建AI工具' },
  { to: '/admin/reviews/new',          icon: '⭐', label: '新建评测' },
  { to: '/admin/reports',              icon: '📋', label: '管理报告列表' },
  { to: '/admin/reports/weekly',       icon: '📅', label: '管理周报' },
  { to: '/admin/reports/monthly',      icon: '📈', label: '管理月报' },
  { to: '/admin/tools',                icon: '🗂️', label: '管理工具列表' },
  { to: '/admin/tools/pending',        icon: '🆕', label: '审核每日新工具' },
  { to: '/admin/reviews',              icon: '💬', label: '管理评测列表' },
  { to: '/admin/selections/new',       icon: '🎯', label: '新建选型方案' },
  { to: '/admin/selections',           icon: '📌', label: '管理选型速查' },
]

export default function AdminDashboard() {
  const navigate = useNavigate()
  const [stats, setStats] = useState({ reports: 0, weekly: 0, monthly: 0, tools: 0, reviews: 0, selections: 0, pending: 0 })
  const [loading, setLoading] = useState(true)

  useEffect(() => { document.title = '后台管理 - TG AI工具库' }, [])

  useEffect(() => {
    Promise.all([adminFetchAll('report'), adminFetchAll('report', { reportType: 'weekly' }), adminFetchAll('report', { reportType: 'monthly' }), adminFetchTools(), adminFetchReviews(), adminFetchSelectionCount(), adminFetchPendingToolsCount()])
      .then(([reports, weekly, monthly, tools, reviews, selections, pending]) => {
        setStats({ reports: reports.length, weekly: weekly.length, monthly: monthly.length, tools: tools.length, reviews: reviews.length, selections, pending })
      })
      .catch(console.error)
      .finally(() => setLoading(false))
  }, [])

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b border-gray-200 px-4 sm:px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center text-white font-bold text-sm">TG</div>
          <span className="font-semibold text-gray-800">后台管理系统</span>
        </div>
        <div className="flex items-center gap-4">
          <Link to="/" target="_blank" className="text-sm text-gray-500 hover:text-blue-600">查看前台 ↗</Link>
          <button onClick={() => { adminLogout(); navigate('/admin', { replace: true }) }} className="text-sm text-red-500 hover:text-red-600 font-medium">退出登录</button>
        </div>
      </header>

      <div className="max-w-5xl mx-auto px-6 py-8">
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-8">
          {loading ? Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="bg-white border border-gray-200 rounded-xl p-5">
              <div className="skeleton h-8 w-14 rounded mb-2" />
              <div className="skeleton h-4 w-20 rounded" />
            </div>
          )) : (
            <>
              <StatCard icon="📊" label="行业报告" value={stats.reports} color="text-blue-600"   link="/admin/reports" />
              <StatCard icon="📅" label="周报"     value={stats.weekly}  color="text-purple-600" link="/admin/reports/weekly"  />
              <StatCard icon="📈" label="月报"     value={stats.monthly} color="text-indigo-600" link="/admin/reports/monthly" />
              <StatCard icon="🔧" label="AI工具"   value={stats.tools}   color="text-orange-500" link="/admin/tools"  />
              <StatCard icon="🆕" label={`待审核 ${stats.pending > 0 ? '🔴' : ''}`} value={stats.pending} color={stats.pending > 0 ? 'text-red-500' : 'text-gray-400'} link="/admin/tools/pending" />
              <StatCard icon="💬" label="用户评测" value={stats.reviews} color="text-emerald-600" link="/admin/reviews" />
              <StatCard icon="🎯" label="选型速查" value={stats.selections} color="text-indigo-600" link="/admin/selections" />
            </>
          )}
        </div>

        <div className="bg-white border border-gray-200 rounded-xl p-6 mb-6">
          <h2 className="font-semibold text-gray-800 mb-4">快捷操作</h2>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {QUICK_ACTIONS.map((action) => (
              <Link key={action.to} to={action.to}
                className="flex flex-col items-center gap-2 p-4 border-2 border-dashed border-gray-200 rounded-xl text-sm text-gray-600 hover:border-blue-400 hover:text-blue-600 transition-colors">
                <span className="text-2xl">{action.icon}</span>
                <span className="text-center leading-tight text-xs">{action.label}</span>
              </Link>
            ))}
          </div>
        </div>

        <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 text-sm text-blue-700">
          <strong>Word 粘贴提示：</strong>在报告/简报编辑器中直接 Ctrl+V 粘贴 Word 内容，格式将自动保留。工具图标支持拖拽上传，自动压缩至 256×256。
        </div>
      </div>
    </div>
  )
}
