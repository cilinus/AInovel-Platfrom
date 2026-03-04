'use client';

import { useState } from 'react';
import styled from 'styled-components';
import Button from '@/src/components/common/Button';
import { useNovelStore } from '@/src/stores/novelStore';
import { useNovelGeneration } from '@/src/hooks/useNovelGeneration';
import { useNovelProjects } from '@/src/hooks/useNovelProjects';
import { useAuthStore } from '@/src/stores/authStore';
import { DRAFT_COST } from '@/src/types/novel';

const ActionsWrapper = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
`;

const ButtonRow = styled.div`
  display: flex;
  gap: 0.5rem;
  flex-wrap: wrap;
`;

const ErrorText = styled.p`
  font-size: 0.8125rem;
  color: ${({ theme }) => theme.colors.destructive};
  margin: 0;
`;

const SuccessText = styled.p`
  font-size: 0.8125rem;
  color: ${({ theme }) => theme.colors.secondary};
  margin: 0;
`;

export default function GenerationActions() {
  const status = useNovelStore((s) => s.generationStatus);
  const content = useNovelStore((s) => s.streamingContent);
  const genre = useNovelStore((s) => s.settings.genre);
  const synopsis = useNovelStore((s) => s.settings.synopsis);
  const isEditing = useNovelStore((s) => s.isEditing);
  const editingContent = useNovelStore((s) => s.editingContent);
  const currentProject = useNovelStore((s) => s.currentProject);
  const tokenBalance = useAuthStore((s) => s.user?.tokenBalance ?? 0);
  const { startGeneration, stopGeneration, error } = useNovelGeneration();
  const { updateChapterContent, downloadContentAsFile } = useNovelProjects();
  const { setEditing, setEditingContent } = useNovelStore.getState();

  const [saving, setSaving] = useState(false);
  const [saveMessage, setSaveMessage] = useState<string | null>(null);

  const isGenerating = status === 'generating';
  const hasContent = content.length > 0;
  const canGenerate =
    !isGenerating &&
    !!genre &&
    synopsis.trim().length > 0 &&
    tokenBalance >= DRAFT_COST;

  const handleSave = async () => {
    if (!currentProject?._id) {
      setSaveMessage('프로젝트가 없습니다. 먼저 생성해주세요.');
      return;
    }

    setSaving(true);
    setSaveMessage(null);

    try {
      // Save current content (edited or streaming) to the latest chapter
      const contentToSave = isEditing ? editingContent : content;
      const chapters = await (
        await import('@/src/lib/api')
      ).apiClient.get<{ chapterNumber: number }[]>(
        `/novel/projects/${currentProject._id}/chapters`,
      );

      if (!Array.isArray(chapters) || chapters.length === 0) {
        setSaveMessage('저장할 챕터가 없습니다.');
        return;
      }

      const latestChapter = chapters.reduce((max, c) =>
        c.chapterNumber > max.chapterNumber ? c : max,
      );

      const result = await updateChapterContent(
        currentProject._id,
        latestChapter.chapterNumber,
        contentToSave,
      );

      if (result) {
        setSaveMessage('저장되었습니다.');
        if (isEditing) {
          setEditing(false);
        }
      }
    } catch {
      setSaveMessage('저장에 실패했습니다.');
    } finally {
      setSaving(false);
    }
  };

  const handleEdit = () => {
    if (isEditing) {
      setEditing(false);
    } else {
      setEditingContent(content);
      setEditing(true);
    }
  };

  const handleDownload = () => {
    const contentToDownload = isEditing ? editingContent : content;
    const title = currentProject?.title || 'novel';
    downloadContentAsFile(
      `# ${title}\n\n${contentToDownload}`,
      `${title}.md`,
    );
  };

  return (
    <ActionsWrapper>
      <ButtonRow>
        {isGenerating ? (
          <Button
            variant="primary"
            onClick={stopGeneration}
            style={{ backgroundColor: '#ef4444' }}
          >
            중지
          </Button>
        ) : (
          <Button
            variant="primary"
            onClick={startGeneration}
            disabled={!canGenerate}
          >
            생성하기
          </Button>
        )}

        {hasContent && !isGenerating && (
          <>
            <Button
              variant="secondary"
              onClick={handleSave}
              disabled={saving}
            >
              {saving ? '저장 중...' : '저장'}
            </Button>
            <Button variant="outline" onClick={handleEdit}>
              {isEditing ? '편집 취소' : '편집'}
            </Button>
            <Button variant="outline" onClick={handleDownload}>
              다운로드
            </Button>
          </>
        )}
      </ButtonRow>

      {error && <ErrorText>{error}</ErrorText>}
      {saveMessage && (
        saveMessage.includes('실패') || saveMessage.includes('없습니다')
          ? <ErrorText>{saveMessage}</ErrorText>
          : <SuccessText>{saveMessage}</SuccessText>
      )}
    </ActionsWrapper>
  );
}
