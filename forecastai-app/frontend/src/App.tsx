import React from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import Navbar from './components/layout/Navbar';
import Footer from './components/layout/Footer';
import FloatingStats from './components/layout/FloatingStats';
import ErrorBoundary from './components/common/ErrorBoundary';
import { useAppStore } from './store/appStore';
import Dashboard from './pages/Dashboard';
import Forecast from './pages/Forecast';
import Budget from './pages/Budget';
import Analytics from './pages/Analytics';

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

function PageRouter() {
  const currentPage = useAppStore((s) => s.currentPage);

  switch (currentPage) {
    case 'dashboard':
      return <Dashboard />;
    case 'forecast':
      return <Forecast />;
    case 'budget':
      return <Budget />;
    case 'analytics':
      return <Analytics />;
    default:
      return <Dashboard />;
  }
}

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <ErrorBoundary>
        <div className="relative min-h-screen" style={{ background: 'var(--bg-main)', color: 'var(--text-secondary)' }}>
          <div className="relative z-10">
            <Navbar />
            <main className="min-h-screen">
              <PageRouter />
            </main>
            <Footer />
            <FloatingStats />
          </div>
        </div>
      </ErrorBoundary>
    </QueryClientProvider>
  );
}
