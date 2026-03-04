'use client';

import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import styled from 'styled-components';
import Button from '@/src/components/common/Button';
import ChapterEditor from '@/src/components/novel/ChapterEditor';
import GenerationPanel from '@/src/components/novel/GenerationPanel';
import CharacterManager from '@/src/components/novel/CharacterManager';
import WorldBuildingEditor from '@/src/components/novel/WorldBuildingEditor';
import PlotOutlineEditor from '@/src/components/novel/PlotOutlineEditor';
import { useNovelProjects } from '@/src/hooks/useNovelProjects';
import { useNovelStore } from '@/src/stores/novelStore';
import { GENRE_LABELS, Genre } from '@/src/constants/genres';
import { GENRE_COLORS } from '@/src/types/novel';
import type { NovelChapter, NovelProject } from '@/src/types/novel';
import { apiClient } from '@/src/lib/api';

type TabKey = 'chapters' | 'settings' | 'outline';

const Wrapper = styled.div`
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
`;

const BackLink = styled.button`
  display: inline-flex;
  align-items: center;
  gap: 0.25rem;
  font-size: 0.8125rem;
  color: ${({ theme }) => theme.colors.mutedForeground};
  background: none;
  border: none;
  cursor: pointer;
  padding: 0;

  &:hover {
    color: ${({ theme }) => theme.colors.primary};
  }
`;

const ProjectHeader = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
`;

const TitleRow = styled.div`
  display: flex;
  align-items: center;
  gap: 0.75rem;
  flex-wrap: wrap;
`;

const ProjectTitle = styled.h1`
  font-size: 1.5rem;
  font-weight: 700;
  color: ${({ theme }) => theme.colors.foreground};
  margin: 0;
`;

const GenreBadge = styled.span<{ $color: string }>`
  font-size: 0.75rem;
  font-weight: 500;
  padding: 0.125rem 0.5rem;
  border-radius: 9999px;
  background-color: ${({ $color }) => $color}20;
  color: ${({ $color }) => $color};
`;

const Synopsis = styled.p`
  font-size: 0.875rem;
  color: ${({ theme }) => theme.colors.mutedForeground};
  line-height: 1.6;
  margin: 0;
`;

const TabBar = styled.div`
  display: flex;
  gap: 0;
  border-bottom: 1px solid ${({ theme }) => theme.colors.border};
`;

const Tab = styled.button<{ $active: boolean }>`
  padding: 0.625rem 1.25rem;
  font-size: 0.875rem;
  font-weight: ${({ $active }) => ($active ? '600' : '400')};
  color: ${({ $active, theme }) =>
    $active ? theme.colors.primary : theme.colors.mutedForeground};
  background: none;
  border: none;
  border-bottom: 2px solid
    ${({ $active, theme }) => ($active ? theme.colors.primary : 'transparent')};
  cursor: pointer;
  transition: color 0.15s, border-color 0.15s;

  &:hover {
    color: ${({ theme }) => theme.colors.foreground};
  }
`;

const SectionTitle = styled.h2`
  font-size: 1.125rem;
  font-weight: 600;
  color: ${({ theme }) => theme.colors.foreground};
  margin: 0;
`;

const ChapterTable = styled.div`
  border: 1px solid ${({ theme }) => theme.colors.border};
  border-radius: ${({ theme }) => theme.radius.md};
  overflow: hidden;
`;

const ChapterRowWrapper = styled.div`
  border-bottom: 1px solid ${({ theme }) => theme.colors.border};

  &:last-child {
    border-bottom: none;
  }
`;

const ChapterRow = styled.div<{ $isHeader?: boolean }>`
  display: grid;
  grid-template-columns: 60px 1fr 80px 100px 120px 120px;
  align-items: center;
  padding: 0.75rem 1rem;
  gap: 0.5rem;
  background-color: ${({ $isHeader, theme }) =>
    $isHeader ? theme.colors.muted : theme.colors.card};
  font-size: ${({ $isHeader }) => ($isHeader ? '0.75rem' : '0.875rem')};
  font-weight: ${({ $isHeader }) => ($isHeader ? '600' : '400')};
  color: ${({ $isHeader, theme }) =>
    $isHeader ? theme.colors.mutedForeground : theme.colors.foreground};

  @media (max-width: ${({ theme }) => theme.breakpoints.md}) {
    grid-template-columns: 40px 1fr 80px 80px;

    & > *:nth-child(4),
    & > *:nth-child(5) {
      display: none;
    }
  }
`;

const SummaryToggle = styled.button`
  display: inline-flex;
  align-items: center;
  gap: 0.25rem;
  font-size: 0.75rem;
  color: ${({ theme }) => theme.colors.primary};
  background: none;
  border: none;
  cursor: pointer;
  padding: 0;
  margin-left: 0.5rem;

  &:hover {
    text-decoration: underline;
  }
`;

const SummaryContent = styled.div`
  padding: 0.5rem 1rem 0.75rem 1rem;
  font-size: 0.8125rem;
  color: ${({ theme }) => theme.colors.mutedForeground};
  line-height: 1.5;
  background-color: ${({ theme }) => theme.colors.muted};
  border-top: 1px dashed ${({ theme }) => theme.colors.border};
`;

const ChapterActions = styled.div`
  display: flex;
  gap: 0.25rem;
`;

const StatusBadge = styled.span<{ $status: string }>`
  font-size: 0.6875rem;
  font-weight: 500;
  padding: 0.125rem 0.375rem;
  border-radius: ${({ theme }) => theme.radius.sm};
  background-color: ${({ $status, theme }) => {
    switch ($status) {
      case 'DRAFT':
        return theme.colors.mutedForeground + '20';
      case 'GENERATED':
        return theme.colors.secondary + '20';
      case 'EDITED':
        return theme.colors.primary + '20';
      default:
        return theme.colors.muted;
    }
  }};
  color: ${({ $status, theme }) => {
    switch ($status) {
      case 'DRAFT':
        return theme.colors.mutedForeground;
      case 'GENERATED':
        return theme.colors.secondary;
      case 'EDITED':
        return theme.colors.primary;
      default:
        return theme.colors.foreground;
    }
  }};
`;

const LoadingText = styled.p`
  font-size: 0.875rem;
  color: ${({ theme }) => theme.colors.mutedForeground};
  text-align: center;
  padding: 2rem;
`;

const ErrorText = styled.p`
  font-size: 0.875rem;
  color: ${({ theme }) => theme.colors.destructive};
  text-align: center;
  padding: 2rem;
`;

const EmptyChapters = styled.div`
  padding: 2rem;
  text-align: center;
  color: ${({ theme }) => theme.colors.mutedForeground};
  font-size: 0.875rem;
`;

const SettingsSection = styled.div`
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
`;

const STATUS_LABELS: Record<string, string> = {
  DRAFT: '초안',
  GENERATED: '생성됨',
  EDITED: '편집됨',
};

function formatDate(dateStr: string): string {
  const date = new Date(dateStr);
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  const h = String(date.getHours()).padStart(2, '0');
  const min = String(date.getMinutes()).padStart(2, '0');
  return `${m}.${d} ${h}:${min}`;
}

interface ProjectDetailProps {
  projectId: string;
}

export default function ProjectDetail({ projectId }: ProjectDetailProps) {
  const router = useRouter();
  const { fetchProject, fetchChapters, downloadChapter, updateProject } = useNovelProjects();
  const project = useNovelStore((s) => s.currentProject);
  const [chapters, setChapters] = useState<NovelChapter[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [editingChapter, setEditingChapter] = useState<NovelChapter | null>(null);
  const [activeTab, setActiveTab] = useState<TabKey>('chapters');
  const [expandedSummaries, setExpandedSummaries] = useState<Set<number>>(new Set());

  const loadData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      await fetchProject(projectId);
      const chaptersData = await fetchChapters(projectId);
      if (chaptersData) {
        setChapters(chaptersData);
      }
    } catch (err) {
      setError(
        err instanceof Error ? err.message : '데이터를 불러올 수 없습니다.',
      );
    } finally {
      setLoading(false);
    }
  }, [projectId, fetchProject, fetchChapters]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleEditChapter = useCallback(
    async (chapter: NovelChapter) => {
      if (!chapter.content) {
        try {
          const fullChapter = await apiClient.get<NovelChapter>(
            `/novel/projects/${projectId}/chapters/${chapter.chapterNumber}`,
          );
          setEditingChapter(fullChapter);
        } catch {
          setEditingChapter({ ...chapter, content: '' });
        }
      } else {
        setEditingChapter(chapter);
      }
    },
    [projectId],
  );

  const handleEditorClose = useCallback(() => {
    setEditingChapter(null);
  }, []);

  const handleEditorSaved = useCallback(() => {
    loadData();
  }, [loadData]);

  const handleChapterGenerated = useCallback(() => {
    loadData();
  }, [loadData]);

  const toggleSummary = useCallback((chapterNumber: number) => {
    setExpandedSummaries((prev) => {
      const next = new Set(prev);
      if (next.has(chapterNumber)) {
        next.delete(chapterNumber);
      } else {
        next.add(chapterNumber);
      }
      return next;
    });
  }, []);

  const handleCharactersUpdate = useCallback(
    (characters: string[]) => {
      if (!project) return;
      updateProject(projectId, {
        settings: {
          ...project.settings,
          mainCharacters: characters,
        },
      } as Partial<NovelProject>);
    },
    [projectId, project, updateProject],
  );

  const handleWorldBuildingUpdate = useCallback(
    (worldBuilding: string) => {
      if (!project) return;
      updateProject(projectId, {
        settings: {
          ...project.settings,
          worldBuilding,
        },
      } as Partial<NovelProject>);
    },
    [projectId, project, updateProject],
  );

  if (loading) return <LoadingText>불러오는 중...</LoadingText>;
  if (error) return <ErrorText>{error}</ErrorText>;
  if (!project) return <ErrorText>프로젝트를 찾을 수 없습니다.</ErrorText>;

  const genreColor = GENRE_COLORS[project.genre as Genre] ?? '#64748b';
  const genreLabel = GENRE_LABELS[project.genre as Genre] ?? project.genre;

  if (editingChapter) {
    return (
      <Wrapper>
        <BackLink onClick={handleEditorClose}>
          &larr; 챕터 목록으로 돌아가기
        </BackLink>
        <ChapterEditor
          projectId={projectId}
          chapterNumber={editingChapter.chapterNumber}
          title={editingChapter.title || `Chapter ${editingChapter.chapterNumber}`}
          initialContent={editingChapter.content}
          onSaved={handleEditorSaved}
          onClose={handleEditorClose}
        />
      </Wrapper>
    );
  }

  const mainCharacters = project.settings?.mainCharacters ?? [];
  const worldBuilding = project.settings?.worldBuilding ?? '';

  return (
    <Wrapper>
      <BackLink onClick={() => router.push('/author/novel')}>
        &larr; 프로젝트 목록
      </BackLink>

      <ProjectHeader>
        <TitleRow>
          <ProjectTitle>{project.title}</ProjectTitle>
          <GenreBadge $color={genreColor}>{genreLabel}</GenreBadge>
        </TitleRow>
        {project.synopsis && <Synopsis>{project.synopsis}</Synopsis>}
      </ProjectHeader>

      <TabBar>
        <Tab $active={activeTab === 'chapters'} onClick={() => setActiveTab('chapters')}>
          챕터
        </Tab>
        <Tab $active={activeTab === 'settings'} onClick={() => setActiveTab('settings')}>
          설정
        </Tab>
        <Tab $active={activeTab === 'outline'} onClick={() => setActiveTab('outline')}>
          아웃라인
        </Tab>
      </TabBar>

      {activeTab === 'chapters' && (
        <div>
          <div style={{ marginBottom: '0.75rem' }}>
            <SectionTitle>챕터 목록 ({chapters.length})</SectionTitle>
          </div>

          {chapters.length === 0 ? (
            <EmptyChapters>아직 생성된 챕터가 없습니다.</EmptyChapters>
          ) : (
            <ChapterTable>
              <ChapterRowWrapper>
                <ChapterRow $isHeader>
                  <span>회차</span>
                  <span>제목</span>
                  <span>상태</span>
                  <span>글자수</span>
                  <span>생성일</span>
                  <span>액션</span>
                </ChapterRow>
              </ChapterRowWrapper>
              {chapters.map((chapter) => (
                <ChapterRowWrapper key={chapter._id ?? chapter.chapterNumber}>
                  <ChapterRow>
                    <span>{chapter.chapterNumber}</span>
                    <span>
                      {chapter.title || '-'}
                      {chapter.summary && (
                        <SummaryToggle
                          type="button"
                          onClick={() => toggleSummary(chapter.chapterNumber)}
                        >
                          {expandedSummaries.has(chapter.chapterNumber) ? '[접기]' : '[요약]'}
                        </SummaryToggle>
                      )}
                    </span>
                    <span>
                      <StatusBadge $status={chapter.status}>
                        {STATUS_LABELS[chapter.status] ?? chapter.status}
                      </StatusBadge>
                    </span>
                    <span>{(chapter.wordCount ?? 0).toLocaleString()}</span>
                    <span>{chapter.createdAt ? formatDate(chapter.createdAt) : '-'}</span>
                    <ChapterActions>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleEditChapter(chapter);
                        }}
                      >
                        편집
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation();
                          downloadChapter(
                            projectId,
                            chapter.chapterNumber,
                            chapter.title,
                          );
                        }}
                      >
                        다운로드
                      </Button>
                    </ChapterActions>
                  </ChapterRow>
                  {chapter.summary && expandedSummaries.has(chapter.chapterNumber) && (
                    <SummaryContent>{chapter.summary}</SummaryContent>
                  )}
                </ChapterRowWrapper>
              ))}
            </ChapterTable>
          )}

          <div style={{ marginTop: '1.5rem' }}>
            <GenerationPanel
              projectId={projectId}
              project={project}
              onChapterGenerated={handleChapterGenerated}
            />
          </div>
        </div>
      )}

      {activeTab === 'settings' && (
        <SettingsSection>
          <CharacterManager
            characters={mainCharacters}
            onUpdate={handleCharactersUpdate}
          />
          <WorldBuildingEditor
            worldBuilding={worldBuilding}
            onUpdate={handleWorldBuildingUpdate}
          />
        </SettingsSection>
      )}

      {activeTab === 'outline' && (
        <PlotOutlineEditor projectId={projectId} />
      )}
    </Wrapper>
  );
}
