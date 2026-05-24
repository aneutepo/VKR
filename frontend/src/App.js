import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import Layout from './components/layout/Layout';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import TeacherDashboard from './pages/teacher/TeacherDashboard';
import AnalyticsPage from './pages/teacher/AnalyticsPage';
import StudentsPage from './pages/teacher/StudentsPage';
import CoursesPage from './pages/teacher/CoursesPage';
import StudentDashboard from './pages/student/StudentDashboard';
import StudentCoursesPage from './pages/student/StudentCoursesPage';
import StudentStatsPage from './pages/student/StudentStatsPage';
import ProfilePage from './pages/student/ProfilePage';
import AdminDashboard from './pages/admin/AdminDashboard';
import AdminUsersPage from './pages/admin/AdminUsersPage';
import AdminSettingsPage from './pages/admin/AdminSettingsPage';
import TestEditorPage from './pages/teacher/TestEditorPage';

function PrivateRoute({ children, roles }) {
  const { user, loading } = useAuth();
  if (loading) return <div style={{ padding: 40, textAlign: 'center' }}>Загрузка...</div>;
  if (!user) return <Navigate to="/login" replace />;
  if (roles && !roles.includes(user.role)) return <Navigate to="/login" replace />;
  return <Layout>{children}</Layout>;
}

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />

          <Route path="/teacher" element={<PrivateRoute roles={['teacher']}><TeacherDashboard /></PrivateRoute>} />
          <Route path="/teacher/students" element={<PrivateRoute roles={['teacher']}><StudentsPage /></PrivateRoute>} />
          <Route path="/teacher/courses" element={<PrivateRoute roles={['teacher']}><CoursesPage /></PrivateRoute>} />
          <Route path="/teacher/analytics" element={<PrivateRoute roles={['teacher']}><AnalyticsPage /></PrivateRoute>} />
          <Route path="/teacher/tests/:testId" element={<PrivateRoute roles={['teacher','admin']}><TestEditorPage /></PrivateRoute>} />

          <Route path="/admin" element={<PrivateRoute roles={['admin']}><AdminDashboard /></PrivateRoute>} />
          <Route path="/admin/users" element={<PrivateRoute roles={['admin']}><AdminUsersPage /></PrivateRoute>} />
          <Route path="/admin/courses" element={<PrivateRoute roles={['admin']}><CoursesPage /></PrivateRoute>} />
          <Route path="/admin/settings" element={<PrivateRoute roles={['admin']}><AdminSettingsPage /></PrivateRoute>} />

          <Route path="/student" element={<PrivateRoute roles={['student']}><StudentDashboard /></PrivateRoute>} />
          <Route path="/student/courses" element={<PrivateRoute roles={['student']}><StudentCoursesPage /></PrivateRoute>} />
          <Route path="/student/stats" element={<PrivateRoute roles={['student']}><StudentStatsPage /></PrivateRoute>} />
          <Route path="/student/profile" element={<PrivateRoute roles={['student']}><ProfilePage /></PrivateRoute>} />

          <Route path="/" element={<Navigate to="/login" replace />} />
          <Route path="*" element={<Navigate to="/login" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;