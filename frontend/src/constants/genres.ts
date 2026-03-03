export enum Genre {
  ROMANCE = 'ROMANCE',
  FANTASY = 'FANTASY',
  MARTIAL_ARTS = 'MARTIAL_ARTS',
  MODERN = 'MODERN',
  MYSTERY = 'MYSTERY',
  SF = 'SF',
}

export const GENRE_LABELS: Record<Genre, string> = {
  [Genre.ROMANCE]: '로맨스',
  [Genre.FANTASY]: '판타지',
  [Genre.MARTIAL_ARTS]: '무협',
  [Genre.MODERN]: '현대물',
  [Genre.MYSTERY]: '미스터리',
  [Genre.SF]: 'SF',
};

export const SUB_GENRES: Record<Genre, { id: string; label: string }[]> = {
  [Genre.ROMANCE]: [
    { id: 'modern', label: '현대' },
    { id: 'fantasy', label: '판타지' },
    { id: 'historical', label: '역사' },
    { id: 'bl', label: 'BL' },
    { id: 'gl', label: 'GL' },
  ],
  [Genre.FANTASY]: [
    { id: 'classic', label: '정통' },
    { id: 'modern', label: '현대' },
    { id: 'fusion', label: '퓨전' },
    { id: 'game', label: '게임판타지' },
  ],
  [Genre.MARTIAL_ARTS]: [
    { id: 'classic', label: '정통무협' },
    { id: 'new', label: '신무협' },
    { id: 'modern', label: '현대무협' },
  ],
  [Genre.MODERN]: [
    { id: 'school', label: '학원' },
    { id: 'sports', label: '스포츠' },
    { id: 'daily', label: '일상' },
    { id: 'drama', label: '드라마' },
  ],
  [Genre.MYSTERY]: [
    { id: 'detective', label: '추리' },
    { id: 'thriller', label: '스릴러' },
    { id: 'horror', label: '호러' },
  ],
  [Genre.SF]: [
    { id: 'cyberpunk', label: '사이버펑크' },
    { id: 'space', label: '우주' },
    { id: 'post_apocalypse', label: '포스트아포칼립스' },
  ],
};
