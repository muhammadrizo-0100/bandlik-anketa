import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { ToastProvider } from './context/ToastContext';
import { LoginPage } from './pages/LoginPage';
import { DashboardPage } from './pages/DashboardPage';
import { CitizensPage } from './pages/CitizensPage';
import { NewSurveyPage } from './pages/NewSurveyPage';
import { SurveysPage } from './pages/SurveysPage';
import { ReviewQueuePage } from './pages/ReviewQueuePage';
import { MahallasManagementPage } from './pages/MahallasManagementPage';
import { UsersManagementPage } from './pages/UsersManagementPage';
import { UserDetailPage } from './pages/UserDetailPage';
import { PublicSurveyPage } from './pages/PublicSurveyPage';

import { AreaFilterProvider } from './context/AreaFilterContext';
import { SidebarProvider } from './context/SidebarContext';
import { DashboardSkeleton } from './components/ui/DashboardSkeleton';

// Himoyalangan marshrut (Protected Route)
const ProtectedRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return <DashboardSkeleton />;
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  return <>{children}</>;
};

// Asosiy sahifa yo'naltiruvchisi (Tizimga kirmaganlar to'g'ridan-to'g'ri /anketa ga tushadi)
const HomeRoute: React.FC = () => {
  const { isAuthenticated, isLoading } = useAuth();
  if (isLoading) {
    return <DashboardSkeleton />;
  }
  return isAuthenticated ? <Navigate to="/dashboard" replace /> : <Navigate to="/anketa" replace />;
};

export const App: React.FC = () => {
  return (
    <BrowserRouter>
      <ToastProvider>
        <AuthProvider>
          <AreaFilterProvider>
            <SidebarProvider>
              <Routes>
                {/* Ochiq marshrutlar (Aholi va Xodimlar uchun) */}
                <Route path="/" element={<HomeRoute />} />
                <Route path="/login" element={<LoginPage />} />
                <Route path="/anketa" element={<PublicSurveyPage />} />
                <Route path="/ariza" element={<PublicSurveyPage />} />

          {/* Himoyalangan marshrutlar */}
          <Route
            path="/dashboard"
            element={
              <ProtectedRoute>
                <DashboardPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/citizens"
            element={
              <ProtectedRoute>
                <CitizensPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/new-survey"
            element={
              <ProtectedRoute>
                <NewSurveyPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/surveys"
            element={
              <ProtectedRoute>
                <SurveysPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/review-queue"
            element={
              <ProtectedRoute>
                <ReviewQueuePage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/mahallas"
            element={
              <ProtectedRoute>
                <MahallasManagementPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/users"
            element={
              <ProtectedRoute>
                <UsersManagementPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/users/:id"
            element={
              <ProtectedRoute>
                <UserDetailPage />
              </ProtectedRoute>
            }
          />

          {/* Default redirect */}
          <Route path="*" element={<Navigate to="/dashboard" replace />} />
        </Routes>
            </SidebarProvider>
          </AreaFilterProvider>
        </AuthProvider>
      </ToastProvider>
    </BrowserRouter>
  );
};

export default App;
