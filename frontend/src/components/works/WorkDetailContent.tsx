'use client';

import { useState } from 'react';
import styled from 'styled-components';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Eye, Heart, BookOpen, Star, Bookmark, BookmarkCheck } from 'lucide-react';
import { useWork, useToggleWorkLike } from '@/src/hooks/useWorks';
import { useEpisodes } from '@/src/hooks/useEpisodes';
import { Genre, GENRE_LABELS } from '@/src/constants/genres';
import { formatNumber } from '@/src/lib/utils';
import { useBookmarkStatus } from '@/src/hooks/useBookmarks';
import { useAuthStore } from '@/src/stores/authStore';
import Badge from '@/src/components/common/Badge';
import Button from '@/src/components/common/Button';
import Loading from '@/src/components/common/Loading';
import EmptyState from '@/src/components/common/EmptyState';
import EpisodeList from '@/src/components/episodes/EpisodeList';
import StarRating from '@/src/components/works/StarRating';

interface WorkDetailContentProps {
  workId: string;
}

const GENRE_GRADIENTS: Record<string, string> = {
  [Genre.ROMANCE]: 'linear-gradient(135deg, #ec4899, #f43f5e)',
  [Genre.FANTASY]: 'linear-gradient(135deg, #a855f7, #6366f1)',
  [Genre.MARTIAL_ARTS]: 'linear-gradient(135deg, #f59e0b, #f97316)',
  [Genre.MODERN]: 'linear-gradient(135deg, #38bdf8, #3b82f6)',
  [Genre.MYSTERY]: 'linear-gradient(135deg, #64748b, #6b7280)',
  [Genre.SF]: 'linear-gradient(135deg, #06b6d4, #14b8a6)',
};

const SYNOPSIS_TRUNCATE_LENGTH = 200;

const DetailWrapper = styled.div`
  max-width: 1280px;
  margin: 0 auto;
  padding: 2rem 1rem;
`;

const TopSection = styled.section`
  display: flex;
  flex-direction: row;
  gap: 2rem;

  @media (max-width: ${({ theme }) => theme.breakpoints.md}) {
    flex-direction: column;
    align-items: center;
  }
`;

const CoverArea = styled.div`
  flex-shrink: 0;
  width: 100%;
  max-width: 280px;

  @media (max-width: ${({ theme }) => theme.breakpoints.md}) {
    max-width: 200px;
  }
`;

const CoverContainer = styled.div<{ $gradient: string }>`
  position: relative;
  width: 100%;
  padding-top: 133.33%;
  border-radius: ${({ theme }) => theme.radius.lg};
  overflow: hidden;
  background: ${({ $gradient }) => $gradient};
`;

const CoverImage = styled.img`
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  object-fit: cover;
`;

const CoverGenreLabel = styled.span`
  position: absolute;
  bottom: 0.75rem;
  left: 0.75rem;
  font-size: 0.8125rem;
  font-weight: 500;
  color: rgba(255, 255, 255, 0.9);
  background: rgba(0, 0, 0, 0.35);
  padding: 0.1875rem 0.625rem;
  border-radius: 9999px;
  backdrop-filter: blur(4px);
`;

const InfoArea = styled.div`
  display: flex;
  flex-direction: column;
  flex: 1;
  min-width: 0;

  @media (max-width: ${({ theme }) => theme.breakpoints.md}) {
    align-items: center;
    text-align: center;
  }
`;

const Title = styled.h1`
  font-size: 1.75rem;
  font-weight: 700;
  color: ${({ theme }) => theme.colors.foreground};
  margin: 0;
  line-height: 1.3;
`;

const Author = styled.p`
  font-size: 0.9375rem;
  color: ${({ theme }) => theme.colors.mutedForeground};
  margin: 0.375rem 0 0;
`;

const BadgeRow = styled.div`
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 0.5rem;
  margin: 0.75rem 0;
`;

const StatsRow = styled.div`
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 1.5rem;
`;

const StatItem = styled.span`
  display: inline-flex;
  align-items: center;
  gap: 0.3rem;
  font-size: 0.875rem;
  color: ${({ theme }) => theme.colors.mutedForeground};

  & > svg {
    width: 16px;
    height: 16px;
  }
`;

const LikeButton = styled.button<{ $liked: boolean }>`
  display: inline-flex;
  align-items: center;
  gap: 0.3rem;
  font-size: 0.875rem;
  background: none;
  border: none;
  padding: 0.25rem 0.5rem;
  border-radius: ${({ theme }) => theme.radius.sm};
  cursor: pointer;
  color: ${({ $liked, theme }) => ($liked ? '#ef4444' : theme.colors.mutedForeground)};
  transition: color 0.15s, background-color 0.15s;

  & > svg {
    width: 16px;
    height: 16px;
  }

  &:hover {
    background-color: ${({ theme }) => theme.colors.muted};
  }

  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
`;

const ActionRow = styled.div`
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 0.75rem;
  margin-top: 1.5rem;
`;

const FirstEpisodeLink = styled(Link)`
  text-decoration: none;
`;

const BookmarkButton = styled(Button)`
  display: inline-flex;
  align-items: center;
  gap: 0.375rem;
`;

const SynopsisSection = styled.section`
  margin-top: 2rem;
`;

const SectionLabel = styled.h2`
  font-size: 1.125rem;
  font-weight: 600;
  color: ${({ theme }) => theme.colors.foreground};
  margin: 0 0 0.75rem;
`;

const SynopsisText = styled.p`
  font-size: 0.9375rem;
  line-height: 1.75;
  color: ${({ theme }) => theme.colors.foreground};
  white-space: pre-wrap;
  word-break: keep-all;
  margin: 0;
`;

const ExpandButton = styled.button`
  display: inline;
  background: none;
  border: none;
  padding: 0;
  margin-left: 0.25rem;
  font-size: 0.9375rem;
  font-weight: 500;
  color: ${({ theme }) => theme.colors.primary};
  cursor: pointer;

  &:hover {
    text-decoration: underline;
  }
`;

const EpisodeSection = styled.section`
  margin-top: 2rem;
`;

export default function WorkDetailContent({ workId }: WorkDetailContentProps) {
  const router = useRouter();
  const { data: work, loading, error, setData: setWork } = useWork(workId);
  const { episodes } = useEpisodes(workId);
  const [isExpanded, setIsExpanded] = useState(false);
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const { bookmarked, toggle: toggleBookmark, toggling } = useBookmarkStatus(workId);
  const { toggleLike, loading: likeLoading } = useToggleWorkLike();

  const handleBookmarkClick = () => {
    if (!isAuthenticated) {
      router.push('/login');
      return;
    }
    toggleBookmark();
  };

  const handleLikeClick = async () => {
    if (!isAuthenticated) {
      router.push('/login');
      return;
    }
    if (!work || likeLoading) return;
    const prevLiked = work.isLiked ?? false;
    const prevCount = work.likeCount;
    setWork({
      ...work,
      isLiked: !prevLiked,
      likeCount: prevLiked ? Math.max(0, prevCount - 1) : prevCount + 1,
    });
    try {
      const result = await toggleLike(workId);
      setWork((prev) =>
        prev ? { ...prev, isLiked: result.liked, likeCount: result.likeCount } : prev,
      );
    } catch {
      setWork((prev) =>
        prev ? { ...prev, isLiked: prevLiked, likeCount: prevCount } : prev,
      );
    }
  };

  // Find the first (lowest number) episode for "첫화 보기"
  const firstEpisode = episodes.length > 0
    ? episodes.reduce((min, ep) => (ep.number < min.number ? ep : min), episodes[0])
    : null;

  if (loading) {
    return (
      <DetailWrapper>
        <Loading />
      </DetailWrapper>
    );
  }

  if (error) {
    return (
      <DetailWrapper>
        <EmptyState
          message="오류가 발생했습니다."
          description={error.message}
        />
      </DetailWrapper>
    );
  }

  if (!work) {
    return (
      <DetailWrapper>
        <EmptyState message="작품을 찾을 수 없습니다." />
      </DetailWrapper>
    );
  }

  const gradient = GENRE_GRADIENTS[work.genre] ?? GENRE_GRADIENTS[Genre.MODERN];
  const genreLabel = GENRE_LABELS[work.genre as Genre] ?? work.genre;
  const synopsis = work.synopsis ?? '';
  const isSynopsisLong = synopsis.length > SYNOPSIS_TRUNCATE_LENGTH;
  const displayedSynopsis =
    isSynopsisLong && !isExpanded
      ? synopsis.slice(0, SYNOPSIS_TRUNCATE_LENGTH) + '...'
      : synopsis;

  return (
    <DetailWrapper>
      <TopSection>
        <CoverArea>
          <CoverContainer $gradient={gradient}>
            {work.coverImageUrl && (
              <CoverImage
                src={work.coverImageUrl}
                alt={work.title}
                loading="eager"
              />
            )}
            <CoverGenreLabel>{genreLabel}</CoverGenreLabel>
          </CoverContainer>
        </CoverArea>

        <InfoArea>
          <Title>{work.title}</Title>
          <Author>작가: {work.authorId || '알 수 없음'}</Author>

          <BadgeRow>
            {work.genre && <Badge variant="genre">{work.genre}</Badge>}
            {work.status && <Badge variant="status">{work.status}</Badge>}
            {work.contentType && (
              <Badge variant="contentType">{work.contentType}</Badge>
            )}
          </BadgeRow>

          <StatsRow>
            <StatItem>
              <Eye />
              {formatNumber(work.viewCount)} 조회
            </StatItem>
            <LikeButton
              type="button"
              $liked={work.isLiked ?? false}
              onClick={handleLikeClick}
              disabled={likeLoading}
              aria-label={work.isLiked ? '좋아요 취소' : '좋아요'}
            >
              <Heart fill={work.isLiked ? '#ef4444' : 'none'} />
              {formatNumber(work.likeCount)} 좋아요
            </LikeButton>
            <StatItem>
              <BookOpen />
              {work.totalEpisodes}화
            </StatItem>
            <StatItem>
              <Star />
              {work.rating > 0 ? work.rating.toFixed(1) : '-'} 점
            </StatItem>
          </StatsRow>

          <StarRating workId={workId} />

          <ActionRow>
            {firstEpisode ? (
              <FirstEpisodeLink
                href={`/works/${work.id}/episodes/${firstEpisode.id}`}
                aria-label="첫화 보기"
              >
                <Button as="span" variant="primary" size="md">
                  첫화 보기
                </Button>
              </FirstEpisodeLink>
            ) : (
              <Button variant="primary" size="md" disabled>
                첫화 보기
              </Button>
            )}
            <BookmarkButton
              type="button"
              variant="outline"
              size="md"
              aria-label={bookmarked ? '북마크 해제' : '북마크'}
              onClick={handleBookmarkClick}
              disabled={toggling}
            >
              {bookmarked ? <BookmarkCheck size={16} /> : <Bookmark size={16} />}
              {bookmarked ? '북마크됨' : '북마크'}
            </BookmarkButton>
          </ActionRow>
        </InfoArea>
      </TopSection>

      {synopsis && (
        <SynopsisSection>
          <SectionLabel>시놉시스</SectionLabel>
          <SynopsisText>
            {displayedSynopsis}
            {isSynopsisLong && (
              <ExpandButton
                type="button"
                onClick={() => setIsExpanded((prev) => !prev)}
                aria-expanded={isExpanded}
              >
                {isExpanded ? '접기' : '더보기'}
              </ExpandButton>
            )}
          </SynopsisText>
        </SynopsisSection>
      )}

      <EpisodeSection>
        <SectionLabel>에피소드 목록</SectionLabel>
        <EpisodeList workId={workId} />
      </EpisodeSection>
    </DetailWrapper>
  );
}
