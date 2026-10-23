import React from 'react';
import { BrowserRouter, Routes, Route, Navigate, useLocation } from '@/delux/router';
import { AuthProvider, useAuth } from './context/AuthContext';
import { ThemeProvider } from './context/ThemeContext';
import './install/installPrompt';

// Eagerly load app screens to keep tab navigation responsive after startup.
import { LoginPage } from './pages/auth/LoginPage';
import { ForgotPasswordPage } from './pages/auth/ForgotPasswordPage';
import { ResetPasswordPage } from './pages/auth/ResetPasswordPage';
import { OnboardingPage } from './pages/onboarding/OnboardingPage';
import { AppShell } from './components/layout/AppShell';
import { DashboardPage } from './pages/dashboard/DashboardPage';
import { GoalsListPage } from './pages/goals/GoalsListPage';
import { NewGoalPage } from './pages/goals/NewGoalPage';
import { GoalDetailPage } from './pages/goals/GoalDetailPage';
import { PlannerPage } from './pages/planner/PlannerPage';
import { AssistantPage } from './pages/assistant/AssistantPage';
import { ProfilePage } from './pages/profile/ProfilePage';
import { SubscriptionPage } from './pages/subscription/SubscriptionPage';

const ProtectedRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div className="min-h-screen bg-[#F7F8FA] dark:bg-[#0B0E14] flex items-center justify-center transition-colors">
        <div className="w-8 h-8 border-2 border-[#356AE6]/20 border-t-[#356AE6] rounded-full animate-spin" />
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/cadastro" replace />;
  }

  if (!user.onboarding_completed && location.pathname !== '/onboarding') {
    return <Navigate to="/onboarding" replace />;
  }

  if (user.onboarding_completed && location.pathname === '/onboarding') {
    return <Navigate to="/app/inicio" replace />;
  }

  return <>{children}</>;
};

const PublicRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen bg-[#F7F8FA] dark:bg-[#0B0E14] flex items-center justify-center transition-colors">
        <div className="w-8 h-8 border-2 border-[#356AE6]/20 border-t-[#356AE6] rounded-full animate-spin" />
      </div>
    );
  }

  if (user) {
    return <Navigate to={user.onboarding_completed ? '/app/inicio' : '/onboarding'} replace />;
  }

  return <>{children}</>;
};

export default function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <BrowserRouter>
          <Routes>
          {/* Public Auth Routes */}
          <Route
            path="/login"
            element={
              <PublicRoute>
                <LoginPage />
              </PublicRoute>
            }
          />
          <Route path="/comecar" element={<Navigate to="/cadastro" replace />} />
          <Route
            path="/cadastro"
            element={
              <PublicRoute>
                <LoginPage />
              </PublicRoute>
            }
          />
          <Route path="/recuperar-senha" element={<ForgotPasswordPage />} />
          <Route path="/redefinir-senha" element={<ResetPasswordPage />} />

          {/* Onboarding Flow */}
          <Route
            path="/onboarding"
            element={
              <ProtectedRoute>
                <OnboardingPage />
              </ProtectedRoute>
            }
          />

          {/* Standalone Subscription Route */}
          <Route
            path="/assinatura"
            element={
              <ProtectedRoute>
                <SubscriptionPage />
              </ProtectedRoute>
            }
          />

          {/* Protected App Routes with Shell */}
          <Route
            path="/app"
            element={
              <ProtectedRoute>
                <AppShell />
              </ProtectedRoute>
            }
          >
            <Route index element={<Navigate to="/app/inicio" replace />} />
            <Route path="inicio" element={<DashboardPage />} />
            <Route path="objetivos" element={<GoalsListPage />} />
            <Route path="objetivos/novo" element={<NewGoalPage />} />
            <Route path="objetivos/:id" element={<GoalDetailPage />} />
            <Route path="planejamento" element={<PlannerPage />} />
            <Route path="assistente" element={<AssistantPage />} />
            <Route path="perfil" element={<ProfilePage />} />
            <Route path="configuracoes" element={<Navigate to="/app/perfil" replace />} />
          </Route>

          {/* Root redirect */}
          <Route path="/" element={<Navigate to="/app/inicio" replace />} />
          {/* Catch-all redirect */}
          <Route path="*" element={<Navigate to="/app/inicio" replace />} />
        </Routes>
</BrowserRouter>
    </AuthProvider>
  </ThemeProvider>
  );
}
