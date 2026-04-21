import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import Home from './pages/Home'
import AllTools from './pages/AllTools'
import IndustryReports from './pages/IndustryReports'
import DailyBriefs from './pages/DailyBriefs'
import ArticleDetail from './pages/ArticleDetail'
import Reviews from './pages/Reviews'
import AdminLogin from './pages/admin/Login'
import AdminDashboard from './pages/admin/Dashboard'
import AdminArticleList from './pages/admin/ArticleList'
import AdminArticleEditor from './pages/admin/ArticleEditor'
import AdminToolList from './pages/admin/ToolList'
import AdminToolEditor from './pages/admin/ToolEditor'
import AdminReviewList from './pages/admin/ReviewList'
import CompareTools from './pages/CompareTools'
import AdminReviewEditor from './pages/admin/ReviewEditor'
import { isAdminAuthenticated } from './hooks/useAuth'

function ProtectedRoute({ children }) {
  if (!isAdminAuthenticated()) return <Navigate to="/admin" replace />
  return children
}

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/tools" element={<AllTools />} />
        <Route path="/reviews" element={<Reviews />} />
        <Route path="/industry-reports" element={<IndustryReports />} />
        <Route path="/industry-reports/:id" element={<ArticleDetail type="report" />} />
        <Route path="/daily-briefs" element={<DailyBriefs />} />
        <Route path="/daily-briefs/:id" element={<ArticleDetail type="brief" />} />

        <Route path="/compare" element={<CompareTools />} />

        <Route path="/admin" element={<AdminLogin />} />
        <Route path="/admin/dashboard" element={<ProtectedRoute><AdminDashboard /></ProtectedRoute>} />
        <Route path="/admin/reports" element={<ProtectedRoute><AdminArticleList type="report" /></ProtectedRoute>} />
        <Route path="/admin/reports/new" element={<ProtectedRoute><AdminArticleEditor type="report" mode="new" /></ProtectedRoute>} />
        <Route path="/admin/reports/edit/:id" element={<ProtectedRoute><AdminArticleEditor type="report" mode="edit" /></ProtectedRoute>} />
        <Route path="/admin/briefs" element={<ProtectedRoute><AdminArticleList type="brief" /></ProtectedRoute>} />
        <Route path="/admin/briefs/new" element={<ProtectedRoute><AdminArticleEditor type="brief" mode="new" /></ProtectedRoute>} />
        <Route path="/admin/briefs/edit/:id" element={<ProtectedRoute><AdminArticleEditor type="brief" mode="edit" /></ProtectedRoute>} />
        <Route path="/admin/tools" element={<ProtectedRoute><AdminToolList /></ProtectedRoute>} />
        <Route path="/admin/tools/new" element={<ProtectedRoute><AdminToolEditor mode="new" /></ProtectedRoute>} />
        <Route path="/admin/tools/:id/edit" element={<ProtectedRoute><AdminToolEditor mode="edit" /></ProtectedRoute>} />
        <Route path="/admin/reviews" element={<ProtectedRoute><AdminReviewList /></ProtectedRoute>} />
        <Route path="/admin/reviews/new" element={<ProtectedRoute><AdminReviewEditor mode="new" /></ProtectedRoute>} />
        <Route path="/admin/reviews/:id/edit" element={<ProtectedRoute><AdminReviewEditor mode="edit" /></ProtectedRoute>} />

        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  )
}
