'use client';

import { useState, useCallback } from 'react';
import { apiClient } from '@/src/lib/api';
import { useNovelStore } from '@/src/stores/novelStore';
import type { NovelProject, NovelChapter, PlotOutlineItem, WritingStyle, ProjectSettings } from '@/src/types/novel';

const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3101/api';

export function useNovelProjects() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const projects = useNovelStore((s) => s.projects);
  const { setProjects, setCurrentProject } = useNovelStore.getState();

  const fetchProjects = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await apiClient.get<{ items: NovelProject[]; total: number }>(
        '/novel/projects',
      );
      setProjects(data.items ?? []);
    } catch (err) {
      const message = err instanceof Error ? err.message : '프로젝트 목록을 불러올 수 없습니다.';
      setError(message);
    } finally {
      setLoading(false);
    }
  }, [setProjects]);

  const fetchProject = useCallback(async (id: string) => {
    setLoading(true);
    setError(null);
    try {
      const data = await apiClient.get<NovelProject>(`/novel/projects/${id}`);
      setCurrentProject(data);
      return data;
    } catch (err) {
      const message = err instanceof Error ? err.message : '프로젝트를 불러올 수 없습니다.';
      setError(message);
      return null;
    } finally {
      setLoading(false);
    }
  }, [setCurrentProject]);

  const createProject = useCallback(async (data: {
    title: string;
    genre: string;
    subGenre?: string;
    synopsis: string;
    writingStyle?: WritingStyle;
    settings?: ProjectSettings;
  }) => {
    setLoading(true);
    setError(null);
    try {
      const result = await apiClient.post<NovelProject>('/novel/projects', data);
      const currentProjects = Array.isArray(projects) ? projects : [];
      setProjects([result, ...currentProjects]);
      setCurrentProject(result);
      return result;
    } catch (err) {
      const message = err instanceof Error ? err.message : '프로젝트를 생성할 수 없습니다.';
      setError(message);
      return null;
    } finally {
      setLoading(false);
    }
  }, [projects, setProjects, setCurrentProject]);

  const updateProject = useCallback(async (id: string, updates: Partial<NovelProject>) => {
    setLoading(true);
    setError(null);
    try {
      const data = await apiClient.patch<NovelProject>(`/novel/projects/${id}`, updates);
      setProjects(projects.map((p) => (p._id === id ? data : p)));
      setCurrentProject(data);
      return data;
    } catch (err) {
      const message = err instanceof Error ? err.message : '프로젝트를 수정할 수 없습니다.';
      setError(message);
      return null;
    } finally {
      setLoading(false);
    }
  }, [projects, setProjects, setCurrentProject]);

  const fetchChapters = useCallback(async (projectId: string) => {
    setLoading(true);
    setError(null);
    try {
      const data = await apiClient.get<NovelChapter[]>(
        `/novel/projects/${projectId}/chapters`,
      );
      return data;
    } catch (err) {
      const message =
        err instanceof Error ? err.message : '챕터 목록을 불러올 수 없습니다.';
      setError(message);
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  const updateChapterContent = useCallback(
    async (
      projectId: string,
      chapterNumber: number,
      content: string,
      title?: string,
    ) => {
      setLoading(true);
      setError(null);
      try {
        const body: { content: string; title?: string } = { content };
        if (title) body.title = title;
        const data = await apiClient.patch<NovelChapter>(
          `/novel/projects/${projectId}/chapters/${chapterNumber}`,
          body,
        );
        return data;
      } catch (err) {
        const message =
          err instanceof Error ? err.message : '챕터 저장에 실패했습니다.';
        setError(message);
        return null;
      } finally {
        setLoading(false);
      }
    },
    [],
  );

  const downloadChapter = useCallback(
    async (projectId: string, chapterNumber: number, fallbackTitle?: string) => {
      setError(null);
      try {
        // Use raw fetch for blob download with auth
        const headers: Record<string, string> = {
          Authorization: `Bearer ${(apiClient as any).accessToken ?? ''}`,
        };
        const res = await fetch(
          `${API_BASE}/novel/projects/${projectId}/chapters/${chapterNumber}/download`,
          { headers, credentials: 'include' },
        );
        if (!res.ok) {
          throw new Error(`다운로드 실패 (${res.status})`);
        }
        const blob = await res.blob();
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = fallbackTitle
          ? `${fallbackTitle}.md`
          : `chapter-${chapterNumber}.md`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
      } catch (err) {
        const message =
          err instanceof Error ? err.message : '다운로드에 실패했습니다.';
        setError(message);
      }
    },
    [],
  );

  const downloadContentAsFile = useCallback(
    (content: string, filename: string) => {
      const blob = new Blob([content], { type: 'text/markdown;charset=utf-8' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    },
    [],
  );

  const fetchOutline = useCallback(async (projectId: string): Promise<PlotOutlineItem[]> => {
    setLoading(true);
    setError(null);
    try {
      const data = await apiClient.get<PlotOutlineItem[]>(
        `/novel/projects/${projectId}/outline`,
      );
      return data;
    } catch (err) {
      const message = err instanceof Error ? err.message : '플롯 개요를 불러올 수 없습니다.';
      setError(message);
      return [];
    } finally {
      setLoading(false);
    }
  }, []);

  const updateOutline = useCallback(async (projectId: string, plotOutline: PlotOutlineItem[]): Promise<void> => {
    setLoading(true);
    setError(null);
    try {
      await apiClient.patch(`/novel/projects/${projectId}/outline`, { plotOutline });
    } catch (err) {
      const message = err instanceof Error ? err.message : '플롯 개요 저장에 실패했습니다.';
      setError(message);
    } finally {
      setLoading(false);
    }
  }, []);

  const generateOutline = useCallback(async (projectId: string, totalChapters: number): Promise<PlotOutlineItem[]> => {
    setLoading(true);
    setError(null);
    try {
      const data = await apiClient.post<PlotOutlineItem[]>(
        `/novel/projects/${projectId}/outline/generate`,
        { totalChapters },
      );
      return data;
    } catch (err) {
      const message = err instanceof Error ? err.message : '플롯 개요 생성에 실패했습니다.';
      setError(message);
      return [];
    } finally {
      setLoading(false);
    }
  }, []);

  return {
    projects,
    loading,
    error,
    fetchProjects,
    fetchProject,
    createProject,
    updateProject,
    fetchChapters,
    updateChapterContent,
    downloadChapter,
    downloadContentAsFile,
    fetchOutline,
    updateOutline,
    generateOutline,
  };
}