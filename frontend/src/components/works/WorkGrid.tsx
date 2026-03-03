'use client';

import React from 'react';
import styled from 'styled-components';
import { BookOpen } from 'lucide-react';
import type { Work } from '@/src/types/work';
import EmptyState from '@/src/components/common/EmptyState';
import WorkCard from './WorkCard';

interface WorkGridProps {
  works: Work[];
  emptyMessage?: string;
}

const Grid = styled.div`
  display: grid;
  grid-template-columns: 1fr;
  row-gap: 1.5rem;
  column-gap: 1rem;

  @media (min-width: ${({ theme }) => theme.breakpoints.sm}) {
    grid-template-columns: repeat(2, 1fr);
  }

  @media (min-width: ${({ theme }) => theme.breakpoints.lg}) {
    grid-template-columns: repeat(3, 1fr);
  }

  @media (min-width: ${({ theme }) => theme.breakpoints.xl}) {
    grid-template-columns: repeat(4, 1fr);
  }
`;

export default function WorkGrid({
  works,
  emptyMessage = '작품이 없습니다.',
}: WorkGridProps) {
  if (works.length === 0) {
    return (
      <EmptyState
        icon={<BookOpen />}
        message={emptyMessage}
      />
    );
  }

  return (
    <Grid>
      {works.map((work) => (
        <WorkCard key={work.id} work={work} variant="default" />
      ))}
    </Grid>
  );
}