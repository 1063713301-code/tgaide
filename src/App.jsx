import { lazy, Suspense } from 'react'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { isAdminAuthenticated } from './hooks/useAuth'

const Home = lazy(() => import('./pages/Home'))
const AllTools = lazy(() => import('./pages/AllTools'))
const IndustryReports = lazy(() => import('./pages/IndustryReports'))
const DailyBriefs = lazy(() => import('./pages/DailyBriefs'))
const ArticleDetail = lazy(() => import('./pages/ArticleDetail'))
const Reviews = lazy(() => import('./pages/Reviews'))
const AIToolSelection = lazy(() => import('./pages/AIToolSelection'))
const AIToolSelectionScene = lazy(() => import('./pages/AIToolSelectionScene'))
const CompareTools = lazy(() => import('./pages/CompareTools'))
const AdminLogin = lazy(() => import('./pages/admin/Login'))
const AdminDashboard = lazy(() => import('./pages/admin/Dashboard'))
const AdminArticleList = lazy(() => import('./pages/admin/ArticleList'))
const AdminArticleEditor = lazy(() => import('./pages/admin/ArticleEditor'))
const AdminToolList = lazy(() => import('./pages/admin/ToolList'))
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
      <Suspense fallback={<PageLoader />}>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/tools" element={<AllTools />} />
          <Route path="/reviews" element={<Reviews />} />
          <Route path="/industry-reports" element={<IndustryReports />} />
          <Route path="/industry-reports/:id" element={<ArticleDetail type="report" />} />
          <Route path="/daily-briefs" element={<DailyBriefs />} />
          <Route path="/daily-briefs/:id" element={<ArticleDetail type="brief" />} />
          <Route path="/compare" element={<CompareTools />} />
          <Route path="/ai-tool-selection" element={<AIToolSelection />} />
          <Route path="/ai-tool-selection/:scene" element={<AIToolSelectionScene />} />
          <Route path="/ai-tool-selection/:scene/:id" element={<ArticleDetail type="selection" />} />

          <Route path="/admin" element={<AdminLogin />} />
          <Route path="/admin/dashboard" element={<ProtectedRoute><AdminDashboard /></ProtectedRoute>} />
          <Route path="/admin/reports" element={<ProtectedRoute><AdminArticleList type="report" /></ProtectedRoute>} />
          <Route path="/admin/reports/new" element={<ProtectedRoute><AdminArticleEditor type="report" mode="new" /></ProtectedRoute>} />
          <Route path="/admin/reports/edit/:id" element={<ProtectedRoute><AdminArticleEditor type="report" mode="edit" /></ProtectedRoute>} />
          <Route path="/admin/briefs" element={<ProtectedRoute><AdminArticleList type="brief" /></ProtectedRoute>} />
          <Route path="/admin/briefs/new" element={<ProtectedRoute><AdminArticleEditor type="brief" mode="new" /></ProtectedRoute>} />
          <Route path="/admin/briefs/edit/:id" element={<ProtectedRoute><AdminArticleEditor type="brief" mode="edit" /></ProtectedRoute>} />
          <Route path="/admin/selections" element={<ProtectedRoute><AdminArticleList type="selection" /></ProtectedRoute>} />
          <Route path="/admin/selections/new" element={<ProtectedRoute><AdminArticleEditor type="selection" mode="new" /></ProtectedRoute>} />
          <Route path="/admin/selections/edit/:id" element={<ProtectedRoute><AdminArticleEditor type="selection" mode="edit" /></ProtectedRoute>} />
          <Route path="/admin/tools" element={<ProtectedRoute><AdminToolList /></ProtectedRoute>} />
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
