'use client';

import { useState, useRef, useCallback, useEffect } from 'react';
import styled, { keyframes } from 'styled-components';
import Button from '@/src/components/common/Button';
import { createSSEStream } from '@/src/lib/sse';
import { useAuthStore } from '@/src/stores/authStore';
import type { NovelProject } from '@/src/types/novel';

const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3101/api';

const Wrapper = styled.div`
  display: flex;
  flex-direction: column;
  gap: 1rem;
  border: 1px solid ${({ theme }) => theme.colors.border};
  border-radius: ${({ theme }) => theme.radius.md};
  padding: 1.25rem;
  background-color: ${({ theme }) => theme.colors.card};
`;

const PanelTitle = styled.h3`
  font-size: 1rem;
  font-weight: 600;
  color: ${({ theme }) => theme.colors.foreground};
  margin: 0;
`;

const GuidanceTextarea = styled.textarea`
  width: 100%;
  min-height: 80px;
  padding: 0.75rem;
  font-size: 0.875rem;
  line-height: 1.5;
  border: 1px solid ${({ theme }) => theme.colors.border};
  border-radius: ${({ theme }) => theme.radius.md};
  background-color: ${({ theme }) => theme.colors.background};
  color: ${({ theme }) => theme.colors.foreground};
  resize: vertical;
  outline: none;
  font-family: inherit;
  box-sizing: border-box;

  &:focus {
    border-color: ${({ theme }) => theme.colors.primary};
  }
`;

const ButtonRow = styled.div`
  display: flex;
  gap: 0.5rem;
  align-items: center;
`;

const ContentArea = styled.div`
  min-height: 200px;
  max-height: 500px;
  overflow-y: auto;
  padding: 1rem;
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

const ChapterInfo = styled.p`
  font-size: 0.8125rem;
  color: ${({ theme }) => theme.colors.mutedForeground};
  margin: 0;
`;

const FieldLabel = styled.label`
  font-size: 0.8125rem;
  font-weight: 500;
  color: ${({ theme }) => theme.colors.foreground};
`;

const StatusText = styled.p<{ $error?: boolean }>`
  font-size: 0.8125rem;
  margin: 0;
  color: ${({ $error, theme }) =>
    $error ? theme.colors.destructive : theme.colors.secondary};
`;

const SummaryBox = styled.div`
  padding: 0.75rem;
  background-color: ${({ theme }) => theme.colors.muted};
  border-radius: ${({ theme }) => theme.radius.md};
  font-size: 0.8125rem;
  color: ${({ theme }) => theme.colors.foreground};
  line-height: 1.5;
`;

const SummaryLabel = styled.span`
  font-weight: 600;
  display: block;
  margin-bottom: 0.25rem;
  color: ${({ theme }) => theme.colors.primary};
`;

interface GenerationPanelProps {
  projectId: string;
  project: NovelProject;
  onChapterGenerated: () => void;
}

type PanelStatus = 'idle' | 'generating' | 'completed' | 'error';

export default function GenerationPanel({
  projectId,
  project,
  onChapterGenerated,
}: GenerationPanelProps) {
  const nextChapterNumber = (project.totalChapters ?? 0) + 1;
  const accessToken = useAuthStore((s) => s.accessToken);
  const [guidance, setGuidance] = useState('');
  const [status, setStatus] = useState<PanelStatus>('idle');
  const [content, setContent] = useState('');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [summary, setSummary] = useState<string | null>(null);
  const abortRef = useRef<AbortController | null>(null);
  const pendingRef = useRef('');
  const rafRef = useRef<number | null>(null);
  const contentRef = useRef<HTMLDivElement>(null);

  const flushPending = useCallback(() => {
    if (pendingRef.current) {
      const text = pendingRef.current;
      pendingRef.current = '';
      setContent((prev) => prev + text);
    }
    rafRef.current = null;
  }, []);

  const batchAppend = useCallback(
    (text: string) => {
      pendingRef.current += text;
      if (rafRef.current === null) {
        rafRef.current = requestAnimationFrame(flushPending);
      }
    },
    [flushPending],
  );

  useEffect(() => {
    if (contentRef.current && status === 'generating') {
      contentRef.current.scrollTop = contentRef.current.scrollHeight;
    }
  }, [content, status]);

  const handleGenerate = useCallback(async () => {
    if (!accessToken) {
      setErrorMsg('로그인이 필요합니다.');
      return;
    }

    setContent('');
    setErrorMsg(null);
    setSummary(null);
    setStatus('generating');

    const controller = new AbortController();
    abortRef.current = controller;

    try {
      await createSSEStream(
        `${API_BASE}/novel/projects/${projectId}/chapters/generate`,
        {
          chapterNumber: nextChapterNumber,
          userGuidance: guidance || undefined,
        },
        accessToken,
        {
          onContentDelta: batchAppend,
          onStageStart: (stage) => {
            console.info(`[GenerationPanel] Stage started: ${stage}`);
          },
          onStageComplete: (stage) => {
            console.info(`[GenerationPanel] Stage completed: ${stage}`);
          },
          onSummaryGenerated: (s) => {
            setSummary(s);
          },
          onComplete: () => {
            if (pendingRef.current) {
              setContent((prev) => prev + pendingRef.current);
              pendingRef.current = '';
            }
            if (rafRef.current !== null) {
              cancelAnimationFrame(rafRef.current);
              rafRef.current = null;
            }
            setStatus('completed');
            onChapterGenerated();
          },
          onError: (err) => {
            const message =
              typeof err === 'object' && err !== null && 'message' in err
                ? (err as { message: string }).message
                : '생성 중 오류가 발생했습니다.';
            setErrorMsg(message);
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
      setErrorMsg(message);
      setStatus('error');
    } finally {
      abortRef.current = null;
    }
  }, [accessToken, projectId, nextChapterNumber, guidance, batchAppend, onChapterGenerated]);

  const handleStop = useCallback(() => {
    if (abortRef.current) {
      abortRef.current.abort();
      abortRef.current = null;
    }
    if (rafRef.current !== null) {
      cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
    }
    if (pendingRef.current) {
      setContent((prev) => prev + pendingRef.current);
      pendingRef.current = '';
    }
    setStatus('idle');
  }, []);

  const isGenerating = status === 'generating';

  return (
    <Wrapper>
      <PanelTitle>챕터 생성</PanelTitle>
      <ChapterInfo>다음 챕터: {nextChapterNumber}화</ChapterInfo>

      <div>
        <FieldLabel>작성 가이드라인</FieldLabel>
        <GuidanceTextarea
          value={guidance}
          onChange={(e) => setGuidance(e.target.value)}
          placeholder="이번 챕터에서 다루고 싶은 내용을 입력하세요 (선택사항)"
          disabled={isGenerating}
        />
      </div>

      <ButtonRow>
        {isGenerating ? (
          <Button
            variant="primary"
            size="sm"
            onClick={handleStop}
            style={{ backgroundColor: '#ef4444' }}
          >
            중지
          </Button>
        ) : (
          <Button
            variant="primary"
            size="sm"
            onClick={handleGenerate}
          >
            {nextChapterNumber}화 생성
          </Button>
        )}
      </ButtonRow>

      {(content || isGenerating) && (
        <ContentArea ref={contentRef}>
          {content}
          {isGenerating && <Cursor />}
        </ContentArea>
      )}

      {summary && (
        <SummaryBox>
          <SummaryLabel>챕터 요약</SummaryLabel>
          {summary}
        </SummaryBox>
      )}

      {errorMsg && <StatusText $error>{errorMsg}</StatusText>}
      {status === 'completed' && !errorMsg && (
        <StatusText>생성이 완료되었습니다.</StatusText>
      )}
    </Wrapper>
  );
}