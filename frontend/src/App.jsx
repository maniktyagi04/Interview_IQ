import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';
import AdminRoute from './components/AdminRoute';

// Public pages
import LandingPage from './pages/LandingPage';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import ForgotPasswordPage from './pages/ForgotPasswordPage';

// User pages
import UserDashboard from './pages/user/UserDashboard';
import InterviewSetupPage from './pages/user/InterviewSetupPage';
import MockInterviewPage from './pages/user/MockInterviewPage';
import ReportsPage from './pages/user/ReportsPage';
import ReportDetailPage from './pages/user/ReportDetailPage';
import ResumeAnalyzerPage from './pages/user/ResumeAnalyzerPage';
import JobMatchPage from './pages/user/JobMatchPage';
import ProgressAnalyticsPage from './pages/user/ProgressAnalyticsPage';
import NotesPage from './pages/user/NotesPage';
import ProfilePage from './pages/user/ProfilePage';
import CodingAssessmentPage from './pages/user/CodingAssessmentPage';
import CodingDashboard from './pages/user/CodingDashboard';

// Admin pages
import AdminDashboard from './pages/admin/AdminDashboard';
import AdminUsersPage from './pages/admin/AdminUsersPage';
import AdminQuestionsPage from './pages/admin/AdminQuestionsPage';
import AdminReviewsPage from './pages/admin/AdminReviewsPage';
import AdminReviewDetailPage from './pages/admin/AdminReviewDetailPage';
import AdminAuditLogsPage from './pages/admin/AdminAuditLogsPage';

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          {/* Public Routes */}
          <Route path="/" element={<LandingPage />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />
          <Route path="/forgot-password" element={<ForgotPasswordPage />} />

          {/* User Protected Routes */}
          <Route path="/dashboard" element={<ProtectedRoute><UserDashboard /></ProtectedRoute>} />
          <Route path="/interview/setup" element={<ProtectedRoute><InterviewSetupPage /></ProtectedRoute>} />
          <Route path="/interview/:interviewId" element={<ProtectedRoute><MockInterviewPage /></ProtectedRoute>} />
          <Route path="/reports" element={<ProtectedRoute><ReportsPage /></ProtectedRoute>} />
          <Route path="/reports/:id" element={<ProtectedRoute><ReportDetailPage /></ProtectedRoute>} />
          <Route path="/resume" element={<ProtectedRoute><ResumeAnalyzerPage /></ProtectedRoute>} />
          <Route path="/job-match" element={<ProtectedRoute><JobMatchPage /></ProtectedRoute>} />
          <Route path="/analytics" element={<ProtectedRoute><ProgressAnalyticsPage /></ProtectedRoute>} />
          <Route path="/coding" element={<ProtectedRoute><CodingDashboard /></ProtectedRoute>} />
          <Route path="/coding/solve/:problemId" element={<ProtectedRoute><CodingAssessmentPage /></ProtectedRoute>} />
          <Route path="/notes" element={<ProtectedRoute><NotesPage /></ProtectedRoute>} />
          <Route path="/profile" element={<ProtectedRoute><ProfilePage /></ProtectedRoute>} />

          {/* Admin Protected Routes */}
          <Route path="/admin" element={<AdminRoute><AdminDashboard /></AdminRoute>} />
          <Route path="/admin/users" element={<AdminRoute><AdminUsersPage /></AdminRoute>} />
          <Route path="/admin/questions" element={<AdminRoute><AdminQuestionsPage /></AdminRoute>} />
          <Route path="/admin/reviews" element={<AdminRoute><AdminReviewsPage /></AdminRoute>} />
          <Route path="/admin/reviews/:id" element={<AdminRoute><AdminReviewDetailPage /></AdminRoute>} />
          <Route path="/admin/audit-logs" element={<AdminRoute><AdminAuditLogsPage /></AdminRoute>} />

          {/* Fallback */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
}
