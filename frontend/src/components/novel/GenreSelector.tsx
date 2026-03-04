'use client';

import styled from 'styled-components';
import { Genre, GENRE_LABELS, SUB_GENRES } from '@/src/constants/genres';
import { GENRE_COLORS } from '@/src/types/novel';
import { useNovelStore } from '@/src/stores/novelStore';

const SectionLabel = styled.label`
  font-size: 0.875rem;
  font-weight: 500;
  color: ${({ theme }) => theme.colors.foreground};
`;

const GenreGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 0.5rem;

  @media (max-width: ${({ theme }) => theme.breakpoints.sm}) {
    grid-template-columns: repeat(2, 1fr);
  }
`;

const GenreCard = styled.button<{ $color: string; $selected: boolean }>`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 0.25rem;
  padding: 0.75rem 0.5rem;
  border-radius: ${({ theme }) => theme.radius.md};
  border: 2px solid ${({ $selected, $color }) => ($selected ? $color : 'transparent')};
  background-color: ${({ $selected, $color }) =>
    $selected ? `${$color}15` : 'transparent'};
  cursor: pointer;
  transition: all 0.15s;

  &:hover {
    background-color: ${({ $color }) => `${$color}10`};
  }
`;

const GenreIcon = styled.span<{ $color: string }>`
  width: 2rem;
  height: 2rem;
  border-radius: 50%;
  background-color: ${({ $color }) => `${$color}20`};
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 0.875rem;
`;

const GenreName = styled.span`
  font-size: 0.8125rem;
  font-weight: 500;
  color: ${({ theme }) => theme.colors.foreground};
`;

const SubGenreSelect = styled.select`
  width: 100%;
  padding: 0.5rem 0.75rem;
  font-size: 0.875rem;
  border: 1px solid ${({ theme }) => theme.colors.border};
  border-radius: ${({ theme }) => theme.radius.md};
  background-color: ${({ theme }) => theme.colors.background};
  color: ${({ theme }) => theme.colors.foreground};
  outline: none;
  cursor: pointer;

  &:focus {
    border-color: ${({ theme }) => theme.colors.primary};
    box-shadow: 0 0 0 3px ${({ theme }) => theme.colors.primary}20;
  }
`;

const GENRE_ICONS: Record<Genre, string> = {
  [Genre.ROMANCE]: '\u2764',
  [Genre.FANTASY]: '\u2728',
  [Genre.MARTIAL_ARTS]: '\u2694',
  [Genre.MODERN]: '\uD83C\uDFD9',
  [Genre.MYSTERY]: '\uD83D\uDD0D',
  [Genre.SF]: '\uD83D\uDE80',
};

interface GenreSelectorProps {
  value?: string;
  subGenreValue?: string;
  onChange?: (genre: string) => void;
  onSubGenreChange?: (subGenre: string) => void;
}

export default function GenreSelector({ value, subGenreValue, onChange, onSubGenreChange }: GenreSelectorProps = {}) {
  const storeGenre = useNovelStore((s) => s.settings.genre);
  const storeSubGenre = useNovelStore((s) => s.settings.subGenre);
  const storeSetGenre = useNovelStore((s) => s.setGenre);
  const storeSetSubGenre = useNovelStore((s) => s.setSubGenre);

  const selectedGenre = (value as Genre | undefined) ?? storeGenre;
  const selectedSubGenre = subGenreValue ?? storeSubGenre;

  const handleGenreClick = (g: Genre) => {
    const newValue = selectedGenre === g ? '' : g;
    if (onChange) {
      onChange(newValue);
    } else {
      storeSetGenre(newValue === '' ? null : g);
    }
    if (onSubGenreChange) {
      onSubGenreChange('');
    } else {
      storeSetSubGenre(null);
    }
  };

  const handleSubGenreChange = (val: string) => {
    if (onSubGenreChange) {
      onSubGenreChange(val);
    } else {
      storeSetSubGenre(val || null);
    }
  };

  const genres = Object.values(Genre);

  return (
    <div>
      <SectionLabel>장르 선택</SectionLabel>
      <GenreGrid style={{ marginTop: '0.5rem' }}>
        {genres.map((g) => (
          <GenreCard
            key={g}
            type="button"
            $color={GENRE_COLORS[g]}
            $selected={selectedGenre === g}
            onClick={() => handleGenreClick(g)}
            aria-pressed={selectedGenre === g}
          >
            <GenreIcon $color={GENRE_COLORS[g]}>{GENRE_ICONS[g]}</GenreIcon>
            <GenreName>{GENRE_LABELS[g]}</GenreName>
          </GenreCard>
        ))}
      </GenreGrid>

      {selectedGenre && SUB_GENRES[selectedGenre as Genre]?.length > 0 && (
        <SubGenreSelect
          value={selectedSubGenre || ''}
          onChange={(e) => handleSubGenreChange(e.target.value)}
          style={{ marginTop: '0.75rem' }}
          aria-label="세부 장르 선택"
        >
          <option value="">세부 장르 선택 (선택사항)</option>
          {SUB_GENRES[selectedGenre as Genre].map((sg) => (
            <option key={sg.id} value={sg.id}>
              {sg.label}
            </option>
          ))}
        </SubGenreSelect>
      )}
    </div>
  );
}