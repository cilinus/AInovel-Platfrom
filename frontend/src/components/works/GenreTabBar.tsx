'use client';

import React from 'react';
import styled from 'styled-components';
import { Genre, GENRE_LABELS } from '@/src/constants/genres';

interface GenreTabBarProps {
  selectedGenre: string | null;
  onGenreChange: (genre: string | null) => void;
}

const Container = styled.div`
  border-bottom: 1px solid ${({ theme }) => theme.colors.border};
  overflow-x: auto;

  &::-webkit-scrollbar {
    display: none;
  }
  scrollbar-width: none;
`;

const TabList = styled.div`
  display: flex;
  gap: 0;
  min-width: max-content;
`;

const Tab = styled.button<{ $active: boolean }>`
  display: inline-flex;
  align-items: center;
  justify-content: center;
  padding: 0.5rem 1rem;
  font-size: 0.875rem;
  font-weight: ${({ $active }) => ($active ? 600 : 400)};
  color: ${({ $active, theme }) =>
    $active ? theme.colors.primary : theme.colors.mutedForeground};
  background: none;
  border: none;
  border-bottom: 2px solid
    ${({ $active, theme }) => ($active ? theme.colors.primary : 'transparent')};
  cursor: pointer;
  white-space: nowrap;
  transition: color 0.2s, border-color 0.2s;

  &:hover {
    color: ${({ $active, theme }) =>
      $active ? theme.colors.primary : theme.colors.primaryHover};
  }
`;

const genreEntries = Object.values(Genre);

export default function GenreTabBar({ selectedGenre, onGenreChange }: GenreTabBarProps) {
  return (
    <Container role="tablist" aria-label="장르 선택">
      <TabList>
        <Tab
          type="button"
          role="tab"
          $active={selectedGenre === null}
          aria-selected={selectedGenre === null}
          onClick={() => onGenreChange(null)}
        >
          전체
        </Tab>
        {genreEntries.map((genre) => (
          <Tab
            key={genre}
            type="button"
            role="tab"
            $active={selectedGenre === genre}
            aria-selected={selectedGenre === genre}
            onClick={() => onGenreChange(genre)}
          >
            {GENRE_LABELS[genre]}
          </Tab>
        ))}
      </TabList>
    </Container>
  );
}