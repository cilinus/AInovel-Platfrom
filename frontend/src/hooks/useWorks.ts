'use client';

import { useState, useCallback, useEffect, useMemo } from 'react';
import { apiClient } from '../lib/api';
import { toImageUrl } from '../lib/utils';
import type { Work } from '../types/work';

// ---------------------------------------------------------------------------
// Internal API response types (shape returned by backend)
// ---------------------------------------------------------------------------

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
  isLiked?: boolean;
  authorId?: { nickname: string; profileImage?: string } | string;
  createdAt?: string;
  updatedAt?: string;
}

interface ApiWorkListResponse {
  items: ApiWork[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

// ---------------------------------------------------------------------------
// Public response types
// ---------------------------------------------------------------------------

export interface WorkListResponse {
  items: Work[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface UseWorksParams {
  genre?: string;
  sort?: string;
  status?: string;
  contentType?: string;
  search?: string;
  page?: number;
  limit?: number;
}

// ---------------------------------------------------------------------------
// API → Work mapper
// ---------------------------------------------------------------------------

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
    isLiked: api.isLiked,
    bookmarkCount: api.stats?.bookmarkCount ?? 0,
    rating: api.stats?.averageRating ?? 0,
    ratingCount: api.stats?.ratingCount ?? 0,
    createdAt: api.createdAt ?? '',
    updatedAt: api.updatedAt ?? '',
  };
}

// ---------------------------------------------------------------------------
// Hooks
// ---------------------------------------------------------------------------

export function useWorks(params?: UseWorksParams) {
  const [data, setData] = useState<WorkListResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const [page, setPage] = useState(params?.page ?? 1);

  const paramsKey = useMemo(
    () => JSON.stringify(params ?? {}),
    [params?.genre, params?.sort, params?.status, params?.contentType, params?.search, params?.page, params?.limit],
  );

  const fetchWorks = useCallback(
    async (pageNum?: number) => {
      setLoading(true);
      setError(null);
      try {
        const parsed = JSON.parse(paramsKey);
        const requestPage = pageNum ?? parsed.page ?? 1;
        const apiResult = await apiClient.get<ApiWorkListResponse>('/works', {
          ...parsed,
          page: requestPage,
        });
        const mapped: WorkListResponse = {
          ...apiResult,
          items: apiResult.items.map(mapApiWork),
        };
        if (requestPage === 1 || pageNum !== undefined) {
          setData(mapped);
        } else {
          setData((prev) =>
            prev
              ? { ...mapped, items: [...prev.items, ...mapped.items] }
              : mapped,
          );
        }
        setPage(requestPage);
      } catch (e) {
        setError(e as Error);
      } finally {
        setLoading(false);
      }
    },
    [paramsKey],
  );

  useEffect(() => {
    fetchWorks();
  }, [fetchWorks]);

  const loadMore = useCallback(() => {
    if (data && page < data.totalPages) {
      fetchWorks(page + 1);
    }
  }, [data, page, fetchWorks]);

  return { data, loading, error, loadMore, refetch: () => fetchWorks(1) };
}

export function useWork(id: string) {
  const [data, setData] = useState<Work | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const fetchWork = useCallback(async () => {
    if (!id) return;
    setLoading(true);
    setError(null);
    try {
      const apiResult = await apiClient.get<ApiWork>(`/works/${id}`);
      setData(mapApiWork(apiResult));
    } catch (e) {
      setError(e as Error);
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    fetchWork();
  }, [fetchWork]);

  return { data, loading, error, refetch: fetchWork, setData };
}

export function useToggleWorkLike() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const toggleLike = useCallback(async (workId: string): Promise<{ liked: boolean; likeCount: number }> => {
    setLoading(true);
    setError(null);
    try {
      const result = await apiClient.post<{ liked: boolean; likeCount: number }>(
        `/works/${workId}/like`,
      );
      return result;
    } catch (e) {
      setError(e as Error);
      throw e;
    } finally {
      setLoading(false);
    }
  }, []);

  return { toggleLike, loading, error };
}
