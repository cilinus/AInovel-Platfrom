'use client';

import styled from 'styled-components';
import Link from 'next/link';
import { PlusCircle } from 'lucide-react';
import { useAuthorWorks } from '@/src/hooks/useAuthorWorks';
import { GENRE_LABELS, Genre } from '@/src/constants/genres';
import { formatNumber } from '@/src/lib/utils';
import Button from '@/src/components/common/Button';
import Badge from '@/src/components/common/Badge';
import Loading from '@/src/components/common/Loading';

const PageWrapper = styled.div`
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
`;

const PageHeader = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
`;

const PageTitle = styled.h1`
  font-size: 1.5rem;
  font-weight: 700;
  color: ${({ theme }) => theme.colors.foreground};
  margin: 0;
`;

const NewWorkLink = styled(Link)`
  display: inline-flex;
`;

const Table = styled.table`
  width: 100%;
  border-collapse: collapse;
`;

const Th = styled.th`
  text-align: left;
  font-size: 0.8125rem;
  font-weight: 600;
  color: ${({ theme }) => theme.colors.mutedForeground};
  padding: 0.75rem 0.5rem;
  border-bottom: 2px solid ${({ theme }) => theme.colors.border};
`;

const Td = styled.td`
  font-size: 0.875rem;
  color: ${({ theme }) => theme.colors.foreground};
  padding: 0.75rem 0.5rem;
  border-bottom: 1px solid ${({ theme }) => theme.colors.border};
  vertical-align: middle;
`;

const TitleLink = styled(Link)`
  font-weight: 500;
  color: ${({ theme }) => theme.colors.foreground};
  transition: color 0.15s;

  &:hover {
    color: ${({ theme }) => theme.colors.primary};
  }
`;

const EmptyText = styled.p`
  font-size: 0.875rem;
  color: ${({ theme }) => theme.colors.mutedForeground};
  text-align: center;
  padding: 3rem;
`;

const ErrorText = styled.p`
  font-size: 0.875rem;
  color: ${({ theme }) => theme.colors.destructive};
  text-align: center;
  padding: 2rem;
`;

export default function AuthorWorksPage() {
  const { works, loading, error } = useAuthorWorks();

  if (loading) return <Loading />;

  return (
    <PageWrapper>
      <PageHeader>
        <PageTitle>내 작품</PageTitle>
        <NewWorkLink href="/author/works/new">
          <Button as="span" variant="primary" size="sm">
            <PlusCircle size={14} style={{ marginRight: '0.25rem' }} />
            새 작품
          </Button>
        </NewWorkLink>
      </PageHeader>

      {error && <ErrorText>{error.message}</ErrorText>}

      {!error && works.length === 0 ? (
        <EmptyText>등록된 작품이 없습니다.</EmptyText>
      ) : (
        <Table>
          <thead>
            <tr>
              <Th>제목</Th>
              <Th>장르</Th>
              <Th>상태</Th>
              <Th>에피소드</Th>
              <Th>조회수</Th>
            </tr>
          </thead>
          <tbody>
            {works.map((work) => (
              <tr key={work.id}>
                <Td>
                  <TitleLink href={`/author/works/${work.id}`}>
                    {work.title}
                  </TitleLink>
                </Td>
                <Td>{GENRE_LABELS[work.genre as Genre] ?? work.genre}</Td>
                <Td><Badge variant="status">{work.status}</Badge></Td>
                <Td>{work.totalEpisodes}화</Td>
                <Td>{formatNumber(work.viewCount)}</Td>
              </tr>
            ))}
          </tbody>
        </Table>
      )}
    </PageWrapper>
  );
}