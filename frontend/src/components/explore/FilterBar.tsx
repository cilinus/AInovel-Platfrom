'use client';

import React from 'react';
import styled, { css } from 'styled-components';

interface FilterBarProps {
  sortBy: string;
  onSortChange: (sort: string) => void;
  statusFilter: string;
  onStatusChange: (status: string) => void;
  contentTypeFilter: string;
  onContentTypeChange: (type: string) => void;
}

const SORT_OPTIONS = [
  { value: 'latest', label: '최신순' },
  { value: 'popular', label: '인기순' },
  { value: 'rating', label: '평점순' },
] as const;

const STATUS_OPTIONS = [
  { value: '', label: '전체' },
  { value: 'ONGOING', label: '연재중' },
  { value: 'COMPLETED', label: '완결' },
] as const;

const CONTENT_TYPE_OPTIONS = [
  { value: '', label: '전체' },
  { value: 'HUMAN', label: '창작' },
  { value: 'AI', label: 'AI' },
  { value: 'HYBRID', label: '하이브리드' },
] as const;

const Container = styled.div`
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 0.75rem;
  padding: 0.75rem 0;
`;

const SortSelect = styled.select`
  appearance: none;
  background-color: ${({ theme }) => theme.colors.muted};
  border: 1px solid ${({ theme }) => theme.colors.border};
  border-radius: ${({ theme }) => theme.radius.md};
  padding: 0.5rem 2rem 0.5rem 0.75rem;
  font-size: 0.875rem;
  color: ${({ theme }) => theme.colors.foreground};
  cursor: pointer;
  outline: none;
  transition: border-color 0.2s, box-shadow 0.2s;
  background-image: url("data:image/svg+xml;charset=utf-8,%3Csvg xmlns='http://www.w3.org/2000/svg' width='16' height='16' viewBox='0 0 24 24' fill='none' stroke='%2364748b' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpath d='m6 9 6 6 6-6'/%3E%3C/svg%3E");
  background-repeat: no-repeat;
  background-position: right 0.5rem center;
  background-size: 1rem;

  &:focus {
    border-color: ${({ theme }) => theme.colors.primary};
    box-shadow: 0 0 0 3px ${({ theme }) => theme.colors.primary}20;
  }
`;

const ButtonGroup = styled.div`
  display: flex;
  align-items: center;
  gap: 0.25rem;
`;

const ToggleButton = styled.button<{ $active: boolean }>`
  padding: 0.375rem 0.75rem;
  font-size: 0.8125rem;
  font-weight: 500;
  border: none;
  border-radius: 9999px;
  cursor: pointer;
  white-space: nowrap;
  transition: background-color 0.2s, color 0.2s;

  ${({ $active, theme }) =>
    $active
      ? css`
          background-color: ${theme.colors.primary};
          color: #ffffff;
        `
      : css`
          background-color: transparent;
          color: ${theme.colors.mutedForeground};

          &:hover {
            background-color: ${theme.colors.muted};
            color: ${theme.colors.foreground};
          }
        `}
`;

const Separator = styled.div`
  width: 1px;
  height: 1.25rem;
  background-color: ${({ theme }) => theme.colors.border};
`;

export default function FilterBar({
  sortBy,
  onSortChange,
  statusFilter,
  onStatusChange,
  contentTypeFilter,
  onContentTypeChange,
}: FilterBarProps) {
  return (
    <Container>
      <SortSelect
        value={sortBy}
        onChange={(e) => onSortChange(e.target.value)}
        aria-label="정렬 방식"
      >
        {SORT_OPTIONS.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </SortSelect>

      <Separator />

      <ButtonGroup role="group" aria-label="연재 상태 필터">
        {STATUS_OPTIONS.map((option) => (
          <ToggleButton
            key={option.value}
            type="button"
            $active={statusFilter === option.value}
            onClick={() => onStatusChange(option.value)}
            aria-pressed={statusFilter === option.value}
          >
            {option.label}
          </ToggleButton>
        ))}
      </ButtonGroup>

      <Separator />

      <ButtonGroup role="group" aria-label="콘텐츠 유형 필터">
        {CONTENT_TYPE_OPTIONS.map((option) => (
          <ToggleButton
            key={option.value}
            type="button"
            $active={contentTypeFilter === option.value}
            onClick={() => onContentTypeChange(option.value)}
            aria-pressed={contentTypeFilter === option.value}
          >
            {option.label}
          </ToggleButton>
        ))}
      </ButtonGroup>
    </Container>
  );
}