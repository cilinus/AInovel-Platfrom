'use client';

import { use } from 'react';
import styled from 'styled-components';
import EpisodeEditForm from '@/src/components/author/EpisodeEditForm';

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

export default function EditEpisodePage({ params }: { params: Promise<{ workId: string; episodeId: string }> }) {
  const { workId, episodeId } = use(params);

  return (
    <PageWrapper>
      <PageTitle>에피소드 수정</PageTitle>
      <EpisodeEditForm workId={workId} episodeId={episodeId} />
    </PageWrapper>
  );
}
