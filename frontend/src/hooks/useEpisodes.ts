'use client';

import { useState, useCallback, useEffect } from 'react';
import { apiClient } from '../lib/api';
import type { Episode } from '../types/episode';

// Backend episode schema -> frontend Episode mapping
interface ApiEpisode {
  _id: string;
  workId: string;
  episodeNumber: number;
  title: string;
  content?: string;
  wordCount?: number;
  price?: number;
  isFree?: boolean;
  isPublished?: boolean;
  publishedAt?: string;
  stats?: {
    viewCount?: number;
    likeCount?: number;
    commentCount?: number;
  };
  authorNote?: string;
  aiMetadata?: Episode['aiMetadata'];
  createdAt?: string;
}

interface ApiEpisodeListResponse {
  items: ApiEpisode[];
  total: number;
  page: number;
  limit: number;
}

function mapApiEpisode(api: ApiEpisode): Episode {
  return {
    id: api._id,
    workId: api.workId,
    number: api.episodeNumber,
    title: api.title,
    content: api.content ?? '',
    wordCount: api.wordCount ?? 0,
    price: api.price ?? 0,
    isFree: api.isFree ?? false,
    isPublished: api.isPublished ?? false,
    publishedAt: api.publishedAt,
    viewCount: api.stats?.viewCount ?? 0,
    likeCount: api.stats?.likeCount ?? 0,
    commentCount: api.stats?.commentCount ?? 0,
    authorNote: api.authorNote,
    aiMetadata: api.aiMetadata,
    createdAt: api.createdAt ?? '',
  };
}

export function useEpisodes(workId: string) {
  const [episodes, setEpisodes] = useState<Episode[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const fetchEpisodes = useCallback(async () => {
    if (!workId) return;
    setLoading(true);
    setError(null);
    try {
      const result = await apiClient.get<ApiEpisodeListResponse>(
        `/works/${workId}/episodes`,
      );
      setEpisodes((result.items ?? []).map(mapApiEpisode));
    } catch (e) {
      setError(e as Error);
    } finally {
      setLoading(false);
    }
  }, [workId]);

  useEffect(() => {
    fetchEpisodes();
  }, [fetchEpisodes]);

  return { episodes, loading, error, refetch: fetchEpisodes };
}

export function useEpisode(workId: string, episodeId: string) {
  const [episode, setEpisode] = useState<Episode | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const fetchEpisode = useCallback(async () => {
    if (!workId || !episodeId) return;
    setLoading(true);
    setError(null);
    try {
      const result = await apiClient.get<ApiEpisode>(
        `/works/${workId}/episodes/${episodeId}`,
      );
      setEpisode(mapApiEpisode(result));
    } catch (e) {
      setError(e as Error);
    } finally {
      setLoading(false);
    }
  }, [workId, episodeId]);

  useEffect(() => {
    fetchEpisode();
  }, [fetchEpisode]);

  return { episode, loading, error };
}

interface EpisodeNavItem {
  id: string;
  number: number;
  title: string;
}

interface EpisodeNavigation {
  prev: EpisodeNavItem | null;
  next: EpisodeNavItem | null;
  loading: boolean;
}

export function useEpisodeNavigation(
  workId: string,
  episodeId: string,
): EpisodeNavigation {
  const [prev, setPrev] = useState<EpisodeNavItem | null>(null);
  const [next, setNext] = useState<EpisodeNavItem | null>(null);
  const [loading, setLoading] = useState(false);

  const fetchNavigation = useCallback(async () => {
    if (!workId || !episodeId) return;
    setLoading(true);
    try {
      const result = await apiClient.get<{
        prev: EpisodeNavItem | null;
        next: EpisodeNavItem | null;
      }>(`/works/${workId}/episodes/${episodeId}/navigation`);
      setPrev(result.prev);
      setNext(result.next);
    } catch {
      // silent fail - buttons stay disabled
    } finally {
      setLoading(false);
    }
  }, [workId, episodeId]);

  useEffect(() => {
    fetchNavigation();
  }, [fetchNavigation]);

  return { prev, next, loading };
}