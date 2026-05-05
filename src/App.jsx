import { lazy, Suspense, useEffect } from 'react'
import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom'
import { isAdminAuthenticated } from './hooks/useAuth'
import { useLang } from './lib/i18n.jsx'

function LangSync() {
  const { pathname } = useLocation()
  const { lang, setLang } = useLang()
  useEffect(() => {
    const isEn = pathname.startsWith('/en/') || pathname === '/en'
    const target = isEn ? 'en' : 'zh'
    if (lang !== target) setLang(target)
    document.documentElement.lang = target === 'en' ? 'en' : 'zh-CN'
  }, [pathname, lang, setLang])
  return null
}

const Home = lazy(() => import('./pages/Home'))
const AllTools = lazy(() => import('./pages/AllTools'))
const IndustryReports = lazy(() => import('./pages/IndustryReports'))
const ReportList = lazy(() => import('./pages/ReportList'))
const ArticleDetail = lazy(() => import('./pages/ArticleDetail'))
const Reviews = lazy(() => import('./pages/Reviews'))
const AIToolSelection = lazy(() => import('./pages/AIToolSelection'))
const AIToolSelectionScene = lazy(() => import('./pages/AIToolSelectionScene'))
const CompareTools = lazy(() => import('./pages/CompareTools'))
const ToolDetail = lazy(() => import('./pages/ToolDetail'))
const CompareDetail = lazy(() => import('./pages/CompareDetail'))
const AdminLogin = lazy(() => import('./pages/admin/Login'))
const AdminDashboard = lazy(() => import('./pages/admin/Dashboard'))
const AdminArticleList = lazy(() => import('./pages/admin/ArticleList'))
const AdminArticleEditor = lazy(() => import('./pages/admin/ArticleEditor'))
const AdminToolList = lazy(() => import('./pages/admin/ToolList'))
const AdminPendingToolList = lazy(() => import('./pages/admin/PendingToolList'))
const AdminToolEditor = lazy(() => import('./pages/admin/ToolEditor'))
const AdminReviewList = lazy(() => import('./pages/admin/ReviewList'))
const AdminReviewEditor = lazy(() => import('./pages/admin/ReviewEditor'))

function ProtectedRoute({ children }) {
  if (!isAdminAuthenticated()) return <Navigate to="/admin" replace />
  return children
}

function PageLoader() {
  return <div className="min-h-screen flex items-center justify-center"><div className="w-6 h-6 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" /></div>
}

export default function App() {
  return (
    <BrowserRouter>
      <LangSync />
      <Suspense fallback={<PageLoader />}>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/en" element={<Home />} />
          <Route path="/tools" element={<AllTools />} />
          <Route path="/en/tools" element={<AllTools />} />
          <Route path="/reviews" element={<Reviews />} />
          <Route path="/en/reviews" element={<Reviews />} />
          <Route path="/industry-reports" element={<IndustryReports />} />
          <Route path="/en/industry-reports" element={<IndustryReports />} />
          <Route path="/industry-reports/weekly" element={<ReportList reportType="weekly" />} />
          <Route path="/en/industry-reports/weekly" element={<ReportList reportType="weekly" />} />
          <Route path="/industry-reports/monthly" element={<ReportList reportType="monthly" />} />
          <Route path="/en/industry-reports/monthly" element={<ReportList reportType="monthly" />} />
          <Route path="/industry-reports/quarterly" element={<ReportList reportType="quarterly" />} />
          <Route path="/en/industry-reports/quarterly" element={<ReportList reportType="quarterly" />} />
          <Route path="/industry-reports/:id" element={<ArticleDetail type="report" />} />
          <Route path="/en/industry-reports/:id" element={<ArticleDetail type="report" />} />
          <Route path="/tools/:slug" element={<ToolDetail />} />
          <Route path="/en/tools/:slug" element={<ToolDetail />} />
          <Route path="/compare" element={<CompareTools />} />
          <Route path="/en/compare" element={<CompareTools />} />
          <Route path="/compare/:pair" element={<CompareDetail />} />
          <Route path="/en/compare/:pair" element={<CompareDetail />} />
          <Route path="/ai-tool-selection" element={<AIToolSelection />} />
          <Route path="/en/ai-tool-selection" element={<AIToolSelection />} />
          <Route path="/ai-tool-selection/:scene" element={<AIToolSelectionScene />} />
          <Route path="/en/ai-tool-selection/:scene" element={<AIToolSelectionScene />} />
          <Route path="/ai-tool-selection/:scene/:id" element={<ArticleDetail type="selection" />} />
          <Route path="/en/ai-tool-selection/:scene/:id" element={<ArticleDetail type="selection" />} />

          <Route path="/admin" element={<AdminLogin />} />
          <Route path="/admin/dashboard" element={<ProtectedRoute><AdminDashboard /></ProtectedRoute>} />
          <Route path="/admin/reports" element={<ProtectedRoute><AdminArticleList type="report" /></ProtectedRoute>} />
          <Route path="/admin/reports/new" element={<ProtectedRoute><AdminArticleEditor type="report" mode="new" /></ProtectedRoute>} />
          <Route path="/admin/reports/edit/:id" element={<ProtectedRoute><AdminArticleEditor type="report" mode="edit" /></ProtectedRoute>} />
          <Route path="/admin/reports/weekly" element={<ProtectedRoute><AdminArticleList type="report" reportType="weekly" /></ProtectedRoute>} />
          <Route path="/admin/reports/weekly/new" element={<ProtectedRoute><AdminArticleEditor type="report" mode="new" reportType="weekly" /></ProtectedRoute>} />
          <Route path="/admin/reports/weekly/edit/:id" element={<ProtectedRoute><AdminArticleEditor type="report" mode="edit" reportType="weekly" /></ProtectedRoute>} />
          <Route path="/admin/reports/monthly" element={<ProtectedRoute><AdminArticleList type="report" reportType="monthly" /></ProtectedRoute>} />
          <Route path="/admin/reports/monthly/new" element={<ProtectedRoute><AdminArticleEditor type="report" mode="new" reportType="monthly" /></ProtectedRoute>} />
          <Route path="/admin/reports/monthly/edit/:id" element={<ProtectedRoute><AdminArticleEditor type="report" mode="edit" reportType="monthly" /></ProtectedRoute>} />
          <Route path="/admin/reports/quarterly" element={<ProtectedRoute><AdminArticleList type="report" reportType="quarterly" /></ProtectedRoute>} />
          <Route path="/admin/reports/quarterly/new" element={<ProtectedRoute><AdminArticleEditor type="report" mode="new" reportType="quarterly" /></ProtectedRoute>} />
          <Route path="/admin/reports/quarterly/edit/:id" element={<ProtectedRoute><AdminArticleEditor type="report" mode="edit" reportType="quarterly" /></ProtectedRoute>} />
          <Route path="/admin/selections" element={<ProtectedRoute><AdminArticleList type="selection" /></ProtectedRoute>} />
          <Route path="/admin/selections/new" element={<ProtectedRoute><AdminArticleEditor type="selection" mode="new" /></ProtectedRoute>} />
          <Route path="/admin/selections/edit/:id" element={<ProtectedRoute><AdminArticleEditor type="selection" mode="edit" /></ProtectedRoute>} />
          <Route path="/admin/tools" element={<ProtectedRoute><AdminToolList /></ProtectedRoute>} />
          <Route path="/admin/tools/pending" element={<ProtectedRoute><AdminPendingToolList /></ProtectedRoute>} />
          <Route path="/admin/tools/new" element={<ProtectedRoute><AdminToolEditor mode="new" /></ProtectedRoute>} />
          <Route path="/admin/tools/:id/edit" element={<ProtectedRoute><AdminToolEditor mode="edit" /></ProtectedRoute>} />
          <Route path="/admin/reviews" element={<ProtectedRoute><AdminReviewList /></ProtectedRoute>} />
          <Route path="/admin/reviews/new" element={<ProtectedRoute><AdminReviewEditor mode="new" /></ProtectedRoute>} />
          <Route path="/admin/reviews/:id/edit" element={<ProtectedRoute><AdminReviewEditor mode="edit" /></ProtectedRoute>} />

          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Suspense>
    </BrowserRouter>
  )
}
