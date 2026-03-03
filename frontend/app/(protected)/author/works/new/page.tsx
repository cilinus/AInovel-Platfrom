'use client';

import styled from 'styled-components';
import WorkCreateForm from '@/src/components/author/WorkCreateForm';

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

export default function NewWorkPage() {
  return (
    <PageWrapper>
      <PageTitle>새 작품 등록</PageTitle>
      <WorkCreateForm />
    </PageWrapper>
  );
}