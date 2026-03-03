'use client';

import React from 'react';
import styled, { css } from 'styled-components';
import { Genre, GENRE_LABELS } from '@/src/constants/genres';
import { WorkStatus, type ContentType } from '@/src/types/work';

type BadgeVariant = 'genre' | 'status' | 'contentType' | 'default';

interface BadgeProps {
  variant?: BadgeVariant;
  children: React.ReactNode;
  color?: string;
}

interface StyledBadgeStyleProps {
  $bgColor: string;
  $textColor: string;
}

const StyledBadge = styled.span<StyledBadgeStyleProps>`
  display: inline-flex;
  align-items: center;
  font-size: 0.75rem;
  font-weight: 500;
  padding: 0.125rem 0.5rem;
  border-radius: 9999px;
  white-space: nowrap;
  line-height: 1.5;
  background-color: ${({ $bgColor }) => $bgColor};
  color: ${({ $textColor }) => $textColor};
`;

const STATUS_COLORS: Record<string, { bg: string; text: string }> = {
  [WorkStatus.ONGOING]: { bg: '#dcfce7', text: '#166534' },
  [WorkStatus.COMPLETED]: { bg: '#dbeafe', text: '#1e40af' },
  [WorkStatus.HIATUS]: { bg: '#fef9c3', text: '#854d0e' },
  [WorkStatus.DRAFT]: { bg: '#f1f5f9', text: '#475569' },
};

const CONTENT_TYPE_COLORS: Record<string, { bg: string; text: string }> = {
  HUMAN: { bg: '#ccfbf1', text: '#115e59' },
  AI: { bg: '#ede9fe', text: '#5b21b6' },
  HYBRID: { bg: '#ffedd5', text: '#9a3412' },
};

function resolveColors(
  variant: BadgeVariant,
  children: React.ReactNode,
  color?: string,
): { bg: string; text: string } {
  if (color) {
    return { bg: `${color}20`, text: color };
  }

  const childString = typeof children === 'string' ? children : '';

  switch (variant) {
    case 'genre': {
      return { bg: '#ede9fe', text: '#5b21b6' };
    }
    case 'status': {
      const statusColors = STATUS_COLORS[childString];
      if (statusColors) {
        return statusColors;
      }
      return { bg: '#f1f5f9', text: '#475569' };
    }
    case 'contentType': {
      const ctColors = CONTENT_TYPE_COLORS[childString];
      if (ctColors) {
        return ctColors;
      }
      return { bg: '#f1f5f9', text: '#475569' };
    }
    default:
      return { bg: '#f1f5f9', text: '#475569' };
  }
}

const STATUS_LABELS: Record<string, string> = {
  [WorkStatus.ONGOING]: '연재중',
  [WorkStatus.COMPLETED]: '완결',
  [WorkStatus.HIATUS]: '휴재',
  [WorkStatus.DRAFT]: '임시저장',
};

const CONTENT_TYPE_LABELS: Record<string, string> = {
  HUMAN: '직접 집필',
  AI: 'AI 생성',
  HYBRID: '협업',
};

function resolveLabel(variant: BadgeVariant, children: React.ReactNode): React.ReactNode {
  const childString = typeof children === 'string' ? children : '';

  switch (variant) {
    case 'genre': {
      const genreLabel = GENRE_LABELS[childString as Genre];
      return genreLabel || children;
    }
    case 'status': {
      const statusLabel = STATUS_LABELS[childString];
      return statusLabel || children;
    }
    case 'contentType': {
      const ctLabel = CONTENT_TYPE_LABELS[childString];
      return ctLabel || children;
    }
    default:
      return children;
  }
}

export default function Badge({ variant = 'default', children, color }: BadgeProps) {
  const colors = resolveColors(variant, children, color);
  const label = resolveLabel(variant, children);

  return (
    <StyledBadge $bgColor={colors.bg} $textColor={colors.text}>
      {label}
    </StyledBadge>
  );
}