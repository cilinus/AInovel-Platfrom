'use client';

import { useState, useCallback, useEffect } from 'react';
import { apiClient } from '../lib/api';
import type { RatingStats } from '../types/rating';

export function useRating(workId: string) {
  const [ratingStats, setRatingStats] = useState<RatingStats | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const fetchRating = useCallback(async () => {
    if (!workId) return;
    setLoading(true);
    setError(null);
    try {
      const result = await apiClient.get<RatingStats>(`/works/${workId}/ratings`);
      setRatingStats(result);
    } catch (e) {
      setError(e as Error);
    } finally {
      setLoading(false);
    }
  }, [workId]);

  useEffect(() => {
    fetchRating();
  }, [fetchRating]);

  return { ratingStats, loading, error, refetch: fetchRating };
}

export function useSubmitRating() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const submitRating = useCallback(async (workId: string, score: number): Promise<RatingStats> => {
    setLoading(true);
    setError(null);
    try {
      const result = await apiClient.post<RatingStats>(`/works/${workId}/ratings`, { score });
      return result;
    } catch (e) {
      setError(e as Error);
      throw e;
    } finally {
      setLoading(false);
    }
  }, []);

  return { submitRating, loading, error };
}
