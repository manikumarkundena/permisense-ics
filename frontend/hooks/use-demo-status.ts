'use client';

import { useState, useEffect, useCallback } from 'react';
import type { DemoStatusResponse } from '@/lib/types';
import { apiClient } from '@/lib/api';

export function useDemoStatus(pollingIntervalMs = 1500) {
  const [data, setData] = useState<DemoStatusResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchStatus = useCallback(async () => {
    try {
      const res = await apiClient.getDemoStatus();
      setData(res);
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
    data,
    loading,
    error,
    refetch: fetchStatus,
  };
}
