'use client';

import { use } from 'react';
import { useSearchParams } from 'next/navigation';
import styled from 'styled-components';
import EpisodeCreateForm from '@/src/components/author/EpisodeCreateForm';

const PageWrapper = styled.div`
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
`;

const PageTitle = styled.h1`
  font-size: 1.5rem;
  font-weight: 700;
  color: ${({ theme }) => theme.colors.foreground};
  margin: 0;
`;

export default function NewEpisodePage({ params }: { params: Promise<{ workId: string }> }) {
  const { workId } = use(params);
  const searchParams = useSearchParams();
  const positionParam = searchParams.get('position');
  const insertPosition = positionParam ? parseInt(positionParam, 10) : undefined;

  return (
    <PageWrapper>
      <PageTitle>
        {insertPosition !== undefined ? `에피소드 삽입 (Ch.${String(insertPosition).padStart(3, '0')})` : '새 에피소드 등록'}
      </PageTitle>
      <EpisodeCreateForm workId={workId} insertPosition={insertPosition} />
    </PageWrapper>
  );
}