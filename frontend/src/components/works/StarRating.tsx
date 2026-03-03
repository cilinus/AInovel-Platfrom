'use client';

import { useState, useCallback } from 'react';
import styled from 'styled-components';
import { Star } from 'lucide-react';
import { useAuthStore } from '@/src/stores/authStore';
import { useRating, useSubmitRating } from '@/src/hooks/useRating';
import { formatNumber } from '@/src/lib/utils';

interface StarRatingProps {
  workId: string;
  readonly?: boolean;
}

const RatingWrapper = styled.div`
  display: flex;
  align-items: center;
  gap: 0.75rem;
  margin-top: 0.75rem;
`;

const StarsContainer = styled.div`
  display: flex;
  align-items: center;
  gap: 0.125rem;
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

const RatingText = styled.span`
  font-size: 0.9375rem;
  font-weight: 600;
  color: ${({ theme }) => theme.colors.foreground};
`;

const RatingCount = styled.span`
  font-size: 0.8125rem;
  color: ${({ theme }) => theme.colors.mutedForeground};
`;

const LoginHint = styled.span`
  font-size: 0.8125rem;
  color: ${({ theme }) => theme.colors.mutedForeground};
`;

export default function StarRating({ workId, readonly }: StarRatingProps) {
  const { isAuthenticated } = useAuthStore();
  const { ratingStats, refetch } = useRating(workId);
  const { submitRating } = useSubmitRating();
  const [hoveredStar, setHoveredStar] = useState<number | null>(null);
  const [optimisticScore, setOptimisticScore] = useState<number | null>(null);

  const currentUserRating = optimisticScore ?? ratingStats?.userRating ?? null;
  const averageRating = ratingStats?.averageRating ?? 0;
  const ratingCount = ratingStats?.ratingCount ?? 0;

  const handleClick = useCallback(
    async (score: number) => {
      if (readonly || !isAuthenticated) return;
      const prevScore = currentUserRating;
      setOptimisticScore(score);
      try {
        await submitRating(workId, score);
        refetch();
      } catch {
        setOptimisticScore(prevScore);
      }
    },
    [readonly, isAuthenticated, workId, submitRating, refetch, currentUserRating],
  );

  const isReadonly = readonly || !isAuthenticated;

  return (
    <RatingWrapper>
      <StarsContainer
        onMouseLeave={() => !isReadonly && setHoveredStar(null)}
      >
        {[1, 2, 3, 4, 5].map((star) => {
          const filled = currentUserRating ? star <= currentUserRating : star <= Math.round(averageRating);
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
                size={22}
                fill={filled || hovered ? '#f59e0b' : 'none'}
                strokeWidth={filled || hovered ? 0 : 1.5}
              />
            </StarButton>
          );
        })}
      </StarsContainer>
      <RatingText>
        {averageRating > 0 ? averageRating.toFixed(1) : '-'}
      </RatingText>
      <RatingCount>({formatNumber(ratingCount)})</RatingCount>
      {!isAuthenticated && !readonly && (
        <LoginHint>로그인 후 평가해주세요</LoginHint>
      )}
    </RatingWrapper>
  );
}