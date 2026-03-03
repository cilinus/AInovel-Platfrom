'use client';

import React from 'react';
import styled from 'styled-components';
import { useRouter } from 'next/navigation';
import { X, ChevronLeft, ChevronRight, Settings } from 'lucide-react';
import { useEpisode, useEpisodeNavigation } from '@/src/hooks/useEpisodes';
import { useWork } from '@/src/hooks/useWorks';
import { useReaderStore } from '@/src/stores/readerStore';
import Loading from '@/src/components/common/Loading';
import ReaderToolbar from './ReaderToolbar';
import EpisodeRating from './EpisodeRating';
import CommentSection from '@/src/components/comments/CommentSection';

interface EpisodeReaderProps {
  workId: string;
  episodeId: string;
}

const ReaderWrapper = styled.div<{
  $bgColor: string;
  $fontFamily: 'serif' | 'sans';
  $fontSize: number;
  $lineHeight: number;
}>`
  min-height: 100vh;
  background-color: ${({ $bgColor }) => $bgColor};
  font-family: ${({ $fontFamily, theme }) =>
    $fontFamily === 'serif' ? theme.fonts.serif : theme.fonts.sans};
  font-size: ${({ $fontSize }) => $fontSize}px;
  line-height: ${({ $lineHeight }) => $lineHeight};
  color: ${({ $bgColor }) =>
    $bgColor === '#1a1a2e' ? '#e0e0e0' : '#1a1a2e'};
  transition: background-color 0.3s, color 0.3s, font-size 0.2s;
`;

const HeaderBar = styled.header`
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  z-index: 40;
  display: flex;
  align-items: center;
  justify-content: space-between;
  height: 3.5rem;
  padding: 0 1rem;
  background-color: ${({ theme }) => theme.colors.background};
  border-bottom: 1px solid ${({ theme }) => theme.colors.border};
`;

const HeaderLeft = styled.div`
  display: flex;
  align-items: center;
  min-width: 0;
  flex: 1;
`;

const WorkTitleLink = styled.button`
  background: none;
  border: none;
  font-size: 0.8125rem;
  color: ${({ theme }) => theme.colors.mutedForeground};
  cursor: pointer;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  max-width: 10rem;
  padding: 0;
  text-align: left;
  transition: color 0.15s;

  &:hover {
    color: ${({ theme }) => theme.colors.primary};
  }

  @media (max-width: ${({ theme }) => theme.breakpoints.sm}) {
    display: none;
  }
`;

const HeaderCenter = styled.div`
  position: absolute;
  left: 50%;
  transform: translateX(-50%);
  max-width: 50%;
`;

const EpisodeTitleText = styled.h1`
  font-size: 0.9375rem;
  font-weight: 600;
  color: ${({ theme }) => theme.colors.foreground};
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  margin: 0;
`;

const CloseButton = styled.button`
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 2.25rem;
  height: 2.25rem;
  border: none;
  border-radius: ${({ theme }) => theme.radius.sm};
  background: transparent;
  color: ${({ theme }) => theme.colors.foreground};
  cursor: pointer;
  transition: background-color 0.15s;
  flex-shrink: 0;

  &:hover {
    background-color: ${({ theme }) => theme.colors.muted};
  }
`;

const ContentArea = styled.main`
  max-width: 720px;
  margin: 0 auto;
  padding: 5.5rem 1.5rem 7rem;
  white-space: pre-wrap;
  word-break: keep-all;
  overflow-wrap: break-word;

  @media (max-width: ${({ theme }) => theme.breakpoints.sm}) {
    padding-left: 1rem;
    padding-right: 1rem;
  }
`;

const LoadingWrapper = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 60vh;
`;

const ErrorText = styled.p`
  text-align: center;
  color: ${({ theme }) => theme.colors.destructive};
  padding: 4rem 1rem;
  font-size: 0.9375rem;
`;

const FooterBar = styled.footer`
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  z-index: 40;
  display: flex;
  align-items: center;
  justify-content: center;
  height: 3.5rem;
  background-color: ${({ theme }) => theme.colors.background};
  border-top: 1px solid ${({ theme }) => theme.colors.border};
  gap: 0;
`;

const NavButton = styled.button<{ $position: 'left' | 'right' }>`
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 0.375rem;
  height: 100%;
  flex: 1;
  border: none;
  background: transparent;
  color: ${({ theme }) => theme.colors.foreground};
  font-size: 0.875rem;
  font-weight: 500;
  cursor: pointer;
  transition: background-color 0.15s;

  ${({ $position, theme }) =>
    $position === 'left'
      ? `border-right: 1px solid ${theme.colors.border};`
      : ''}

  &:hover:not(:disabled) {
    background-color: ${({ theme }) => theme.colors.muted};
  }

  &:disabled {
    opacity: 0.4;
    cursor: not-allowed;
  }
`;

const SettingsButton = styled.button`
  position: fixed;
  bottom: 4.5rem;
  right: 1.5rem;
  z-index: 45;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 2.75rem;
  height: 2.75rem;
  border: 1px solid ${({ theme }) => theme.colors.border};
  border-radius: 50%;
  background-color: ${({ theme }) => theme.colors.card};
  color: ${({ theme }) => theme.colors.foreground};
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  cursor: pointer;
  transition: background-color 0.15s, box-shadow 0.15s;

  &:hover {
    background-color: ${({ theme }) => theme.colors.muted};
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
  }
`;

export default function EpisodeReader({ workId, episodeId }: EpisodeReaderProps) {
  const router = useRouter();
  const { episode, loading: episodeLoading, error: episodeError } = useEpisode(workId, episodeId);
  const { data: work } = useWork(workId);
  const nav = useEpisodeNavigation(workId, episodeId);
  const { settings, toggleToolbar } = useReaderStore();

  const handleGoToWork = () => {
    router.push(`/works/${workId}`);
  };

  const handlePrevEpisode = () => {
    if (nav.prev) {
      router.push(`/works/${workId}/episodes/${nav.prev.id}`);
    }
  };

  const handleNextEpisode = () => {
    if (nav.next) {
      router.push(`/works/${workId}/episodes/${nav.next.id}`);
    }
  };

  const isPrevDisabled = !nav.prev;
  const isNextDisabled = !nav.next;

  return (
    <ReaderWrapper
      $bgColor={settings.bgColor}
      $fontFamily={settings.fontFamily}
      $fontSize={settings.fontSize}
      $lineHeight={settings.lineHeight}
    >
      <HeaderBar>
        <HeaderLeft>
          <WorkTitleLink
            type="button"
            onClick={handleGoToWork}
            aria-label="작품 상세 페이지로 이동"
          >
            {work?.title ?? ''}
          </WorkTitleLink>
        </HeaderLeft>
        <HeaderCenter>
          <EpisodeTitleText>
            {episode ? episode.title : ''}
          </EpisodeTitleText>
        </HeaderCenter>
        <CloseButton
          type="button"
          onClick={handleGoToWork}
          aria-label="닫기"
        >
          <X size={18} />
        </CloseButton>
      </HeaderBar>

      <ContentArea>
        {episodeLoading && (
          <LoadingWrapper>
            <Loading />
          </LoadingWrapper>
        )}
        {episodeError && (
          <ErrorText>{episodeError.message}</ErrorText>
        )}
        {!episodeLoading && !episodeError && episode && (
          <>
            {episode.content}
            <EpisodeRating workId={workId} episodeId={episodeId} />
            <CommentSection workId={workId} episodeId={episodeId} />
          </>
        )}
      </ContentArea>

      <SettingsButton
        type="button"
        onClick={toggleToolbar}
        aria-label="읽기 설정 열기"
      >
        <Settings size={18} />
      </SettingsButton>

      <ReaderToolbar />

      <FooterBar>
        <NavButton
          type="button"
          $position="left"
          disabled={isPrevDisabled}
          onClick={handlePrevEpisode}
          aria-label="이전화"
        >
          <ChevronLeft size={16} />
          이전화
        </NavButton>
        <NavButton
          type="button"
          $position="right"
          disabled={isNextDisabled}
          onClick={handleNextEpisode}
          aria-label="다음화"
        >
          다음화
          <ChevronRight size={16} />
        </NavButton>
      </FooterBar>
    </ReaderWrapper>
  );
}