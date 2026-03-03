'use client';

import { use, useState, useCallback } from 'react';
import styled from 'styled-components';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { PlusCircle, PenLine, Eye, Heart, Star, ArrowUpDown } from 'lucide-react';
import { useWork } from '@/src/hooks/useWorks';
import { useEpisodes } from '@/src/hooks/useEpisodes';
import { useReorderEpisodes, useAuthorEpisodes } from '@/src/hooks/useAuthorWorks';
import { GENRE_LABELS, Genre } from '@/src/constants/genres';
import { formatNumber } from '@/src/lib/utils';
import Badge from '@/src/components/common/Badge';
import Button from '@/src/components/common/Button';
import Loading from '@/src/components/common/Loading';
import EmptyState from '@/src/components/common/EmptyState';
import EpisodeSequenceManager from '@/src/components/author/EpisodeSequenceManager';

const PageWrapper = styled.div`
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
`;

const WorkHeader = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
`;

const TitleRow = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  flex-wrap: wrap;
  gap: 0.75rem;
`;

const WorkTitle = styled.h1`
  font-size: 1.5rem;
  font-weight: 700;
  color: ${({ theme }) => theme.colors.foreground};
  margin: 0;
`;

const MetaRow = styled.div`
  display: flex;
  align-items: center;
  gap: 1rem;
  flex-wrap: wrap;
`;

const MetaItem = styled.span`
  display: inline-flex;
  align-items: center;
  gap: 0.25rem;
  font-size: 0.8125rem;
  color: ${({ theme }) => theme.colors.mutedForeground};
`;

const ActionGroup = styled.div`
  display: flex;
  align-items: center;
  gap: 0.5rem;
`;

const ActionLink = styled(Link)`
  display: inline-flex;
`;

const EpisodeSection = styled.section`
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
`;

const SectionTitle = styled.h2`
  font-size: 1.125rem;
  font-weight: 600;
  color: ${({ theme }) => theme.colors.foreground};
  margin: 0;
`;

const EpisodeRow = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0.75rem 1rem;
  border: 1px solid ${({ theme }) => theme.colors.border};
  border-radius: ${({ theme }) => theme.radius.md};
`;

const EpisodeInfo = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.125rem;
`;

const EpisodeTitle = styled.span`
  font-size: 0.9375rem;
  font-weight: 500;
  color: ${({ theme }) => theme.colors.foreground};
`;

const EpisodeMeta = styled.span`
  font-size: 0.8125rem;
  color: ${({ theme }) => theme.colors.mutedForeground};
`;

const EpisodeActions = styled.div`
  display: flex;
  align-items: center;
  gap: 0.5rem;
`;

const FreeBadge = styled.span`
  font-size: 0.75rem;
  font-weight: 600;
  color: ${({ theme }) => theme.colors.primary};
  background-color: ${({ theme }) => theme.colors.primary}10;
  padding: 0.125rem 0.5rem;
  border-radius: 9999px;
`;

const EditIconLink = styled(Link)`
  display: inline-flex;
  align-items: center;
  justify-content: center;
  padding: 0.25rem;
  color: ${({ theme }) => theme.colors.mutedForeground};
  border-radius: ${({ theme }) => theme.radius.sm};
  transition: color 0.2s;

  &:hover {
    color: ${({ theme }) => theme.colors.primary};
  }
`;

export default function AuthorWorkDetailPage({ params }: { params: Promise<{ workId: string }> }) {
  const { workId } = use(params);
  const router = useRouter();
  const { data: work, loading: workLoading, error: workError } = useWork(workId);
  const { episodes, loading: episodesLoading } = useEpisodes(workId);
  const { episodes: authorEpisodes, loading: authorEpisodesLoading, refetch: refetchAuthorEpisodes } = useAuthorEpisodes(workId);
  const { reorderEpisodes } = useReorderEpisodes();
  const [isReorderMode, setIsReorderMode] = useState(false);

  const handleReorderSave = useCallback(async (orders: { episodeId: string; episodeNumber: number }[]) => {
    await reorderEpisodes(workId, orders);
    await refetchAuthorEpisodes();
    setIsReorderMode(false);
  }, [workId, reorderEpisodes, refetchAuthorEpisodes]);

  const handleInsert = useCallback((position: number) => {
    router.push(`/author/works/${workId}/episodes/new?position=${position}`);
  }, [workId, router]);

  if (workLoading) return <Loading />;
  if (workError || !work) {
    return <EmptyState message="작품을 찾을 수 없습니다." />;
  }

  const sequenceEpisodes = (authorEpisodes ?? []).map((ep: any) => ({
    id: ep._id ?? ep.id,
    number: ep.episodeNumber ?? ep.number,
    title: ep.title,
    isPublished: ep.isPublished ?? true,
    wordCount: ep.wordCount,
  }));

  return (
    <PageWrapper>
      <WorkHeader>
        <TitleRow>
          <WorkTitle>{work.title}</WorkTitle>
          <ActionGroup>
            <ActionLink href={`/author/works/${workId}/edit`}>
              <Button as="span" variant="outline" size="sm">
                <PenLine size={14} style={{ marginRight: '0.25rem' }} />
                작품 수정
              </Button>
            </ActionLink>
            <Button
              variant={isReorderMode ? 'primary' : 'outline'}
              size="sm"
              onClick={() => setIsReorderMode((prev) => !prev)}
            >
              <ArrowUpDown size={14} style={{ marginRight: '0.25rem' }} />
              순서 관리
            </Button>
            <ActionLink href={`/author/works/${workId}/episodes/new`}>
              <Button as="span" variant="primary" size="sm">
                <PlusCircle size={14} style={{ marginRight: '0.25rem' }} />
                새 에피소드
              </Button>
            </ActionLink>
          </ActionGroup>
        </TitleRow>
        <MetaRow>
          <Badge variant="genre">{GENRE_LABELS[work.genre as Genre] ?? work.genre}</Badge>
          <Badge variant="status">{work.status}</Badge>
          <MetaItem><Eye size={14} /> {formatNumber(work.viewCount)}</MetaItem>
          <MetaItem><Heart size={14} /> {formatNumber(work.likeCount)}</MetaItem>
          <MetaItem><Star size={14} /> {work.rating > 0 ? work.rating.toFixed(1) : '-'}</MetaItem>
        </MetaRow>
      </WorkHeader>

      <EpisodeSection>
        <SectionTitle>에피소드 ({episodes?.length ?? 0}화)</SectionTitle>

        {isReorderMode ? (
          authorEpisodesLoading ? (
            <Loading />
          ) : sequenceEpisodes.length === 0 ? (
            <EmptyState message="순서를 변경할 에피소드가 없습니다." />
          ) : (
            <EpisodeSequenceManager
              workId={workId}
              episodes={sequenceEpisodes}
              onSave={handleReorderSave}
              onInsert={handleInsert}
            />
          )
        ) : (
          <>
            {episodesLoading && <Loading />}
            {!episodesLoading && (!episodes || episodes.length === 0) && (
              <EmptyState message="아직 에피소드가 없습니다." description="첫 에피소드를 작성해보세요." />
            )}
            {episodes?.map((ep) => (
              <EpisodeRow key={ep.id}>
                <EpisodeInfo>
                  <EpisodeTitle>{ep.title}</EpisodeTitle>
                  <EpisodeMeta>
                    {ep.wordCount}자 | {formatNumber(ep.viewCount)} 조회
                  </EpisodeMeta>
                </EpisodeInfo>
                <EpisodeActions>
                  {ep.isFree && <FreeBadge>무료</FreeBadge>}
                  <EditIconLink href={`/author/works/${workId}/episodes/${ep.id}/edit`}>
                    <PenLine size={14} />
                  </EditIconLink>
                </EpisodeActions>
              </EpisodeRow>
            ))}
          </>
        )}
      </EpisodeSection>
    </PageWrapper>
  );
}