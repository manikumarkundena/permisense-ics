'use client';

import { useState, useEffect, useCallback } from 'react';
import type { SystemStatusResponse } from '@/lib/types';
import { apiClient } from '@/lib/api';

export function useSystemStatus(pollingIntervalMs = 5000) {
  const [status, setStatus] = useState<SystemStatusResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchStatus = useCallback(async () => {
    try {
      const res = await apiClient.getSystemStatus();
      setStatus(res);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Backend unavailable');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchStatus();
    const interval = setInterval(fetchStatus, pollingIntervalMs);
    return () => clearInterval(interval);
  }, [fetchStatus, pollingIntervalMs]);

  return {
    status,
    loading,
    error,
    refetch: fetchStatus,
  };
}
