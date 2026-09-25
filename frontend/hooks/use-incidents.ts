'use client';

import { useState, useEffect, useCallback } from 'react';
import type { IncidentSummary } from '@/lib/types';
import { apiClient } from '@/lib/api';

export function useIncidents(pollingIntervalMs = 2000) {
  const [incidents, setIncidents] = useState<IncidentSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchIncidents = useCallback(async () => {
    try {
      const res = await apiClient.getIncidents();
      setIncidents(res);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Backend unavailable');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchIncidents();
    const interval = setInterval(fetchIncidents, pollingIntervalMs);
    return () => clearInterval(interval);
  }, [fetchIncidents, pollingIntervalMs]);

  return {
    incidents,
    loading,
    error,
    refetch: fetchIncidents,
  };
}
