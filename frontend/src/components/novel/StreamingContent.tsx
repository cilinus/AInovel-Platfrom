'use client';

import { useEffect, useRef } from 'react';
import styled, { keyframes } from 'styled-components';
import { useNovelStore } from '@/src/stores/novelStore';

const ContentArea = styled.div`
  min-height: 400px;
  max-height: 600px;
  overflow-y: auto;
  padding: 1.25rem;
  background-color: ${({ theme }) => theme.colors.background};
  border: 1px solid ${({ theme }) => theme.colors.border};
  border-radius: ${({ theme }) => theme.radius.md};
  font-family: ${({ theme }) => theme.fonts.serif};
  font-size: 1rem;
  line-height: 1.8;
  color: ${({ theme }) => theme.colors.foreground};
  white-space: pre-wrap;
  word-break: keep-all;
`;

const blink = keyframes`
  0%, 50% { opacity: 1; }
  51%, 100% { opacity: 0; }
`;

const Cursor = styled.span`
  display: inline-block;
  width: 2px;
  height: 1.2em;
  background-color: ${({ theme }) => theme.colors.primary};
  margin-left: 2px;
  vertical-align: text-bottom;
  animation: ${blink} 1s step-end infinite;
`;

const EmptyState = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 100%;
  min-height: 400px;
  color: ${({ theme }) => theme.colors.mutedForeground};
  text-align: center;
  gap: 0.5rem;
`;

const EmptyIcon = styled.span`
  font-size: 2.5rem;
  opacity: 0.5;
`;

const EmptyText = styled.p`
  font-size: 0.875rem;
  margin: 0;
`;

const EditingArea = styled.textarea`
  min-height: 400px;
  max-height: 600px;
  width: 100%;
  padding: 1.25rem;
  background-color: ${({ theme }) => theme.colors.background};
  border: 1px solid ${({ theme }) => theme.colors.primary};
  border-radius: ${({ theme }) => theme.radius.md};
  font-family: ${({ theme }) => theme.fonts.serif};
  font-size: 1rem;
  line-height: 1.8;
  color: ${({ theme }) => theme.colors.foreground};
  white-space: pre-wrap;
  word-break: keep-all;
  resize: vertical;
  outline: none;
  box-sizing: border-box;
`;

const WordCount = styled.div`
  text-align: right;
  font-size: 0.75rem;
  color: ${({ theme }) => theme.colors.mutedForeground};
  margin-top: 0.25rem;
`;

export default function StreamingContent() {
  const content = useNovelStore((s) => s.streamingContent);
  const status = useNovelStore((s) => s.generationStatus);
  const isEditing = useNovelStore((s) => s.isEditing);
  const editingContent = useNovelStore((s) => s.editingContent);
  const { setEditingContent } = useNovelStore.getState();
  const contentRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (contentRef.current && status === 'generating') {
      contentRef.current.scrollTop = contentRef.current.scrollHeight;
    }
  }, [content, status]);

  if (!content && status === 'idle') {
    return (
      <EmptyState>
        <EmptyIcon>{'\u270D'}</EmptyIcon>
        <EmptyText>장르와 시놉시스를 설정한 후</EmptyText>
        <EmptyText>"생성하기" 버튼을 눌러주세요.</EmptyText>
      </EmptyState>
    );
  }

  if (isEditing) {
    const charCount = editingContent.replace(/\s/g, '').length;
    return (
      <>
        <EditingArea
          value={editingContent}
          onChange={(e) => setEditingContent(e.target.value)}
        />
        <WordCount>{charCount.toLocaleString()}자</WordCount>
      </>
    );
  }

  return (
    <ContentArea ref={contentRef}>
      {content}
      {status === 'generating' && <Cursor />}
    </ContentArea>
  );
}