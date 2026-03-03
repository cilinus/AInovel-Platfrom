'use client';

import styled from 'styled-components';
import Link from 'next/link';
import { BookOpen, FileText, Eye, PlusCircle } from 'lucide-react';
import { useAuthorWorks } from '@/src/hooks/useAuthorWorks';
import { formatNumber } from '@/src/lib/utils';
import Button from '@/src/components/common/Button';
import Loading from '@/src/components/common/Loading';

const PageWrapper = styled.div`
  display: flex;
  flex-direction: column;
  gap: 2rem;
`;

const PageTitle = styled.h1`
  font-size: 1.5rem;
  font-weight: 700;
  color: ${({ theme }) => theme.colors.foreground};
  margin: 0;
`;

const StatsGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 1rem;

  @media (max-width: ${({ theme }) => theme.breakpoints.sm}) {
    grid-template-columns: 1fr;
  }
`;

const StatCard = styled.div`
  padding: 1.25rem;
  border: 1px solid ${({ theme }) => theme.colors.border};
  border-radius: ${({ theme }) => theme.radius.lg};
  background-color: ${({ theme }) => theme.colors.card};
`;

const StatLabel = styled.div`
  display: flex;
  align-items: center;
  gap: 0.375rem;
  font-size: 0.8125rem;
  color: ${({ theme }) => theme.colors.mutedForeground};
  margin-bottom: 0.5rem;
`;

const StatValue = styled.div`
  font-size: 1.75rem;
  font-weight: 700;
  color: ${({ theme }) => theme.colors.foreground};
`;

const SectionHeader = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
`;

const SectionTitle = styled.h2`
  font-size: 1.125rem;
  font-weight: 600;
  color: ${({ theme }) => theme.colors.foreground};
  margin: 0;
`;

const WorkList = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
`;

const WorkRow = styled(Link)`
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0.875rem 1rem;
  border: 1px solid ${({ theme }) => theme.colors.border};
  border-radius: ${({ theme }) => theme.radius.md};
  transition: background-color 0.15s;

  &:hover {
    background-color: ${({ theme }) => theme.colors.muted};
  }
`;

const WorkInfo = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.125rem;
`;

const WorkTitle = styled.span`
  font-size: 0.9375rem;
  font-weight: 500;
  color: ${({ theme }) => theme.colors.foreground};
`;

const WorkMeta = styled.span`
  font-size: 0.8125rem;
  color: ${({ theme }) => theme.colors.mutedForeground};
`;

const NewWorkLink = styled(Link)`
  display: inline-flex;
`;

const EmptyText = styled.p`
  font-size: 0.875rem;
  color: ${({ theme }) => theme.colors.mutedForeground};
  text-align: center;
  padding: 2rem;
`;

export default function AuthorDashboardPage() {
  const { works, loading } = useAuthorWorks();

  const totalEpisodes = works.reduce((sum, w) => sum + w.totalEpisodes, 0);
  const totalViews = works.reduce((sum, w) => sum + w.viewCount, 0);

  if (loading) return <Loading />;

  return (
    <PageWrapper>
      <PageTitle>작가 대시보드</PageTitle>

      <StatsGrid>
        <StatCard>
          <StatLabel><BookOpen size={14} /> 작품 수</StatLabel>
          <StatValue>{works.length}</StatValue>
        </StatCard>
        <StatCard>
          <StatLabel><FileText size={14} /> 총 에피소드</StatLabel>
          <StatValue>{totalEpisodes}</StatValue>
        </StatCard>
        <StatCard>
          <StatLabel><Eye size={14} /> 총 조회수</StatLabel>
          <StatValue>{formatNumber(totalViews)}</StatValue>
        </StatCard>
      </StatsGrid>

      <div>
        <SectionHeader>
          <SectionTitle>최근 작품</SectionTitle>
          <NewWorkLink href="/author/works/new">
            <Button as="span" variant="primary" size="sm">
              <PlusCircle size={14} style={{ marginRight: '0.25rem' }} />
              새 작품 등록
            </Button>
          </NewWorkLink>
        </SectionHeader>

        <WorkList>
          {works.length === 0 && (
            <EmptyText>등록된 작품이 없습니다. 첫 작품을 등록해보세요!</EmptyText>
          )}
          {works.slice(0, 5).map((work) => (
            <WorkRow key={work.id} href={`/author/works/${work.id}`}>
              <WorkInfo>
                <WorkTitle>{work.title}</WorkTitle>
                <WorkMeta>
                  {work.genre} | {work.totalEpisodes}화 | {formatNumber(work.viewCount)} 조회
                </WorkMeta>
              </WorkInfo>
            </WorkRow>
          ))}
        </WorkList>
      </div>
    </PageWrapper>
  );
}