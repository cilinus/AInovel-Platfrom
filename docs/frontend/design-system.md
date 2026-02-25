# 디자인 시스템

## 개요

스토리AI 디자인 시스템은 모바일 퍼스트 웹소설 플랫폼에 최적화된 토큰 기반 시스템이다.
Tailwind CSS v4의 `@theme` directive를 활용하여 CSS 변수 기반의 라이트/다크 테마를 구현한다.

---

## 컬러 토큰 시스템

### 시맨틱 컬러 토큰

```css
/* styles/globals.css */
@import 'tailwindcss';

@theme {
  /* 브랜드 컬러 */
  --color-brand-50: oklch(0.97 0.01 275);
  --color-brand-100: oklch(0.93 0.03 275);
  --color-brand-500: oklch(0.55 0.22 275);   /* 인디고 계열 메인 */
  --color-brand-600: oklch(0.48 0.22 275);
  --color-brand-700: oklch(0.40 0.20 275);

  /* 반응형 breakpoints */
  --breakpoint-sm: 375px;
  --breakpoint-md: 768px;
  --breakpoint-lg: 1280px;
  --breakpoint-xl: 1440px;
}

/* 라이트 테마 (기본) */
:root {
  --background: oklch(1 0 0);
  --foreground: oklch(0.15 0 0);

  --card: oklch(1 0 0);
  --card-foreground: oklch(0.15 0 0);

  --primary: oklch(0.55 0.22 275);
  --primary-foreground: oklch(1 0 0);

  --secondary: oklch(0.96 0.01 260);
  --secondary-foreground: oklch(0.25 0 0);

  --muted: oklch(0.96 0.005 260);
  --muted-foreground: oklch(0.55 0.01 260);

  --accent: oklch(0.96 0.01 260);
  --accent-foreground: oklch(0.25 0 0);

  --destructive: oklch(0.55 0.22 27);
  --destructive-foreground: oklch(1 0 0);

  --border: oklch(0.91 0.005 260);
  --input: oklch(0.91 0.005 260);
  --ring: oklch(0.55 0.22 275);

  --radius: 0.625rem;
}

/* 다크 테마 */
.dark {
  --background: oklch(0.13 0.005 260);
  --foreground: oklch(0.93 0.005 260);

  --card: oklch(0.17 0.005 260);
  --card-foreground: oklch(0.93 0.005 260);

  --primary: oklch(0.65 0.22 275);
  --primary-foreground: oklch(0.13 0 0);

  --secondary: oklch(0.22 0.01 260);
  --secondary-foreground: oklch(0.93 0.005 260);

  --muted: oklch(0.22 0.01 260);
  --muted-foreground: oklch(0.65 0.01 260);

  --accent: oklch(0.22 0.01 260);
  --accent-foreground: oklch(0.93 0.005 260);

  --destructive: oklch(0.55 0.22 27);
  --destructive-foreground: oklch(1 0 0);

  --border: oklch(0.25 0.005 260);
  --input: oklch(0.25 0.005 260);
  --ring: oklch(0.65 0.22 275);
}
```

### 리더 전용 배경 테마

| 테마 이름 | 배경색 | 글자색 | 용도 |
|-----------|--------|--------|------|
| white | `#FFFFFF` | `#1A1A1A` | 주간 기본 |
| sepia | `#F4ECD8` | `#5C4B37` | 눈 편함 (따뜻한 톤) |
| brown | `#3D2B1F` | `#D4C4B0` | 야간 부드러운 |
| dark | `#1A1A1A` | `#C8C8C8` | 야간 OLED 절전 |
| green | `#0A2F1C` | `#A8D5BA` | 눈 편함 (차가운 톤) |

---

## 타이포그래피 스케일

### 폰트 패밀리

```css
@theme {
  --font-sans: 'Noto Sans KR', 'Apple SD Gothic Neo', 'Malgun Gothic', sans-serif;
  --font-serif: 'Noto Serif KR', 'Batang', serif;  /* 리더 본문용 */
  --font-mono: 'JetBrains Mono', monospace;
}
```

### 타이포그래피 스케일 (모바일 기준)

| 토큰 | 크기 | 행간 | 용도 |
|------|------|------|------|
| `text-display` | 28px / 1.75rem | 1.3 | 히어로 배너 제목 |
| `text-h1` | 24px / 1.5rem | 1.3 | 페이지 제목 |
| `text-h2` | 20px / 1.25rem | 1.4 | 섹션 제목 |
| `text-h3` | 18px / 1.125rem | 1.4 | 카드 제목 |
| `text-body-lg` | 16px / 1rem | 1.6 | 리더 본문 (기본) |
| `text-body` | 14px / 0.875rem | 1.5 | 일반 본문 |
| `text-caption` | 12px / 0.75rem | 1.4 | 보조 텍스트, 날짜 |
| `text-overline` | 11px / 0.6875rem | 1.3 | 라벨, 배지 |

### Tailwind v4 설정

```css
@theme {
  --text-display: 1.75rem;
  --text-display--line-height: 1.3;
  --text-h1: 1.5rem;
  --text-h1--line-height: 1.3;
  --text-h2: 1.25rem;
  --text-h2--line-height: 1.4;
  --text-h3: 1.125rem;
  --text-h3--line-height: 1.4;
  --text-body-lg: 1rem;
  --text-body-lg--line-height: 1.6;
  --text-body: 0.875rem;
  --text-body--line-height: 1.5;
  --text-caption: 0.75rem;
  --text-caption--line-height: 1.4;
  --text-overline: 0.6875rem;
  --text-overline--line-height: 1.3;
}
```

---

## 반응형 브레이크포인트

| 이름 | 너비 | 대상 | 레이아웃 |
|------|------|------|----------|
| `sm` | 375px | 소형 모바일 (iPhone SE) | 1컬럼, 컴팩트 |
| `md` | 768px | 태블릿 (iPad Mini) | 2컬럼 그리드, 사이드 네비 옵션 |
| `lg` | 1280px | 데스크톱 | 사이드바 + 3컬럼 그리드 |
| `xl` | 1440px | 와이드 데스크톱 | 최대 너비 제한, 여유 여백 |

### 컨테이너 전략

```tsx
// 모바일 퍼스트: 패딩 기반, lg에서 max-width 적용
<div className="mx-auto w-full max-w-xl px-4 md:max-w-3xl lg:max-w-6xl">
  {children}
</div>
```

---

## shadcn/ui 컴포넌트 카탈로그

### 사용 컴포넌트 목록

| 컴포넌트 | 사용 위치 | 비고 |
|----------|-----------|------|
| `Button` | 전역 | primary, secondary, ghost, destructive |
| `Input` | 로그인, 검색, 설정 | |
| `Card` | 작품 카드, 설정 패널 | |
| `Dialog` | 구매 확인, 알림 | |
| `Sheet` | 뷰어 설정 패널, 필터 | 모바일에서 vaul 대체 가능 |
| `Tabs` | 작품 상세 (정보/회차/댓글) | |
| `Badge` | 장르 태그, 상태 표시 | |
| `Avatar` | 프로필, 댓글 작성자 | |
| `Skeleton` | 로딩 상태 전역 | |
| `Slider` | 뷰어 글자 크기, 밝기 | |
| `Switch` | 설정 토글 (알림, 다크모드) | |
| `Separator` | 섹션 구분선 | |
| `ScrollArea` | 회차 목록, 댓글 | |
| `Toast (sonner)` | 전역 알림, 에러 메시지 | |
| `Drawer (vaul)` | 모바일 바텀시트 (설정, 필터) | |
| `Carousel (embla)` | 홈 배너, 추천 작품 캐러셀 | |

---

## 커스텀 컴포넌트

### WorkCard (작품 카드)

```tsx
// components/work/work-card.tsx
import Image from 'next/image';
import Link from 'next/link';
import { Badge } from '@/components/ui/badge';
import { Star } from 'lucide-react';
import type { Work } from '@/types/work';

interface WorkCardProps {
  work: Work;
  variant?: 'vertical' | 'horizontal';
  size?: 'sm' | 'md' | 'lg';
}

export function WorkCard({ work, variant = 'vertical', size = 'md' }: WorkCardProps) {
  const coverSizes = { sm: 'w-16 h-22', md: 'w-24 h-32', lg: 'w-32 h-44' };

  if (variant === 'horizontal') {
    return (
      <Link href={`/works/${work.id}`} className="flex gap-3 py-3">
        <div className={`relative shrink-0 overflow-hidden rounded-md ${coverSizes[size]}`}>
          <Image src={work.coverUrl} alt={work.title} fill className="object-cover" />
        </div>
        <div className="flex min-w-0 flex-col justify-center gap-1">
          <p className="truncate text-body font-medium">{work.title}</p>
          <div className="flex items-center gap-1.5 text-caption text-muted-foreground">
            <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />
            <span>{work.rating}</span>
            <span>-</span>
            <span>{work.genre}</span>
          </div>
          <p className="line-clamp-2 text-caption text-muted-foreground">{work.synopsis}</p>
        </div>
      </Link>
    );
  }

  return (
    <Link href={`/works/${work.id}`} className="flex w-24 shrink-0 flex-col gap-1.5 md:w-32">
      <div className="relative aspect-[3/4] overflow-hidden rounded-lg">
        <Image src={work.coverUrl} alt={work.title} fill className="object-cover" />
        {work.isNew && (
          <Badge className="absolute left-1 top-1 text-overline" variant="destructive">NEW</Badge>
        )}
      </div>
      <p className="truncate text-caption font-medium">{work.title}</p>
      <div className="flex items-center gap-1 text-overline text-muted-foreground">
        <Star className="h-2.5 w-2.5 fill-yellow-400 text-yellow-400" />
        <span>{work.rating}</span>
      </div>
    </Link>
  );
}
```

### EpisodeList (회차 목록)

```tsx
// components/work/episode-list.tsx
import { Lock, Check } from 'lucide-react';
import type { Episode } from '@/types/episode';

interface EpisodeListProps {
  episodes: Episode[];
  onSelect: (episode: Episode) => void;
}

export function EpisodeList({ episodes, onSelect }: EpisodeListProps) {
  return (
    <ul className="divide-y divide-border">
      {episodes.map((ep) => (
        <li key={ep.id}>
          <button
            onClick={() => onSelect(ep)}
            className="flex w-full items-center justify-between px-4 py-3 text-left transition-colors hover:bg-accent"
          >
            <div className="flex flex-col gap-0.5">
              <span className="text-body font-medium">
                {ep.episodeNumber}화 {ep.title && `- ${ep.title}`}
              </span>
              <span className="text-caption text-muted-foreground">
                {new Date(ep.publishedAt).toLocaleDateString('ko-KR')}
              </span>
            </div>
            <div className="flex items-center gap-2">
              {ep.isRead && <Check className="h-4 w-4 text-brand-500" />}
              {!ep.isFree && !ep.isPurchased && (
                <span className="flex items-center gap-1 text-caption text-muted-foreground">
                  <Lock className="h-3 w-3" />
                  {ep.price}코인
                </span>
              )}
              {ep.isFree && (
                <span className="text-caption font-medium text-brand-500">무료</span>
              )}
            </div>
          </button>
        </li>
      ))}
    </ul>
  );
}
```

### GenreChip (장르 칩)

```tsx
// components/genre-chip.tsx
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/lib/utils';

const chipVariants = cva(
  'inline-flex items-center rounded-full px-3 py-1 text-caption font-medium transition-colors',
  {
    variants: {
      variant: {
        default: 'bg-secondary text-secondary-foreground hover:bg-secondary/80',
        active: 'bg-brand-500 text-white',
        outline: 'border border-border text-foreground hover:bg-accent',
      },
    },
    defaultVariants: { variant: 'default' },
  },
);

interface GenreChipProps extends VariantProps<typeof chipVariants> {
  label: string;
  onClick?: () => void;
  className?: string;
}

export function GenreChip({ label, variant, onClick, className }: GenreChipProps) {
  return (
    <button onClick={onClick} className={cn(chipVariants({ variant }), className)}>
      {label}
    </button>
  );
}
```

### ReaderToolbar (리더 하단 툴바)

```tsx
// components/reader/reader-toolbar.tsx
'use client';

import { ChevronLeft, ChevronRight, Settings, List, Bookmark } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface ReaderToolbarProps {
  currentEpisode: number;
  totalEpisodes: number;
  onPrev: () => void;
  onNext: () => void;
  onOpenSettings: () => void;
  onOpenToc: () => void;
  onBookmark: () => void;
  isBookmarked: boolean;
}

export function ReaderToolbar({
  currentEpisode, totalEpisodes,
  onPrev, onNext,
  onOpenSettings, onOpenToc, onBookmark, isBookmarked,
}: ReaderToolbarProps) {
  return (
    <div className="fixed bottom-0 left-0 right-0 z-40 border-t border-border bg-background/95 px-4 py-2 backdrop-blur-sm">
      <div className="mx-auto flex max-w-xl items-center justify-between">
        <Button variant="ghost" size="icon" onClick={onPrev} disabled={currentEpisode <= 1}>
          <ChevronLeft className="h-5 w-5" />
        </Button>
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" onClick={onOpenToc}>
            <List className="h-5 w-5" />
          </Button>
          <span className="text-caption text-muted-foreground">
            {currentEpisode} / {totalEpisodes}
          </span>
          <Button variant="ghost" size="icon" onClick={onBookmark}>
            <Bookmark className={`h-5 w-5 ${isBookmarked ? 'fill-brand-500 text-brand-500' : ''}`} />
          </Button>
        </div>
        <Button variant="ghost" size="icon" onClick={onOpenSettings}>
          <Settings className="h-5 w-5" />
        </Button>
        <Button variant="ghost" size="icon" onClick={onNext} disabled={currentEpisode >= totalEpisodes}>
          <ChevronRight className="h-5 w-5" />
        </Button>
      </div>
    </div>
  );
}
```

---

## 아이콘 시스템

`lucide-react`를 사용하며, 일관된 크기 토큰을 적용한다.

| 컨텍스트 | 크기 | Tailwind 클래스 |
|----------|------|-----------------|
| 탭 바 아이콘 | 24px | `h-6 w-6` |
| 버튼 내부 | 16px | `h-4 w-4` |
| 리스트 아이콘 | 20px | `h-5 w-5` |
| 인라인 (텍스트 옆) | 14px | `h-3.5 w-3.5` |
| 배지/칩 내부 | 12px | `h-3 w-3` |

---

## 간격 (Spacing) 가이드

| 용도 | 값 | Tailwind |
|------|-----|----------|
| 컴포넌트 내부 패딩 | 12-16px | `p-3` / `p-4` |
| 카드 간 간격 | 12px | `gap-3` |
| 섹션 간 간격 | 24-32px | `gap-6` / `gap-8` |
| 화면 좌우 패딩 | 16px | `px-4` |
| 하단 네비 높이 | 64px | `h-16` |
| Safe area (하단) | 패딩 80px | `pb-20` |

---

## 다크 모드 전환

```tsx
// components/theme-toggle.tsx
'use client';

import { useTheme } from 'next-themes';
import { Moon, Sun } from 'lucide-react';
import { Button } from '@/components/ui/button';

export function ThemeToggle() {
  const { theme, setTheme } = useTheme();

  return (
    <Button
      variant="ghost"
      size="icon"
      onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
    >
      <Sun className="h-5 w-5 rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
      <Moon className="absolute h-5 w-5 rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
      <span className="sr-only">테마 전환</span>
    </Button>
  );
}
```
