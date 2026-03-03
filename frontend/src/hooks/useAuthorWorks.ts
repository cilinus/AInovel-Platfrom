'use client';

import { useState, useCallback, useEffect } from 'react';
import { apiClient } from '../lib/api';
import { toImageUrl } from '../lib/utils';
import type { Work, WorkCreateRequest } from '../types/work';
import type { WorkStatus } from '../types/work';

interface ApiWork {
  _id: string;
  title: string;
  description?: string;
  coverImage?: string;
  backgroundImage?: string;
  genre: string;
  tags?: string[];
  subGenres?: string[];
  status?: string;
  contentType?: string;
  isAiGenerated?: boolean;
  isAIGenerated?: boolean;
  episodeCount?: number;
  tokenPrice?: number;
  freeEpisodeCount?: number;
  stats?: {
    viewCount?: number;
    likeCount?: number;
    bookmarkCount?: number;
    averageRating?: number;
    ratingCount?: number;
  };
  authorId?: { nickname: string; profileImage?: string } | string;
  createdAt?: string;
  updatedAt?: string;
}

function mapApiWork(api: ApiWork): Work {
  const authorName =
    typeof api.authorId === 'string'
      ? api.authorId
      : api.authorId?.nickname ?? '';

  return {
    id: api._id,
    authorId: authorName,
    title: api.title,
    synopsis: api.description ?? '',
    coverImageUrl: toImageUrl(api.coverImage),
    backgroundImageUrl: toImageUrl(api.backgroundImage),
    genre: api.genre as Work['genre'],
    subGenres: api.subGenres ?? [],
    tags: api.tags ?? [],
    status: (api.status as Work['status']) ?? 'DRAFT',
    isAiGenerated: api.isAIGenerated ?? api.isAiGenerated ?? false,
    contentType: (api.contentType as Work['contentType']) ?? 'HUMAN',
    totalEpisodes: api.episodeCount ?? 0,
    freeEpisodeCount: api.freeEpisodeCount ?? 3,
    pricePerEpisode: api.tokenPrice ?? 0,
    viewCount: api.stats?.viewCount ?? 0,
    likeCount: api.stats?.likeCount ?? 0,
    bookmarkCount: api.stats?.bookmarkCount ?? 0,
    rating: api.stats?.averageRating ?? 0,
    ratingCount: api.stats?.ratingCount ?? 0,
    createdAt: api.createdAt ?? '',
    updatedAt: api.updatedAt ?? '',
  };
}

export function useAuthorWorks() {
  const [works, setWorks] = useState<Work[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const fetchWorks = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const result = await apiClient.get<{ items: ApiWork[]; total: number }>('/author/works');
      setWorks(result.items.map(mapApiWork));
    } catch (e) {
      setError(e as Error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchWorks();
  }, [fetchWorks]);

  return { works, loading, error, refetch: fetchWorks };
}

export function useCreateWork() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const createWork = useCallback(async (data: WorkCreateRequest): Promise<Work> => {
    setLoading(true);
    setError(null);
    try {
      // Frontend -> Backend field name mapping
      const apiData: Record<string, unknown> = {
        title: data.title,
        description: data.synopsis,
        genre: data.genre,
      };
      if (data.subGenres) apiData.subGenres = data.subGenres;
      if (data.tags) apiData.tags = data.tags;
      if (data.freeEpisodeCount !== undefined) apiData.freeEpisodeCount = data.freeEpisodeCount;
      if (data.pricePerEpisode !== undefined) apiData.tokenPrice = data.pricePerEpisode;
      const result = await apiClient.post<ApiWork>('/works', apiData);
      return mapApiWork(result);
    } catch (e) {
      setError(e as Error);
      throw e;
    } finally {
      setLoading(false);
    }
  }, []);

  return { createWork, loading, error };
}

export function useUpdateWork() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const updateWork = useCallback(async (workId: string, data: Partial<WorkCreateRequest> & { status?: WorkStatus | string }) => {
    setLoading(true);
    setError(null);
    try {
      // Frontend -> Backend field name mapping
      const apiData: Record<string, unknown> = {};
      if (data.title !== undefined) apiData.title = data.title;
      if (data.synopsis !== undefined) apiData.description = data.synopsis;
      if (data.genre !== undefined) apiData.genre = data.genre;
      if (data.subGenres !== undefined) apiData.subGenres = data.subGenres;
      if (data.tags !== undefined) apiData.tags = data.tags;
      if (data.freeEpisodeCount !== undefined) apiData.freeEpisodeCount = data.freeEpisodeCount;
      if (data.pricePerEpisode !== undefined) apiData.tokenPrice = data.pricePerEpisode;
      if (data.status !== undefined) apiData.status = data.status;
      const result = await apiClient.patch<ApiWork>(`/works/${workId}`, apiData);
      return mapApiWork(result);
    } catch (e) {
      setError(e as Error);
      throw e;
    } finally {
      setLoading(false);
    }
  }, []);

  return { updateWork, loading, error };
}

export function useUploadCover() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const uploadCover = useCallback(async (workId: string, file: File) => {
    setLoading(true);
    setError(null);
    try {
      const result = await apiClient.uploadFile<any>(`/works/${workId}/cover`, file, 'coverImage');
      return result;
    } catch (e) {
      setError(e as Error);
      throw e;
    } finally {
      setLoading(false);
    }
  }, []);

  return { uploadCover, loading, error };
}

export function useUploadBackground() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const uploadBackground = useCallback(async (workId: string, file: File) => {
    setLoading(true);
    setError(null);
    try {
      const result = await apiClient.uploadFile<any>(`/works/${workId}/background`, file, 'backgroundImage');
      return result;
    } catch (e) {
      setError(e as Error);
      throw e;
    } finally {
      setLoading(false);
    }
  }, []);

  return { uploadBackground, loading, error };
}

export function useCreateEpisode() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const createEpisode = useCallback(async (workId: string, data: {
    title: string;
    content: string;
    isFree?: boolean;
    price?: number;
    authorNote?: string;
    publishNow?: boolean;
    episodeNumber?: number;
  }) => {
    setLoading(true);
    setError(null);
    try {
      const result = await apiClient.post<any>(`/works/${workId}/episodes`, data);
      return result;
    } catch (e) {
      setError(e as Error);
      throw e;
    } finally {
      setLoading(false);
    }
  }, []);

  return { createEpisode, loading, error };
}

export function useUpdateEpisode() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const updateEpisode = useCallback(async (workId: string, episodeId: string, data: {
    title?: string;
    content?: string;
    isFree?: boolean;
    price?: number;
    authorNote?: string;
    publishNow?: boolean;
  }) => {
    setLoading(true);
    setError(null);
    try {
      const result = await apiClient.patch<any>(`/works/${workId}/episodes/${episodeId}`, data);
      return result;
    } catch (e) {
      setError(e as Error);
      throw e;
    } finally {
      setLoading(false);
    }
  }, []);

  return { updateEpisode, loading, error };
}

export interface EpisodeOrderItem {
  episodeId: string;
  episodeNumber: number;
}

export function useReorderEpisodes() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const reorderEpisodes = useCallback(async (workId: string, orders: EpisodeOrderItem[]) => {
    setLoading(true);
    setError(null);
    try {
      const result = await apiClient.patch<{ success: boolean }>(
        `/works/${workId}/episodes/reorder`,
        { orders },
      );
      return result;
    } catch (e) {
      setError(e as Error);
      throw e;
    } finally {
      setLoading(false);
    }
  }, []);

  return { reorderEpisodes, loading, error };
}

export function useAuthorEpisodes(workId: string) {
  const [episodes, setEpisodes] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const fetchEpisodes = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const result = await apiClient.get<{ items: any[]; total: number }>(
        `/works/${workId}/episodes/author`,
      );
      setEpisodes(result.items);
    } catch (e) {
      setError(e as Error);
    } finally {
      setLoading(false);
    }
  }, [workId]);

  useEffect(() => {
    if (workId) {
      fetchEpisodes();
    }
  }, [workId, fetchEpisodes]);

  return { episodes, loading, error, refetch: fetchEpisodes };
}
