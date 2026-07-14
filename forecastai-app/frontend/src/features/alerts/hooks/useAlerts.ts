import { useState, useEffect, useCallback } from 'react';
import { alertsApi } from '../../../services/feature-services';
import { Alert } from '../../../shared/types/features';

function hasToken(): boolean {
  return !!localStorage.getItem('forecastai_token');
}

export function useAlerts() {
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isLoading, setIsLoading] = useState(false);

  const fetchAlerts = useCallback(async (filters?: Record<string, string>) => {
    if (!hasToken()) return;
    setIsLoading(true);
    try {
      const res = await alertsApi.getAll(filters);
      setAlerts(res.data.data || []);
    } catch { /* ignore */ }
    setIsLoading(false);
  }, []);

  const fetchUnreadCount = useCallback(async () => {
    if (!hasToken()) return;
    try {
      const res = await alertsApi.getUnreadCount();
      setUnreadCount(res.data.count || 0);
    } catch { /* ignore */ }
  }, []);

  const acknowledge = useCallback(async (id: string) => {
    await alertsApi.acknowledge(id);
    setAlerts(prev => prev.map(a => a.id === id ? { ...a, acknowledged: true } : a));
    setUnreadCount(prev => Math.max(0, prev - 1));
  }, []);

  const acknowledgeAll = useCallback(async () => {
    await alertsApi.acknowledgeAll();
    setAlerts(prev => prev.map(a => ({ ...a, acknowledged: true })));
    setUnreadCount(0);
  }, []);

  useEffect(() => { fetchAlerts(); fetchUnreadCount(); }, [fetchAlerts, fetchUnreadCount]);

  return { alerts, unreadCount, isLoading, fetchAlerts, acknowledge, acknowledgeAll, fetchUnreadCount };
}
