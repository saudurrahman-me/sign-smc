import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { ProtectedRoute, AdminRoute } from './lib/auth-guards';

// Public & User Pages
import { HomePage } from './pages/HomePage';
import { LoginPage } from './pages/auth/LoginPage';
import { ResetPasswordPage } from './pages/auth/ResetPasswordPage';
import { UnauthorizedPage } from './pages/auth/UnauthorizedPage';
import { MembershipStatusPage } from './pages/MembershipStatusPage';
import { CertificatesPage } from './pages/CertificatesPage';

// Admin System Pages
import { AdminLayout } from './pages/admin/AdminLayout';
import { AdminOverviewPage } from './pages/admin/AdminOverviewPage';
import { AdminEventsPage } from './pages/admin/AdminEventsPage';
import { AdminLeadershipPage } from './pages/admin/AdminLeadershipPage';
import { AdminApplicationsPage } from './pages/admin/AdminApplicationsPage';
import { AdminCertificatesPage } from './pages/admin/AdminCertificatesPage';
import { AdminContentSettingsPage } from './pages/admin/AdminContentSettingsPage';
import { AdminUsersPage } from './pages/admin/AdminUsersPage';
import { AdminAuditLogsPage } from './pages/admin/AdminAuditLogsPage';

export const App: React.FC = () => {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          {/* Public Single-Page Website & Portal Pages */}
          <Route path="/" element={<HomePage />} />
          <Route path="/certificates" element={<CertificatesPage />} />

          {/* Authentication & User Portal */}
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<LoginPage />} />
          <Route path="/reset-password" element={<ResetPasswordPage />} />
          <Route path="/unauthorized" element={<UnauthorizedPage />} />
          <Route
            path="/membership-status"
            element={
              <ProtectedRoute>
                <MembershipStatusPage />
              </ProtectedRoute>
            }
          />

          {/* Protected Role-Based Admin Dashboard */}
          <Route
            path="/admin"
            element={
              <AdminRoute allowedRoles={['super_admin', 'website_admin', 'event_manager']}>
                <AdminLayout />
              </AdminRoute>
            }
          >
            {/* Overview dashboard for all three roles */}
            <Route index element={<AdminOverviewPage />} />

            {/* Event Manager, Website Admin & Super Admin */}
            <Route
              path="events"
              element={
                <AdminRoute allowedRoles={['event_manager', 'website_admin', 'super_admin']}>
                  <AdminEventsPage />
                </AdminRoute>
              }
            />

            {/* Website Admin & Super Admin */}
            <Route
              path="leadership"
              element={
                <AdminRoute allowedRoles={['website_admin', 'super_admin']}>
                  <AdminLeadershipPage />
                </AdminRoute>
              }
            />
            <Route
              path="settings"
              element={
                <AdminRoute allowedRoles={['website_admin', 'super_admin']}>
                  <AdminContentSettingsPage />
                </AdminRoute>
              }
            />
            <Route
              path="content"
              element={
                <AdminRoute allowedRoles={['website_admin', 'super_admin']}>
                  <AdminContentSettingsPage />
                </AdminRoute>
              }
            />

            {/* Membership Applications: Website Admin & Super Admin */}
            <Route
              path="applications"
              element={
                <AdminRoute allowedRoles={['website_admin', 'super_admin']}>
                  <AdminApplicationsPage />
                </AdminRoute>
              }
            />

            {/* Certificates Management (Super Admin, Website Admin, Event Manager) */}
            <Route
              path="certificates"
              element={
                <AdminRoute allowedRoles={['super_admin', 'website_admin', 'event_manager']}>
                  <AdminCertificatesPage />
                </AdminRoute>
              }
            />
            <Route
              path="users"
              element={
                <AdminRoute allowedRoles={['super_admin']}>
                  <AdminUsersPage />
                </AdminRoute>
              }
            />
            <Route
              path="audit"
              element={
                <AdminRoute allowedRoles={['super_admin']}>
                  <AdminAuditLogsPage />
                </AdminRoute>
              }
            />
          </Route>

          {/* Catch-all redirect to public home */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
};

export default App;
