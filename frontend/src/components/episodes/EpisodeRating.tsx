'use client';

import { useState, useCallback } from 'react';
import styled from 'styled-components';
import { Star } from 'lucide-react';
import { useAuthStore } from '@/src/stores/authStore';
import { useEpisodeRating, useSubmitEpisodeRating } from '@/src/hooks/useEpisodeRating';
import { formatNumber } from '@/src/lib/utils';

interface EpisodeRatingProps {
  workId: string;
  episodeId: string;
}

const RatingSection = styled.div`
  margin: 2.5rem 0;
  padding: 1.5rem;
  border: 1px solid ${({ theme }) => theme.colors.border};
  border-radius: ${({ theme }) => theme.radius.lg};
  background-color: ${({ theme }) => theme.colors.card};
  text-align: center;
`;

const RatingLabel = styled.p`
  font-size: 0.9375rem;
  font-weight: 600;
  color: ${({ theme }) => theme.colors.foreground};
  margin: 0 0 0.75rem;
`;

const StarsContainer = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.25rem;
`;

const StarButton = styled.button<{ $filled: boolean; $hovered: boolean }>`
  background: none;
  border: none;
  padding: 0.125rem;
  cursor: pointer;
  color: ${({ $filled, $hovered }) =>
    $filled || $hovered ? '#f59e0b' : '#d1d5db'};
  transition: color 0.15s, transform 0.15s;
  display: inline-flex;

  &:hover {
    transform: scale(1.15);
  }

  &:disabled {
    cursor: default;
    &:hover {
      transform: none;
    }
  }
`;

const RatingInfo = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  margin-top: 0.5rem;
`;

const RatingText = styled.span`
  font-size: 1rem;
  font-weight: 600;
  color: ${({ theme }) => theme.colors.foreground};
`;

const RatingCount = styled.span`
  font-size: 0.8125rem;
  color: ${({ theme }) => theme.colors.mutedForeground};
`;

const LoginHint = styled.p`
  font-size: 0.8125rem;
  color: ${({ theme }) => theme.colors.mutedForeground};
  margin: 0.5rem 0 0;
`;

export default function EpisodeRating({ workId, episodeId }: EpisodeRatingProps) {
  const { isAuthenticated } = useAuthStore();
  const { ratingStats, refetch } = useEpisodeRating(workId, episodeId);
  const { submitRating } = useSubmitEpisodeRating();
  const [hoveredStar, setHoveredStar] = useState<number | null>(null);
  const [optimisticScore, setOptimisticScore] = useState<number | null>(null);

  const currentUserRating = optimisticScore ?? ratingStats?.userRating ?? null;
  const averageRating = ratingStats?.averageRating ?? 0;
  const ratingCount = ratingStats?.ratingCount ?? 0;

  const handleClick = useCallback(
    async (score: number) => {
      if (!isAuthenticated) return;
      const prevScore = currentUserRating;
      setOptimisticScore(score);
      try {
        await submitRating(workId, episodeId, score);
        refetch();
      } catch {
        setOptimisticScore(prevScore);
      }
    },
    [isAuthenticated, workId, episodeId, submitRating, refetch, currentUserRating],
  );

  const isReadonly = !isAuthenticated;

  return (
    <RatingSection>
      <RatingLabel>이 에피소드를 평가해주세요</RatingLabel>
      <StarsContainer
        onMouseLeave={() => !isReadonly && setHoveredStar(null)}
      >
        {[1, 2, 3, 4, 5].map((star) => {
          const filled = currentUserRating
            ? star <= currentUserRating
            : star <= Math.round(averageRating);
          const hovered = hoveredStar !== null && star <= hoveredStar;
          return (
            <StarButton
              key={star}
              type="button"
              $filled={filled}
              $hovered={hovered}
              disabled={isReadonly}
              onMouseEnter={() => !isReadonly && setHoveredStar(star)}
              onClick={() => handleClick(star)}
              aria-label={`${star}점`}
            >
              <Star
                size={28}
                fill={filled || hovered ? '#f59e0b' : 'none'}
                strokeWidth={filled || hovered ? 0 : 1.5}
              />
            </StarButton>
          );
        })}
      </StarsContainer>
      <RatingInfo>
        <RatingText>
          {averageRating > 0 ? averageRating.toFixed(1) : '-'}
        </RatingText>
        <RatingCount>({formatNumber(ratingCount)})</RatingCount>
      </RatingInfo>
      {!isAuthenticated && (
        <LoginHint>로그인 후 평가해주세요</LoginHint>
      )}
    </RatingSection>
  );
}
