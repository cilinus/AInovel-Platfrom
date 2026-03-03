'use client';

import { useState, useCallback, useEffect } from 'react';
import { apiClient } from '../lib/api';
import type { Comment, CommentListResponse } from '../types/comment';

// Helper: recursively update a comment by id in a comment tree (top-level + replies)
function updateCommentInList(
  comments: Comment[],
  commentId: string,
  updater: (c: Comment) => Comment,
): Comment[] {
  return comments.map((c) => {
    if (c.id === commentId) return updater(c);
    if (c.replies && c.replies.length > 0) {
      return { ...c, replies: updateCommentInList(c.replies, commentId, updater) };
    }
    return c;
  });
}

export function useComments(workId: string, episodeId: string, sort: 'latest' | 'best' = 'latest') {
  const [comments, setComments] = useState<Comment[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [hasNext, setHasNext] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const fetchComments = useCallback(async (pageNum: number = 1) => {
    if (!workId || !episodeId) return;
    setLoading(true);
    setError(null);
    try {
      const result = await apiClient.get<CommentListResponse>(
        `/works/${workId}/episodes/${episodeId}/comments`,
        { page: pageNum, limit: 20, sort },
      );
      if (pageNum === 1) {
        setComments(result.items);
      } else {
        setComments((prev) => [...prev, ...result.items]);
      }
      setTotal(result.total);
      setPage(pageNum);
      setHasNext(result.hasNext);
    } catch (e) {
      setError(e as Error);
    } finally {
      setLoading(false);
    }
  }, [workId, episodeId, sort]);

  useEffect(() => {
    fetchComments(1);
  }, [fetchComments]);

  const loadMore = useCallback(() => {
    if (hasNext) {
      fetchComments(page + 1);
    }
  }, [hasNext, page, fetchComments]);

  const addComment = useCallback((comment: Comment) => {
    if (comment.parentId) {
      // Add reply to the parent comment's replies array
      setComments((prev) =>
        prev.map((c) =>
          c.id === comment.parentId
            ? { ...c, replies: [...(c.replies ?? []), comment] }
            : c,
        ),
      );
    } else {
      setComments((prev) => [comment, ...prev]);
    }
    setTotal((prev) => prev + 1);
  }, []);

  const toggleLike = useCallback(async (commentId: string) => {
    try {
      const result = await apiClient.post<{ id: string; likeCount: number; isLiked: boolean }>(
        `/works/${workId}/episodes/${episodeId}/comments/${commentId}/like`,
      );
      setComments((prev) =>
        updateCommentInList(prev, commentId, (c) => ({
          ...c,
          likeCount: result.likeCount,
          isLiked: result.isLiked,
        })),
      );
    } catch {
      // silently fail
    }
  }, [workId, episodeId]);

  const toggleDislike = useCallback(async (commentId: string) => {
    try {
      const result = await apiClient.post<{ id: string; dislikeCount: number; isDisliked: boolean }>(
        `/works/${workId}/episodes/${episodeId}/comments/${commentId}/dislike`,
      );
      setComments((prev) =>
        updateCommentInList(prev, commentId, (c) => ({
          ...c,
          dislikeCount: result.dislikeCount,
          isDisliked: result.isDisliked,
        })),
      );
    } catch {
      // silently fail
    }
  }, [workId, episodeId]);

  return {
    comments,
    total,
    hasNext,
    loading,
    error,
    loadMore,
    addComment,
    toggleLike,
    toggleDislike,
    refetch: () => fetchComments(1),
  };
}

export function useCreateComment() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const createComment = useCallback(async (
    workId: string,
    episodeId: string,
    content: string,
    parentId?: string,
  ): Promise<Comment> => {
    setLoading(true);
    setError(null);
    try {
      const body: { content: string; parentId?: string } = { content };
      if (parentId) {
        body.parentId = parentId;
      }
      const result = await apiClient.post<Comment>(
        `/works/${workId}/episodes/${episodeId}/comments`,
        body,
      );
      return result;
    } catch (e) {
      setError(e as Error);
      throw e;
    } finally {
      setLoading(false);
    }
  }, []);

  return { createComment, loading, error };
}
