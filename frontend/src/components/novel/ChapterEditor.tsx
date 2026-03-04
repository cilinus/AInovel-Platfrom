'use client';

import { useState, useCallback } from 'react';
import styled from 'styled-components';
import Button from '@/src/components/common/Button';
import { useNovelProjects } from '@/src/hooks/useNovelProjects';

const EditorWrapper = styled.div`
  display: flex;
  flex-direction: column;
  gap: 1rem;
`;

const EditorHeader = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  flex-wrap: wrap;
  gap: 0.5rem;
`;

const ChapterTitle = styled.h3`
  font-size: 1.125rem;
  font-weight: 600;
  color: ${({ theme }) => theme.colors.foreground};
  margin: 0;
`;

const ButtonGroup = styled.div`
  display: flex;
  gap: 0.5rem;
`;

const EditorTextarea = styled.textarea`
  width: 100%;
  min-height: 500px;
  padding: 1.25rem;
  background-color: ${({ theme }) => theme.colors.background};
  border: 1px solid ${({ theme }) => theme.colors.border};
  border-radius: ${({ theme }) => theme.radius.md};
  font-family: ${({ theme }) => theme.fonts.serif};
  font-size: 1rem;
  line-height: 1.8;
  color: ${({ theme }) => theme.colors.foreground};
  resize: vertical;
  outline: none;
  box-sizing: border-box;

  &:focus {
    border-color: ${({ theme }) => theme.colors.primary};
    box-shadow: 0 0 0 3px ${({ theme }) => theme.colors.primary}20;
  }
`;

const EditorFooter = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
`;

const WordCountText = styled.span`
  font-size: 0.8125rem;
  color: ${({ theme }) => theme.colors.mutedForeground};
`;

const StatusText = styled.span<{ $error?: boolean }>`
  font-size: 0.8125rem;
  color: ${({ $error, theme }) =>
    $error ? theme.colors.destructive : theme.colors.secondary};
`;

interface ChapterEditorProps {
  projectId: string;
  chapterNumber: number;
  title: string;
  initialContent: string;
  onSaved?: () => void;
  onClose?: () => void;
}

export default function ChapterEditor({
  projectId,
  chapterNumber,
  title,
  initialContent,
  onSaved,
  onClose,
}: ChapterEditorProps) {
  const [content, setContent] = useState(initialContent);
  const [saving, setSaving] = useState(false);
  const [statusMsg, setStatusMsg] = useState<string | null>(null);
  const { updateChapterContent, downloadChapter } = useNovelProjects();

  const charCount = content.replace(/\s/g, '').length;

  const handleSave = useCallback(async () => {
    setSaving(true);
    setStatusMsg(null);
    const result = await updateChapterContent(
      projectId,
      chapterNumber,
      content,
    );
    if (result) {
      setStatusMsg('저장되었습니다.');
      onSaved?.();
    } else {
      setStatusMsg('저장에 실패했습니다.');
    }
    setSaving(false);
  }, [projectId, chapterNumber, content, updateChapterContent, onSaved]);

  const handleDownload = useCallback(() => {
    downloadChapter(projectId, chapterNumber, title);
  }, [projectId, chapterNumber, title, downloadChapter]);

  return (
    <EditorWrapper>
      <EditorHeader>
        <ChapterTitle>
          {chapterNumber}화 - {title}
        </ChapterTitle>
        <ButtonGroup>
          <Button variant="primary" size="sm" onClick={handleSave} disabled={saving}>
            {saving ? '저장 중...' : '저장'}
          </Button>
          <Button variant="outline" size="sm" onClick={handleDownload}>
            다운로드
          </Button>
          {onClose && (
            <Button variant="ghost" size="sm" onClick={onClose}>
              닫기
            </Button>
          )}
        </ButtonGroup>
      </EditorHeader>

      <EditorTextarea
        value={content}
        onChange={(e) => {
          setContent(e.target.value);
          setStatusMsg(null);
        }}
      />

      <EditorFooter>
        <WordCountText>{charCount.toLocaleString()}자</WordCountText>
        {statusMsg && (
          <StatusText $error={statusMsg.includes('실패')}>
            {statusMsg}
          </StatusText>
        )}
      </EditorFooter>
    </EditorWrapper>
  );
}
