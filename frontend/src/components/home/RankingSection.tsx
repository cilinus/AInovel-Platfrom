'use client';

import React, { useState, useMemo } from 'react';
import Link from 'next/link';
import styled from 'styled-components';
import { Eye, Heart } from 'lucide-react';
import { Genre, GENRE_LABELS } from '@/src/constants/genres';
import { useWorks } from '@/src/hooks/useWorks';
import { formatNumber } from '@/src/lib/utils';
import SectionTitle from '@/src/components/common/SectionTitle';
import GenreTabBar from '@/src/components/works/GenreTabBar';
import Badge from '@/src/components/common/Badge';
import Loading from '@/src/components/common/Loading';

const GENRE_GRADIENTS: Record<Genre, string> = {
  [Genre.ROMANCE]: 'linear-gradient(135deg, #ec4899, #f43f5e)',
  [Genre.FANTASY]: 'linear-gradient(135deg, #a855f7, #6366f1)',
  [Genre.MARTIAL_ARTS]: 'linear-gradient(135deg, #f59e0b, #f97316)',
  [Genre.MODERN]: 'linear-gradient(135deg, #38bdf8, #3b82f6)',
  [Genre.MYSTERY]: 'linear-gradient(135deg, #64748b, #6b7280)',
  [Genre.SF]: 'linear-gradient(135deg, #06b6d4, #14b8a6)',
};

const Container = styled.section`
  margin-bottom: 3rem;
`;

const TabWrapper = styled.div`
  margin-bottom: 1rem;
`;

const RankingList = styled.div`
  display: flex;
  flex-direction: column;

  @media (min-width: ${({ theme }) => theme.breakpoints.lg}) {
    display: grid;
    grid-template-columns: 1fr 1fr;
    column-gap: 2rem;
  }
`;

const RankingItemLink = styled(Link)`
  text-decoration: none;
  color: inherit;
  display: block;
`;

const RankingItem = styled.div`
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 0.75rem 0;
  border-bottom: 1px solid ${({ theme }) => theme.colors.border};
  transition: background 0.15s;

  &:hover {
    background: ${({ theme }) => theme.colors.muted};
  }
`;

const RankNumber = styled.span<{ $isTop: boolean }>`
  font-size: 1.25rem;
  font-weight: 700;
  width: 2rem;
  text-align: center;
  flex-shrink: 0;
  color: ${({ $isTop, theme }) =>
    $isTop ? theme.colors.primary : theme.colors.mutedForeground};
`;

const Thumbnail = styled.div<{ $gradient: string }>`
  width: 48px;
  height: 64px;
  border-radius: ${({ theme }) => theme.radius.sm};
  background: ${({ $gradient }) => $gradient};
  flex-shrink: 0;
  overflow: hidden;
`;

const ThumbnailImage = styled.img`
  width: 100%;
  height: 100%;
  object-fit: cover;
`;

const InfoArea = styled.div`
  flex: 1;
  min-width: 0;
`;

const ItemTitle = styled.h3`
  font-size: 0.9375rem;
  font-weight: 600;
  color: ${({ theme }) => theme.colors.foreground};
  margin: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
`;

const AuthorName = styled.p`
  font-size: 0.8125rem;
  color: ${({ theme }) => theme.colors.mutedForeground};
  margin: 0.125rem 0 0.25rem;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
`;

const StatsArea = styled.div`
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  gap: 0.125rem;
  flex-shrink: 0;
`;

const StatChip = styled.span`
  display: inline-flex;
  align-items: center;
  gap: 0.25rem;
  font-size: 0.75rem;
  color: ${({ theme }) => theme.colors.mutedForeground};

  & > svg {
    width: 12px;
    height: 12px;
  }
`;

const EmptyMessage = styled.p`
  text-align: center;
  padding: 2rem 0;
  color: ${({ theme }) => theme.colors.mutedForeground};
  font-size: 0.9375rem;
`;

const ErrorBox = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 120px;
  padding: 1.5rem;
  border-radius: ${({ theme }) => theme.radius.lg};
  background: ${({ theme }) => theme.colors.destructive}10;
  border: 1px solid ${({ theme }) => theme.colors.destructive}40;
`;

const ErrorText = styled.p`
  font-size: 0.875rem;
  color: ${({ theme }) => theme.colors.destructive};
  text-align: center;
`;

export default function RankingSection() {
  const [selectedGenre, setSelectedGenre] = useState<string | null>(null);

  const params = useMemo(
    () => ({
      ...(selectedGenre ? { genre: selectedGenre } : {}),
      sort: 'popular' as const,
      limit: 10,
    }),
    [selectedGenre],
  );

  const { data, loading, error } = useWorks(params);

  const works = data?.items ?? [];

  return (
    <Container>
      <SectionTitle title="인기 랭킹" moreLink="/explore?sort=popular" />
      <TabWrapper>
        <GenreTabBar
          selectedGenre={selectedGenre}
          onGenreChange={setSelectedGenre}
        />
      </TabWrapper>

      {loading ? (
        <Loading />
      ) : error ? (
        <ErrorBox><ErrorText>{error.message}</ErrorText></ErrorBox>
      ) : works.length === 0 ? (
        <EmptyMessage>랭킹 데이터가 없습니다.</EmptyMessage>
      ) : (
        <RankingList>
          {works.map((work, index) => {
            const rank = index + 1;
            const isTop = rank <= 3;
            const genre = work.genre as Genre;
            const gradient =
              GENRE_GRADIENTS[genre] || GENRE_GRADIENTS[Genre.MODERN];

            return (
              <RankingItemLink
                key={work.id}
                href={`/works/${work.id}`}
              >
                <RankingItem>
                  <RankNumber $isTop={isTop}>{rank}</RankNumber>
                  <Thumbnail $gradient={gradient}>
                    {work.coverImageUrl && (
                      <ThumbnailImage
                        src={work.coverImageUrl}
                        alt={work.title}
                        loading="lazy"
                      />
                    )}
                  </Thumbnail>
                  <InfoArea>
                    <ItemTitle title={work.title}>{work.title}</ItemTitle>
                    <AuthorName>{work.authorId}</AuthorName>
                    <Badge variant="genre">{work.genre}</Badge>
                  </InfoArea>
                  <StatsArea>
                    <StatChip>
                      <Eye />
                      {formatNumber(work.viewCount)}
                    </StatChip>
                    <StatChip>
                      <Heart />
                      {formatNumber(work.likeCount)}
                    </StatChip>
                  </StatsArea>
                </RankingItem>
              </RankingItemLink>
            );
          })}
        </RankingList>
      )}
    </Container>
  );
}
