'use client';

import React, { useMemo } from 'react';
import styled, { css } from 'styled-components';
import { ChevronLeft, ChevronRight } from 'lucide-react';

interface PaginationProps {
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
}

const Container = styled.nav`
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.25rem;
`;

const PageButton = styled.button<{ $active?: boolean }>`
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-width: 2.25rem;
  height: 2.25rem;
  padding: 0 0.375rem;
  border: none;
  border-radius: ${({ theme }) => theme.radius.md};
  font-size: 0.875rem;
  font-weight: 500;
  background: transparent;
  color: ${({ theme }) => theme.colors.foreground};
  cursor: pointer;
  transition: background-color 0.2s, color 0.2s;

  &:hover:not(:disabled) {
    background-color: ${({ theme }) => theme.colors.muted};
  }

  &:disabled {
    opacity: 0.4;
    cursor: not-allowed;
  }

  ${({ $active, theme }) =>
    $active &&
    css`
      background-color: ${theme.colors.primary};
      color: #ffffff;

      &:hover:not(:disabled) {
        background-color: ${theme.colors.primaryHover};
      }
    `}
`;

const Ellipsis = styled.span`
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-width: 2.25rem;
  height: 2.25rem;
  font-size: 0.875rem;
  color: ${({ theme }) => theme.colors.mutedForeground};
  user-select: none;
`;

function computePageRange(current: number, total: number): (number | 'ellipsis')[] {
  const maxVisible = 5;

  if (total <= maxVisible) {
    return Array.from({ length: total }, (_, i) => i + 1);
  }

  const pages: (number | 'ellipsis')[] = [];

  if (current <= 3) {
    for (let i = 1; i <= 4; i++) {
      pages.push(i);
    }
    pages.push('ellipsis');
    pages.push(total);
  } else if (current >= total - 2) {
    pages.push(1);
    pages.push('ellipsis');
    for (let i = total - 3; i <= total; i++) {
      pages.push(i);
    }
  } else {
    pages.push(1);
    pages.push('ellipsis');
    pages.push(current - 1);
    pages.push(current);
    pages.push(current + 1);
    pages.push('ellipsis');
    pages.push(total);
  }

  return pages;
}

export default function Pagination({ currentPage, totalPages, onPageChange }: PaginationProps) {
  const pages = useMemo(() => computePageRange(currentPage, totalPages), [currentPage, totalPages]);

  if (totalPages <= 1) {
    return null;
  }

  return (
    <Container aria-label="페이지 네비게이션">
      <PageButton
        type="button"
        onClick={() => onPageChange(currentPage - 1)}
        disabled={currentPage <= 1}
        aria-label="이전 페이지"
      >
        <ChevronLeft size={16} />
      </PageButton>

      {pages.map((page, index) => {
        if (page === 'ellipsis') {
          return <Ellipsis key={`ellipsis-${index}`}>...</Ellipsis>;
        }

        return (
          <PageButton
            key={page}
            type="button"
            $active={page === currentPage}
            onClick={() => onPageChange(page)}
            aria-label={`${page}페이지`}
            aria-current={page === currentPage ? 'page' : undefined}
          >
            {page}
          </PageButton>
        );
      })}

      <PageButton
        type="button"
        onClick={() => onPageChange(currentPage + 1)}
        disabled={currentPage >= totalPages}
        aria-label="다음 페이지"
      >
        <ChevronRight size={16} />
      </PageButton>
    </Container>
  );
}