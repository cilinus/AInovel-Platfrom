import { useInfiniteQuery, useQuery } from '@tanstack/react-query';
import { apiClient } from '@/lib/api-client';

interface Work {
  _id: string;
  title: string;
  description: string;
  coverImage?: string;
  genre: string;
  tags: string[];
  status: string;
  episodeCount: number;
  stats: {
    viewCount: number;
    likeCount: number;
    bookmarkCount: number;
  };
  authorId: { nickname: string; profileImage?: string };
}

interface WorkListResponse {
  items: Work[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export function useWorks(params?: {
  genre?: string;
  sort?: string;
  limit?: number;
}) {
  return useInfiniteQuery({
    queryKey: ['works', params],
    queryFn: ({ pageParam = 1 }) =>
      apiClient.get<WorkListResponse>('/works', {
        ...params,
        page: pageParam,
      }),
    getNextPageParam: (last) =>
      last.page < last.totalPages ? last.page + 1 : undefined,
    initialPageParam: 1,
  });
}

export function useWork(id: string) {
  return useQuery({
    queryKey: ['works', id],
    queryFn: () => apiClient.get<Work>(`/works/${id}`),
    enabled: !!id,
  });
}
