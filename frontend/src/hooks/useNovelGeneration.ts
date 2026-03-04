'use client';

import { useRef, useCallback } from 'react';
import { createSSEStream } from '@/src/lib/sse';
import { apiClient } from '@/src/lib/api';
import { useAuthStore } from '@/src/stores/authStore';
import { useNovelStore } from '@/src/stores/novelStore';
import type { NovelProject } from '@/src/types/novel';

const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3101/api';

export function useNovelGeneration() {
  const abortRef = useRef<AbortController | null>(null);
  const rafRef = useRef<number | null>(null);
  const pendingTextRef = useRef('');

  const accessToken = useAuthStore((s) => s.accessToken);
  const settings = useNovelStore((s) => s.settings);
  const generationStatus = useNovelStore((s) => s.generationStatus);
  const streamingContent = useNovelStore((s) => s.streamingContent);
  const error = useNovelStore((s) => s.error);
  const { setStatus, appendContent, clearContent, setError, setCurrentProject } =
    useNovelStore.getState();

  const flushPendingText = useCallback(() => {
    if (pendingTextRef.current) {
      const text = pendingTextRef.current;
      pendingTextRef.current = '';
      appendContent(text);
    }
    rafRef.current = null;
  }, [appendContent]);

  const batchAppend = useCallback(
    (text: string) => {
      pendingTextRef.current += text;
      if (rafRef.current === null) {
        rafRef.current = requestAnimationFrame(flushPendingText);
      }
    },
    [flushPendingText],
  );

  const startGeneration = useCallback(async () => {
    if (!accessToken) {
      setError('로그인이 필요합니다.');
      return;
    }

    if (!settings.genre || !settings.synopsis.trim()) {
      setError('장르와 시놉시스를 입력해주세요.');
      return;
    }

    clearContent();
    setError(null);
    setStatus('generating');

    const controller = new AbortController();
    abortRef.current = controller;

    try {
      // Step 1: Create or reuse project
      const { currentProject } = useNovelStore.getState();
      let projectId = currentProject?._id;

      if (!projectId) {
        const project = await apiClient.post('/novel/projects', {
          title: settings.synopsis.slice(0, 50) || '새 프로젝트',
          genre: settings.genre,
          subGenre: settings.subGenre || undefined,
          synopsis: settings.synopsis,
          writingStyle: {
            tone: settings.writingTone,
            perspective: settings.perspective,
          },
        });
        projectId = (project as NovelProject)._id;
        setCurrentProject(project as NovelProject);
      }

      // Step 2: Determine next chapter number
      let chapterNumber = 1;
      try {
        const chapters = await apiClient.get(
          `/novel/projects/${projectId}/chapters`,
        );
        if (Array.isArray(chapters) && chapters.length > 0) {
          chapterNumber =
            Math.max(...chapters.map((c: { chapterNumber: number }) => c.chapterNumber)) + 1;
        }
      } catch {
        // No chapters yet, start at 1
      }

      // Step 3: SSE streaming generation
      await createSSEStream(
        `${API_BASE}/novel/projects/${projectId}/chapters/generate`,
        {
          chapterNumber,
          userGuidance: settings.synopsis,
        },
        accessToken,
        {
          onContentDelta: batchAppend,
          onStageStart: (stage) => {
            console.info(`[NovelGen] Stage started: ${stage}`);
          },
          onStageComplete: (stage) => {
            console.info(`[NovelGen] Stage completed: ${stage}`);
          },
          onComplete: () => {
            if (pendingTextRef.current) {
              appendContent(pendingTextRef.current);
              pendingTextRef.current = '';
            }
            if (rafRef.current !== null) {
              cancelAnimationFrame(rafRef.current);
              rafRef.current = null;
            }
            setStatus('completed');
          },
          onError: (err) => {
            const message =
              typeof err === 'object' && err !== null && 'message' in err
                ? (err as { message: string }).message
                : '생성 중 오류가 발생했습니다.';
            setError(message);
            setStatus('error');
          },
        },
        controller.signal,
      );
    } catch (err) {
      if (err instanceof DOMException && err.name === 'AbortError') {
        setStatus('idle');
        return;
      }
      const message =
        err instanceof Error ? err.message : '생성 중 오류가 발생했습니다.';
      setError(message);
      setStatus('error');
    } finally {
      abortRef.current = null;
    }
  }, [accessToken, settings, clearContent, setError, setStatus, setCurrentProject, batchAppend, appendContent]);

  const stopGeneration = useCallback(() => {
    if (abortRef.current) {
      abortRef.current.abort();
      abortRef.current = null;
    }
    if (rafRef.current !== null) {
      cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
    }
    if (pendingTextRef.current) {
      appendContent(pendingTextRef.current);
      pendingTextRef.current = '';
    }
    setStatus('idle');
  }, [appendContent, setStatus]);

  return {
    isGenerating: generationStatus === 'generating',
    generationStatus,
    content: streamingContent,
    error,
    startGeneration,
    stopGeneration,
  };
}