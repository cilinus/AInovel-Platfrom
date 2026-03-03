'use client';

import React from 'react';
import Link from 'next/link';
import styled from 'styled-components';
import { Eye, Heart } from 'lucide-react';
import type { Work } from '@/src/types/work';
import { Genre, GENRE_LABELS } from '@/src/constants/genres';
import { formatNumber } from '@/src/lib/utils';
import Badge from '@/src/components/common/Badge';

interface WorkCardProps {
  work: Work;
  variant?: 'default' | 'compact';
}

const GENRE_GRADIENTS: Record<Genre, string> = {
  [Genre.ROMANCE]: 'linear-gradient(135deg, #ec4899, #f43f5e)',
  [Genre.FANTASY]: 'linear-gradient(135deg, #a855f7, #6366f1)',
  [Genre.MARTIAL_ARTS]: 'linear-gradient(135deg, #f59e0b, #f97316)',
  [Genre.MODERN]: 'linear-gradient(135deg, #38bdf8, #3b82f6)',
  [Genre.MYSTERY]: 'linear-gradient(135deg, #64748b, #6b7280)',
  [Genre.SF]: 'linear-gradient(135deg, #06b6d4, #14b8a6)',
};

const CardLink = styled(Link)`
  text-decoration: none;
  color: inherit;
  display: block;
`;

const CoverContainer = styled.div<{ $gradient: string }>`
  position: relative;
  width: 100%;
  padding-top: 133.33%;
  border-radius: ${({ theme }) => theme.radius.md};
  overflow: hidden;
  background: ${({ $gradient }) => $gradient};
  transition: transform 0.2s ease;
`;

const CoverImage = styled.img`
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  object-fit: cover;
`;

const CoverLabel = styled.span`
  position: absolute;
  bottom: 0.5rem;
  left: 0.5rem;
  font-size: 0.75rem;
  font-weight: 500;
  color: rgba(255, 255, 255, 0.85);
  background: rgba(0, 0, 0, 0.3);
  padding: 0.125rem 0.5rem;
  border-radius: 9999px;
  backdrop-filter: blur(4px);
`;

const DefaultCard = styled.div`
  width: 100%;
  cursor: pointer;

  &:hover ${CoverContainer} {
    transform: scale(1.03);
  }
`;

const Info = styled.div`
  padding-top: 0.625rem;
`;

const Title = styled.h3`
  font-size: 0.9375rem;
  font-weight: 600;
  color: ${({ theme }) => theme.colors.foreground};
  margin: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
`;

const Author = styled.p`
  font-size: 0.8125rem;
  color: ${({ theme }) => theme.colors.mutedForeground};
  margin: 0.125rem 0 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
`;

const BadgeRow = styled.div`
  display: flex;
  align-items: center;
  gap: 0.375rem;
  margin-top: 0.375rem;
  flex-wrap: wrap;
`;

const StatsRow = styled.div`
  display: flex;
  align-items: center;
  gap: 0.75rem;
  margin-top: 0.375rem;
`;

const Stat = styled.span`
  display: inline-flex;
  align-items: center;
  gap: 0.25rem;
  font-size: 0.75rem;
  color: ${({ theme }) => theme.colors.mutedForeground};

  & > svg {
    width: 14px;
    height: 14px;
  }
`;

const CompactCard = styled.div`
  width: 140px;
  min-width: 140px;
  cursor: pointer;

  &:hover ${CoverContainer} {
    transform: scale(1.03);
  }
`;

const CompactInfo = styled.div`
  padding-top: 0.5rem;
`;

const CompactTitle = styled.h3`
  font-size: 0.8125rem;
  font-weight: 600;
  color: ${({ theme }) => theme.colors.foreground};
  margin: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
`;

const CompactAuthor = styled.p`
  font-size: 0.75rem;
  color: ${({ theme }) => theme.colors.mutedForeground};
  margin: 0.125rem 0 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
`;

export default function WorkCard({ work, variant = 'default' }: WorkCardProps) {
  const gradient = GENRE_GRADIENTS[work.genre] || GENRE_GRADIENTS[Genre.MODERN];
  const genreLabel = GENRE_LABELS[work.genre] || work.genre;

  if (variant === 'compact') {
    return (
      <CardLink href={`/works/${work.id}`}>
        <CompactCard>
          <CoverContainer $gradient={gradient}>
            {work.coverImageUrl && (
              <CoverImage
                src={work.coverImageUrl}
                alt={work.title}
                loading="lazy"
              />
            )}
            <CoverLabel>{genreLabel}</CoverLabel>
          </CoverContainer>
          <CompactInfo>
            <CompactTitle title={work.title}>{work.title}</CompactTitle>
            <CompactAuthor>{work.authorId}</CompactAuthor>
          </CompactInfo>
        </CompactCard>
      </CardLink>
    );
  }

  return (
    <CardLink href={`/works/${work.id}`}>
      <DefaultCard>
        <CoverContainer $gradient={gradient}>
          {work.coverImageUrl && (
            <CoverImage
              src={work.coverImageUrl}
              alt={work.title}
              loading="lazy"
            />
          )}
          <CoverLabel>{genreLabel}</CoverLabel>
        </CoverContainer>
        <Info>
          <Title title={work.title}>{work.title}</Title>
          <Author>{work.authorId}</Author>
          <BadgeRow>
            <Badge variant="genre">{work.genre}</Badge>
            <Badge variant="status">{work.status}</Badge>
          </BadgeRow>
          <StatsRow>
            <Stat>
              <Eye />
              {formatNumber(work.viewCount)}
            </Stat>
            <Stat>
              <Heart />
              {formatNumber(work.likeCount)}
            </Stat>
          </StatsRow>
        </Info>
      </DefaultCard>
    </CardLink>
  );
}