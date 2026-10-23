import React, { Suspense, lazy } from 'react';
import { BrowserRouter, Routes, Route, Navigate, useLocation } from '@/delux/router';
import { AuthProvider, useAuth } from './context/AuthContext';
import { ThemeProvider } from './context/ThemeContext';
import './install/installPrompt';

// Load each screen on demand to reduce the initial JavaScript bundle.
const LoginPage = lazy(() => import('./pages/auth/LoginPage').then(m => ({ default: m.LoginPage })));
const ForgotPasswordPage = lazy(() => import('./pages/auth/ForgotPasswordPage').then(m => ({ default: m.ForgotPasswordPage })));
const ResetPasswordPage = lazy(() => import('./pages/auth/ResetPasswordPage').then(m => ({ default: m.ResetPasswordPage })));
const OnboardingPage = lazy(() => import('./pages/onboarding/OnboardingPage').then(m => ({ default: m.OnboardingPage })));
const AppShell = lazy(() => import('./components/layout/AppShell').then(m => ({ default: m.AppShell })));
const DashboardPage = lazy(() => import('./pages/dashboard/DashboardPage').then(m => ({ default: m.DashboardPage })));
const GoalsListPage = lazy(() => import('./pages/goals/GoalsListPage').then(m => ({ default: m.GoalsListPage })));
const NewGoalPage = lazy(() => import('./pages/goals/NewGoalPage').then(m => ({ default: m.NewGoalPage })));
const GoalDetailPage = lazy(() => import('./pages/goals/GoalDetailPage').then(m => ({ default: m.GoalDetailPage })));
const PlannerPage = lazy(() => import('./pages/planner/PlannerPage').then(m => ({ default: m.PlannerPage })));
const AssistantPage = lazy(() => import('./pages/assistant/AssistantPage').then(m => ({ default: m.AssistantPage })));
const ProfilePage = lazy(() => import('./pages/profile/ProfilePage').then(m => ({ default: m.ProfilePage })));
const SubscriptionPage = lazy(() => import('./pages/subscription/SubscriptionPage').then(m => ({ default: m.SubscriptionPage })));

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
          <Suspense fallback={
            <div className="min-h-screen bg-[#F7F8FA] dark:bg-[#0B0E14] flex items-center justify-center">
              <div className="w-8 h-8 border-2 border-[#356AE6]/20 border-t-[#356AE6] rounded-full animate-spin" />
            </div>
          }>
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
        </Suspense>
      </BrowserRouter>
    </AuthProvider>
  </ThemeProvider>
  );
}
