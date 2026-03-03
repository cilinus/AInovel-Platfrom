'use client';

import { useState, useCallback, useEffect } from 'react';
import { apiClient } from '../lib/api';
import type { EpisodeRatingStats } from '../types/rating';

export function useEpisodeRating(workId: string, episodeId: string) {
  const [ratingStats, setRatingStats] = useState<EpisodeRatingStats | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const fetchRating = useCallback(async () => {
    if (!workId || !episodeId) return;
    setLoading(true);
    setError(null);
    try {
      const result = await apiClient.get<EpisodeRatingStats>(
        `/works/${workId}/episodes/${episodeId}/ratings`,
      );
      setRatingStats(result);
    } catch (e) {
      setError(e as Error);
    } finally {
      setLoading(false);
    }
  }, [workId, episodeId]);

  useEffect(() => {
    fetchRating();
  }, [fetchRating]);

  return { ratingStats, loading, error, refetch: fetchRating };
}

export function useSubmitEpisodeRating() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const submitRating = useCallback(
    async (workId: string, episodeId: string, score: number): Promise<EpisodeRatingStats> => {
      setLoading(true);
      setError(null);
      try {
        const result = await apiClient.post<EpisodeRatingStats>(
          `/works/${workId}/episodes/${episodeId}/ratings`,
          { score },
        );
        return result;
      } catch (e) {
        setError(e as Error);
        throw e;
      } finally {
        setLoading(false);
      }
    },
    [],
  );

  return { submitRating, loading, error };
}
