'use client';

import React, { useState, useMemo } from 'react';
import styled from 'styled-components';
import Link from 'next/link';
import { ArrowUpDown, Lock, BookOpen } from 'lucide-react';
import { useEpisodes } from '@/src/hooks/useEpisodes';
import { formatDate } from '@/src/lib/utils';
import Loading from '@/src/components/common/Loading';
import EmptyState from '@/src/components/common/EmptyState';
import Pagination from '@/src/components/common/Pagination';
import Button from '@/src/components/common/Button';
import type { Episode } from '@/src/types/episode';

interface EpisodeListProps {
  workId: string;
}

const EPISODES_PER_PAGE = 20;

const Container = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0;
`;

const Header = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0.75rem 0;
  margin-bottom: 0.5rem;
`;

const EpisodeCount = styled.span`
  font-size: 0.875rem;
  color: ${({ theme }) => theme.colors.mutedForeground};
  font-weight: 500;
`;

const SortButton = styled(Button)`
  display: inline-flex;
  align-items: center;
  gap: 0.375rem;
  font-size: 0.875rem;
`;

const List = styled.ul`
  list-style: none;
  margin: 0;
  padding: 0;
  border: 1px solid ${({ theme }) => theme.colors.border};
  border-radius: ${({ theme }) => theme.radius.lg};
  overflow: hidden;
`;

const EpisodeRow = styled.li<{ $even: boolean }>`
  background-color: ${({ $even, theme }) =>
    $even ? theme.colors.muted : theme.colors.card};

  &:not(:last-child) {
    border-bottom: 1px solid ${({ theme }) => theme.colors.border};
  }
`;

const EpisodeLink = styled(Link)`
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0.875rem 1rem;
  text-decoration: none;
  color: inherit;
  transition: background-color 0.15s ease;

  &:hover {
    background-color: ${({ theme }) => theme.colors.primary}0a;
  }
`;

const LeftSection = styled.div`
  display: flex;
  align-items: center;
  gap: 0.75rem;
  min-width: 0;
`;

const EpisodeNumber = styled.span`
  font-weight: 700;
  font-family: 'SFMono-Regular', 'Consolas', 'Liberation Mono', monospace;
  font-size: 0.875rem;
  color: ${({ theme }) => theme.colors.mutedForeground};
  min-width: 2.5rem;
  flex-shrink: 0;
`;

const EpisodeTitle = styled.span`
  font-size: 0.9375rem;
  font-weight: 500;
  color: ${({ theme }) => theme.colors.foreground};
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
`;

const RightSection = styled.div`
  display: flex;
  align-items: center;
  gap: 1rem;
  flex-shrink: 0;
`;

const DateText = styled.span`
  font-size: 0.8125rem;
  color: ${({ theme }) => theme.colors.mutedForeground};

  @media (max-width: ${({ theme }) => theme.breakpoints.sm}) {
    display: none;
  }
`;

const FreeLabel = styled.span`
  font-size: 0.8125rem;
  font-weight: 600;
  color: ${({ theme }) => theme.colors.success};
`;

const PaidLabel = styled.span`
  display: inline-flex;
  align-items: center;
  gap: 0.25rem;
  font-size: 0.8125rem;
  font-weight: 500;
  color: ${({ theme }) => theme.colors.mutedForeground};
`;

const PaginationWrapper = styled.div`
  display: flex;
  justify-content: center;
  padding: 1.5rem 0;
`;

const ErrorMessage = styled.p`
  text-align: center;
  color: ${({ theme }) => theme.colors.destructive};
  padding: 2rem;
  font-size: 0.9375rem;
`;

export default function EpisodeList({ workId }: EpisodeListProps) {
  const { episodes, loading, error } = useEpisodes(workId);
  const [sortOrder, setSortOrder] = useState<'newest' | 'oldest'>('newest');
  const [currentPage, setCurrentPage] = useState(1);

  const sortedEpisodes = useMemo(() => {
    const sorted = [...episodes].sort((a, b) => {
      if (sortOrder === 'newest') {
        return b.number - a.number;
      }
      return a.number - b.number;
    });
    return sorted;
  }, [episodes, sortOrder]);

  const totalPages = Math.ceil(sortedEpisodes.length / EPISODES_PER_PAGE);

  const paginatedEpisodes = useMemo(() => {
    const start = (currentPage - 1) * EPISODES_PER_PAGE;
    return sortedEpisodes.slice(start, start + EPISODES_PER_PAGE);
  }, [sortedEpisodes, currentPage]);

  const handleSortToggle = () => {
    setSortOrder((prev) => (prev === 'newest' ? 'oldest' : 'newest'));
    setCurrentPage(1);
  };

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  if (loading) {
    return <Loading />;
  }

  if (error) {
    return <ErrorMessage>{error.message}</ErrorMessage>;
  }

  if (episodes.length === 0) {
    return (
      <EmptyState
        icon={<BookOpen />}
        message="등록된 에피소드가 없습니다."
        description="아직 공개된 에피소드가 없습니다."
      />
    );
  }

  return (
    <Container>
      <Header>
        <EpisodeCount>
          총 {episodes.length}화
        </EpisodeCount>
        <SortButton
          type="button"
          variant="ghost"
          size="sm"
          onClick={handleSortToggle}
          aria-label={`정렬: ${sortOrder === 'newest' ? '최신순' : '오래된순'}`}
        >
          <ArrowUpDown size={14} />
          {sortOrder === 'newest' ? '최신순' : '오래된순'}
        </SortButton>
      </Header>

      <List role="list">
        {paginatedEpisodes.map((episode: Episode, index: number) => (
          <EpisodeRow key={episode.id} $even={index % 2 === 0}>
            <EpisodeLink
              href={`/works/${workId}/episodes/${episode.id}`}
              aria-label={`${episode.number}화 ${episode.title}`}
            >
              <LeftSection>
                <EpisodeNumber>#{episode.number}</EpisodeNumber>
                <EpisodeTitle>{episode.title}</EpisodeTitle>
              </LeftSection>
              <RightSection>
                <DateText>{formatDate(episode.createdAt)}</DateText>
                {episode.isFree ? (
                  <FreeLabel>무료</FreeLabel>
                ) : (
                  <PaidLabel>
                    <Lock size={13} />
                    {episode.price}토큰
                  </PaidLabel>
                )}
              </RightSection>
            </EpisodeLink>
          </EpisodeRow>
        ))}
      </List>

      {totalPages > 1 && (
        <PaginationWrapper>
          <Pagination
            currentPage={currentPage}
            totalPages={totalPages}
            onPageChange={handlePageChange}
          />
        </PaginationWrapper>
      )}
    </Container>
  );
}