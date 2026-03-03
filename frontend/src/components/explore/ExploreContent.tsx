'use client';

import React, { useCallback, useMemo } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import styled from 'styled-components';
import { useWorks } from '@/src/hooks/useWorks';
import SearchBar from '@/src/components/common/SearchBar';
import GenreTabBar from '@/src/components/works/GenreTabBar';
import FilterBar from './FilterBar';
import WorkGrid from '@/src/components/works/WorkGrid';
import Pagination from '@/src/components/common/Pagination';
import Loading from '@/src/components/common/Loading';

const ITEMS_PER_PAGE = 20;

const ExploreWrapper = styled.div`
  max-width: 1280px;
  margin: 0 auto;
  padding: 2rem 1rem;
`;

const PageTitle = styled.h1`
  font-size: 1.75rem;
  font-weight: 700;
  margin-bottom: 1.5rem;
  color: ${({ theme }) => theme.colors.foreground};
`;

const SearchBarWrapper = styled.div`
  margin-bottom: 1rem;
`;

const GenreTabBarWrapper = styled.div`
  margin-bottom: 0;
`;

const ResultInfo = styled.p`
  font-size: 0.875rem;
  color: ${({ theme }) => theme.colors.mutedForeground};
  margin-bottom: 1rem;
`;

const ContentSection = styled.div`
  min-height: 300px;
`;

const ErrorBox = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  min-height: 200px;
  padding: 2rem;
  border-radius: ${({ theme }) => theme.radius.lg};
  background: ${({ theme }) => theme.colors.destructive}10;
  border: 1px solid ${({ theme }) => theme.colors.destructive}40;
`;

const ErrorTitle = styled.p`
  font-size: 1rem;
  font-weight: 600;
  color: ${({ theme }) => theme.colors.destructive};
  margin-bottom: 0.5rem;
`;

const ErrorDetail = styled.p`
  font-size: 0.875rem;
  color: ${({ theme }) => theme.colors.mutedForeground};
  text-align: center;
`;

const RetryButton = styled.button`
  margin-top: 1rem;
  padding: 0.5rem 1.25rem;
  border-radius: ${({ theme }) => theme.radius.md};
  border: 1px solid ${({ theme }) => theme.colors.border};
  background: ${({ theme }) => theme.colors.background};
  color: ${({ theme }) => theme.colors.foreground};
  font-size: 0.875rem;
  cursor: pointer;

  &:hover {
    background: ${({ theme }) => theme.colors.muted};
  }
`;

const PaginationWrapper = styled.div`
  margin-top: 2rem;
`;

function buildUpdatedParams(
  current: URLSearchParams,
  updates: Record<string, string | null>,
): string {
  const params = new URLSearchParams(current.toString());
  Object.entries(updates).forEach(([key, value]) => {
    if (value === null || value === '') {
      params.delete(key);
    } else {
      params.set(key, value);
    }
  });
  const str = params.toString();
  return str ? `?${str}` : '';
}

export default function ExploreContent() {
  const searchParams = useSearchParams();
  const router = useRouter();

  const genre = searchParams.get('genre') ?? '';
  const sortBy = searchParams.get('sort') ?? 'latest';
  const statusFilter = searchParams.get('status') ?? '';
  const contentTypeFilter = searchParams.get('contentType') ?? '';
  const searchQuery = searchParams.get('q') ?? '';
  const page = parseInt(searchParams.get('page') ?? '1', 10) || 1;

  const worksParams = useMemo(
    () => ({
      ...(genre ? { genre } : {}),
      sort: sortBy,
      ...(statusFilter ? { status: statusFilter } : {}),
      ...(contentTypeFilter ? { contentType: contentTypeFilter } : {}),
      ...(searchQuery ? { search: searchQuery } : {}),
      page,
      limit: ITEMS_PER_PAGE,
    }),
    [genre, sortBy, statusFilter, contentTypeFilter, searchQuery, page],
  );

  const { data, loading, error, refetch } = useWorks(worksParams);

  const works = data?.items ?? [];
  const totalCount = data?.total ?? 0;
  const totalPages = data?.totalPages ?? Math.max(1, Math.ceil(totalCount / ITEMS_PER_PAGE));

  const updateParams = useCallback(
    (updates: Record<string, string | null>) => {
      const queryString = buildUpdatedParams(searchParams, updates);
      router.push(`/explore${queryString}`);
    },
    [searchParams, router],
  );

  const handleGenreChange = useCallback(
    (newGenre: string | null) => {
      updateParams({ genre: newGenre, page: null });
    },
    [updateParams],
  );

  const handleSortChange = useCallback(
    (newSort: string) => {
      updateParams({ sort: newSort === 'latest' ? null : newSort, page: null });
    },
    [updateParams],
  );

  const handleStatusChange = useCallback(
    (newStatus: string) => {
      updateParams({ status: newStatus || null, page: null });
    },
    [updateParams],
  );

  const handleContentTypeChange = useCallback(
    (newType: string) => {
      updateParams({ contentType: newType || null, page: null });
    },
    [updateParams],
  );

  const handleSearch = useCallback(
    (query: string) => {
      updateParams({ q: query || null, page: null });
    },
    [updateParams],
  );

  const handlePageChange = useCallback(
    (newPage: number) => {
      updateParams({ page: newPage <= 1 ? null : String(newPage) });
      window.scrollTo({ top: 0, behavior: 'smooth' });
    },
    [updateParams],
  );

  return (
    <ExploreWrapper>
      <PageTitle>작품 탐색</PageTitle>

      <SearchBarWrapper>
        <SearchBar
          onSearch={handleSearch}
          initialValue={searchQuery}
          placeholder="제목, 작가, 태그로 검색"
        />
      </SearchBarWrapper>

      <GenreTabBarWrapper>
        <GenreTabBar
          selectedGenre={genre || null}
          onGenreChange={handleGenreChange}
        />
      </GenreTabBarWrapper>

      <FilterBar
        sortBy={sortBy}
        onSortChange={handleSortChange}
        statusFilter={statusFilter}
        onStatusChange={handleStatusChange}
        contentTypeFilter={contentTypeFilter}
        onContentTypeChange={handleContentTypeChange}
      />

      <ResultInfo>
        총 {totalCount.toLocaleString()}개 작품
      </ResultInfo>

      <ContentSection>
        {loading ? (
          <Loading />
        ) : error ? (
          <ErrorBox>
            <ErrorTitle>작품을 불러올 수 없습니다</ErrorTitle>
            <ErrorDetail>{error.message}</ErrorDetail>
            <RetryButton onClick={() => refetch()}>다시 시도</RetryButton>
          </ErrorBox>
        ) : (
          <WorkGrid works={works} emptyMessage="검색 결과가 없습니다." />
        )}
      </ContentSection>

      <PaginationWrapper>
        <Pagination
          currentPage={page}
          totalPages={totalPages}
          onPageChange={handlePageChange}
        />
      </PaginationWrapper>
    </ExploreWrapper>
  );
}
