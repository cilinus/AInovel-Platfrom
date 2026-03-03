'use client';

import { useState, useCallback, useEffect } from 'react';
import { apiClient } from '../lib/api';
import { useAuthStore } from '../stores/authStore';

interface BookmarkStatus {
  bookmarked: boolean;
  loading: boolean;
  toggling: boolean;
  toggle: () => Promise<void>;
}

export function useBookmarkStatus(workId: string): BookmarkStatus {
  const [bookmarked, setBookmarked] = useState(false);
  const [loading, setLoading] = useState(false);
  const [toggling, setToggling] = useState(false);
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);

  useEffect(() => {
    if (!isAuthenticated || !workId) return;
    let cancelled = false;
    setLoading(true);
    apiClient
      .get<{ bookmarked: boolean }>(`/users/me/bookmarks/${workId}/status`)
      .then((res) => {
        if (!cancelled) setBookmarked(res.bookmarked);
      })
      .catch(() => {
        // silent fail for bookmark status
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [workId, isAuthenticated]);

  const toggle = useCallback(async () => {
    if (!workId || toggling) return;
    setToggling(true);
    // Optimistic update
    const prev = bookmarked;
    setBookmarked(!prev);
    try {
      const res = await apiClient.post<{ bookmarked: boolean }>(
        `/users/me/bookmarks/${workId}`,
      );
      setBookmarked(res.bookmarked);
    } catch {
      setBookmarked(prev);
    } finally {
      setToggling(false);
    }
  }, [workId, bookmarked, toggling]);

  return { bookmarked, loading, toggling, toggle };
}
