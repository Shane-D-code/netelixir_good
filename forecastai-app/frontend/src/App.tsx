import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import Navbar from './shared/components/layout/Navbar';
import Footer from './shared/components/layout/Footer';
import FloatingStats from './shared/components/layout/FloatingStats';
import ErrorBoundary from './shared/components/ui/ErrorBoundary';
import ProtectedRoute from './features/auth/components/ProtectedRoute';
import LoginPage from './features/auth/components/LoginPage';
import RegisterPage from './features/auth/components/RegisterPage';
import Dashboard from './features/dashboard/components/DashboardPage';
import Forecast from './features/forecast/components/ForecastPage';
import Budget from './features/budget/components/BudgetPage';
import Analytics from './features/analytics/components/AnalyticsPage';
import CreativeFatiguePage from './features/analytics/components/CreativeFatiguePage';
import PlannerPage from './features/planner/components/PlannerPage';
import AlertsPage from './features/alerts/components/AlertsPage';
import TimeMachinePage from './features/time-machine/components/TimeMachinePage';
import ExecutiveSummaryPage from './features/reports/components/ExecutiveSummaryPage';
import NotFoundPage from './shared/components/ui/NotFoundPage';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 2,
      staleTime: 30000,
      refetchOnWindowFocus: false,
    },
    mutations: {
      retry: 1,
    },
  },
});

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <ErrorBoundary>
          <div className="relative min-h-screen" style={{ background: 'var(--bg-main)', color: 'var(--text-secondary)' }}>
            <div className="relative z-10">
              <Navbar />
              <main className="min-h-screen">
                <Routes>
                  <Route path="/login" element={<LoginPage />} />
                  <Route path="/register" element={<RegisterPage />} />
                  <Route path="/" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
                  <Route path="/forecast" element={<ProtectedRoute><Forecast /></ProtectedRoute>} />
                  <Route path="/budget" element={<ProtectedRoute><Budget /></ProtectedRoute>} />
                  <Route path="/analytics" element={<ProtectedRoute><Analytics /></ProtectedRoute>} />
                  <Route path="/planner" element={<ProtectedRoute><PlannerPage /></ProtectedRoute>} />
                  <Route path="/creative-fatigue" element={<ProtectedRoute><CreativeFatiguePage /></ProtectedRoute>} />
                  <Route path="/alerts" element={<ProtectedRoute><AlertsPage /></ProtectedRoute>} />
                  <Route path="/time-machine" element={<ProtectedRoute><TimeMachinePage /></ProtectedRoute>} />
                  <Route path="/reports" element={<ProtectedRoute><ExecutiveSummaryPage /></ProtectedRoute>} />
                  <Route path="*" element={<NotFoundPage />} />
                </Routes>
              </main>
              <Footer />
              <FloatingStats />
            </div>
          </div>
        </ErrorBoundary>
      </BrowserRouter>
    </QueryClientProvider>
  );
}
