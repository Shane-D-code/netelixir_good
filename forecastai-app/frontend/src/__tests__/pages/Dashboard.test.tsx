import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import Dashboard from '../../features/dashboard/components/DashboardPage';

const queryClient = new QueryClient({
  defaultOptions: { queries: { retry: false } },
});

const wrapper = ({ children }: { children: React.ReactNode }) => (
  <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
);

describe('Dashboard', () => {
  it('renders the dashboard heading', () => {
    render(<Dashboard />, { wrapper });
    expect(screen.getByText(/ForecastAI/i)).toBeInTheDocument();
  });

  it('renders the hero section', () => {
    render(<Dashboard />, { wrapper });
    expect(screen.getByText(/AI-Powered Forecasting/i)).toBeInTheDocument();
  });
});
