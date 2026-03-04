'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import styled from 'styled-components';
import Button from '@/src/components/common/Button';
import { useNovelProjects } from '@/src/hooks/useNovelProjects';
import { GENRE_LABELS, Genre } from '@/src/constants/genres';
import { GENRE_COLORS } from '@/src/types/novel';
import ProjectCreateModal from './ProjectCreateModal';

const PageWrapper = styled.div`
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
`;

const PageHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
`;

const Title = styled.h1`
  font-size: 1.5rem;
  font-weight: 700;
  color: ${({ theme }) => theme.colors.foreground};
  margin: 0;
`;

const TableContainer = styled.div`
  overflow-x: auto;
  border: 1px solid ${({ theme }) => theme.colors.border};
  border-radius: ${({ theme }) => theme.radius.lg};
  background-color: ${({ theme }) => theme.colors.card};
`;

const Table = styled.table`
  width: 100%;
  border-collapse: collapse;
  min-width: 640px;
`;

const Thead = styled.thead`
  border-bottom: 1px solid ${({ theme }) => theme.colors.border};
`;

const Th = styled.th`
  padding: 0.75rem 1rem;
  font-size: 0.8125rem;
  font-weight: 600;
  color: ${({ theme }) => theme.colors.mutedForeground};
  text-align: left;
  white-space: nowrap;
`;

const Tr = styled.tr`
  border-bottom: 1px solid ${({ theme }) => theme.colors.border};
  cursor: pointer;
  transition: background-color 0.15s;

  &:last-child {
    border-bottom: none;
  }

  &:hover {
    background-color: ${({ theme }) => theme.colors.muted};
  }
`;

const Td = styled.td`
  padding: 0.75rem 1rem;
  font-size: 0.875rem;
  color: ${({ theme }) => theme.colors.foreground};
  white-space: nowrap;
`;

const TitleCell = styled(Td)`
  font-weight: 500;
  max-width: 240px;
  overflow: hidden;
  text-overflow: ellipsis;
`;

const GenreBadge = styled.span<{ $color: string }>`
  font-size: 0.75rem;
  font-weight: 500;
  padding: 0.125rem 0.5rem;
  border-radius: 9999px;
  background-color: ${({ $color }) => $color}20;
  color: ${({ $color }) => $color};
`;

const StatusBadge = styled.span<{ $status: string }>`
  font-size: 0.75rem;
  font-weight: 500;
  padding: 0.125rem 0.5rem;
  border-radius: ${({ theme }) => theme.radius.sm};
  background-color: ${({ $status, theme }) => {
    switch ($status) {
      case 'ACTIVE':
        return theme.colors.success + '20';
      case 'COMPLETED':
        return theme.colors.primary + '20';
      case 'ARCHIVED':
        return theme.colors.mutedForeground + '20';
      default:
        return theme.colors.muted;
    }
  }};
  color: ${({ $status, theme }) => {
    switch ($status) {
      case 'ACTIVE':
        return theme.colors.success;
      case 'COMPLETED':
        return theme.colors.primary;
      case 'ARCHIVED':
        return theme.colors.mutedForeground;
      default:
        return theme.colors.foreground;
    }
  }};
`;

const EmptyState = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 3rem;
  color: ${({ theme }) => theme.colors.mutedForeground};
  text-align: center;
  gap: 1rem;
`;

const EmptyText = styled.p`
  font-size: 0.875rem;
  margin: 0;
`;

const LoadingText = styled.p`
  font-size: 0.875rem;
  color: ${({ theme }) => theme.colors.mutedForeground};
  text-align: center;
  padding: 2rem;
`;

const ErrorText = styled.p`
  font-size: 0.875rem;
  color: ${({ theme }) => theme.colors.destructive};
  text-align: center;
  padding: 2rem;
`;

const STATUS_LABELS: Record<string, string> = {
  ACTIVE: '진행중',
  COMPLETED: '완료',
  ARCHIVED: '보관',
};

function formatDate(dateStr: string): string {
  const date = new Date(dateStr);
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}.${m}.${d}`;
}

export default function NovelProjectsPage() {
  const router = useRouter();
  const { projects, loading, error, fetchProjects } = useNovelProjects();
  const [modalOpen, setModalOpen] = useState(false);

  useEffect(() => {
    fetchProjects();
  }, [fetchProjects]);

  const projectList = Array.isArray(projects) ? projects : [];

  return (
    <PageWrapper>
      <PageHeader>
        <Title>AI 소설 프로젝트</Title>
        <Button variant="primary" size="sm" onClick={() => setModalOpen(true)}>
          새 프로젝트
        </Button>
      </PageHeader>

      {loading && <LoadingText>불러오는 중...</LoadingText>}
      {error && <ErrorText>{error}</ErrorText>}

      {!loading && !error && projectList.length === 0 && (
        <EmptyState>
          <EmptyText>아직 프로젝트가 없습니다</EmptyText>
          <Button variant="primary" onClick={() => setModalOpen(true)}>
            첫 프로젝트 만들기
          </Button>
        </EmptyState>
      )}

      {!loading && projectList.length > 0 && (
        <TableContainer>
          <Table>
            <Thead>
              <tr>
                <Th>제목</Th>
                <Th>장르</Th>
                <Th>챕터수</Th>
                <Th>글자수</Th>
                <Th>상태</Th>
                <Th>생성일</Th>
              </tr>
            </Thead>
            <tbody>
              {projectList.map((project) => {
                const genreColor =
                  GENRE_COLORS[project.genre as Genre] ?? '#64748b';
                const genreLabel =
                  GENRE_LABELS[project.genre as Genre] ?? project.genre;

                return (
                  <Tr
                    key={project._id}
                    onClick={() =>
                      router.push(`/author/novel/${project._id}`)
                    }
                  >
                    <TitleCell>{project.title}</TitleCell>
                    <Td>
                      <GenreBadge $color={genreColor}>{genreLabel}</GenreBadge>
                    </Td>
                    <Td>{project.totalChapters ?? 0}</Td>
                    <Td>{(project.totalWordCount ?? 0).toLocaleString()}</Td>
                    <Td>
                      <StatusBadge $status={project.status}>
                        {STATUS_LABELS[project.status] ?? project.status}
                      </StatusBadge>
                    </Td>
                    <Td>{formatDate(project.createdAt)}</Td>
                  </Tr>
                );
              })}
            </tbody>
          </Table>
        </TableContainer>
      )}

      <ProjectCreateModal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
      />
    </PageWrapper>
  );
}