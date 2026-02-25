# 소설 리더/뷰어 핵심 설계

## 개요

소설 리더는 스토리AI의 핵심 기능이다. 킨들, 리디북스 수준의 몰입감 있는 독서 경험을 웹 기술로 구현한다.
두 가지 읽기 모드(스크롤, 페이지네이션)를 제공하며, 제스처 기반 조작과 오프라인 읽기를 지원한다.

---

## 읽기 모드

### 모드 비교

| 항목 | 스크롤 모드 | 페이지 모드 |
|------|-------------|-------------|
| 방식 | 세로 무한 스크롤 | CSS Multi-Column 좌우 페이지 |
| 조작 | 위/아래 스크롤 | 좌/우 스와이프, 탭 |
| 적합 상황 | 빠른 읽기, 웹소설 스타일 | 몰입 독서, 이북 리더 스타일 |
| 진행률 표시 | 스크롤 퍼센트 | 현재 페이지 / 전체 페이지 |
| 기본값 | - | **기본 모드 (추천)** |

---

## 스크롤 모드 구현

### 기본 구조

```tsx
// components/reader/scroll-reader.tsx
'use client';

import { useRef, useCallback, useEffect } from 'react';
import { useAtomValue } from 'jotai';
import { readerSettingsAtom } from '@/atoms/reader';
import { useReadingProgress } from '@/hooks/use-reading-progress';

interface ScrollReaderProps {
  content: string;
  episodeId: string;
  workId: string;
}

export function ScrollReader({ content, episodeId, workId }: ScrollReaderProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const settings = useAtomValue(readerSettingsAtom);
  const { saveProgress } = useReadingProgress(workId, episodeId);

  // 스크롤 진행률 추적 (throttle)
  const handleScroll = useCallback(() => {
    const el = containerRef.current;
    if (!el) return;

    const scrollTop = el.scrollTop;
    const scrollHeight = el.scrollHeight - el.clientHeight;
    const percentage = Math.round((scrollTop / scrollHeight) * 100);

    saveProgress({ scrollPosition: scrollTop, percentage, pageIndex: 0 });
  }, [saveProgress]);

  // 마지막 읽은 위치 복원
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    // reading progress에서 scrollPosition 복원
  }, []);

  return (
    <div
      ref={containerRef}
      onScroll={handleScroll}
      className="h-dvh overflow-y-auto overscroll-contain"
      style={{
        fontSize: `${settings.fontSize}px`,
        lineHeight: settings.lineHeight,
        fontFamily: settings.fontFamily,
        backgroundColor: settings.bgColor,
        color: settings.textColor,
      }}
    >
      <article
        className="mx-auto whitespace-pre-wrap break-keep px-6 pb-24 pt-16"
        style={{ maxWidth: settings.maxWidth }}
        dangerouslySetInnerHTML={{ __html: content }}
      />
    </div>
  );
}
```

---

## 페이지네이션 모드 (CSS Multi-Column)

### 핵심 원리

CSS `column-width`와 `column-gap`을 사용하여 본문을 뷰포트 너비 기반의 페이지로 자동 분할한다.
컨테이너의 높이를 뷰포트 높이로 고정하고, `overflow: hidden`을 설정한 뒤 `translateX`로 페이지를 이동한다.

### 구현

```tsx
// components/reader/page-reader.tsx
'use client';

import { useRef, useState, useCallback, useEffect, useMemo } from 'react';
import { useAtomValue, useSetAtom } from 'jotai';
import { readerSettingsAtom, currentPageAtom, totalPagesAtom } from '@/atoms/reader';
import { useReadingProgress } from '@/hooks/use-reading-progress';

interface PageReaderProps {
  content: string;
  episodeId: string;
  workId: string;
}

export function PageReader({ content, episodeId, workId }: PageReaderProps) {
  const contentRef = useRef<HTMLDivElement>(null);
  const settings = useAtomValue(readerSettingsAtom);
  const [currentPage, setCurrentPage] = useState(0);
  const setTotalPages = useSetAtom(totalPagesAtom);
  const { saveProgress } = useReadingProgress(workId, episodeId);

  // 뷰포트 기반 페이지 너비 계산
  const pageWidth = typeof window !== 'undefined' ? window.innerWidth : 375;
  const columnGap = 40; // px

  // 총 페이지 수 계산
  const totalPages = useMemo(() => {
    const el = contentRef.current;
    if (!el) return 1;
    const totalScrollWidth = el.scrollWidth;
    return Math.ceil(totalScrollWidth / (pageWidth + columnGap));
  }, [content, settings.fontSize, settings.lineHeight, pageWidth, columnGap]);

  useEffect(() => {
    setTotalPages(totalPages);
  }, [totalPages, setTotalPages]);

  // 페이지 이동
  const goToPage = useCallback(
    (page: number) => {
      const clamped = Math.max(0, Math.min(page, totalPages - 1));
      setCurrentPage(clamped);
      saveProgress({
        pageIndex: clamped,
        percentage: Math.round((clamped / (totalPages - 1)) * 100),
        scrollPosition: 0,
      });
    },
    [totalPages, saveProgress],
  );

  const nextPage = () => goToPage(currentPage + 1);
  const prevPage = () => goToPage(currentPage - 1);

  // translateX 계산
  const translateX = -(currentPage * (pageWidth + columnGap));

  return (
    <div className="relative h-dvh w-screen overflow-hidden">
      {/* 탭 영역 (제스처 핸들링) */}
      <GestureTapZones onPrev={prevPage} onNext={nextPage} />

      {/* 멀티컬럼 콘텐츠 */}
      <div
        ref={contentRef}
        className="transition-transform duration-300 ease-out will-change-transform"
        style={{
          columnWidth: `${pageWidth - 48}px`, /* 좌우 패딩 24px씩 */
          columnGap: `${columnGap}px`,
          columnFill: 'auto',
          height: 'calc(100dvh - 80px)', /* 상하 여백 */
          paddingTop: '40px',
          paddingBottom: '40px',
          paddingLeft: '24px',
          paddingRight: '24px',
          transform: `translateX(${translateX}px)`,
          fontSize: `${settings.fontSize}px`,
          lineHeight: settings.lineHeight,
          fontFamily: settings.fontFamily,
          backgroundColor: settings.bgColor,
          color: settings.textColor,
          wordBreak: 'keep-all',
          overflowWrap: 'break-word',
        }}
        dangerouslySetInnerHTML={{ __html: content }}
      />

      {/* 페이지 인디케이터 */}
      <div className="absolute bottom-3 left-0 right-0 text-center text-caption text-muted-foreground">
        {currentPage + 1} / {totalPages}
      </div>
    </div>
  );
}
```

### 페이지 수 재계산 트리거

폰트 크기, 줄 간격, 화면 회전 등이 변경될 때 페이지 수를 다시 계산해야 한다.

```typescript
// ResizeObserver로 컬럼 컨테이너 크기 변화 감지
useEffect(() => {
  const el = contentRef.current;
  if (!el) return;

  const observer = new ResizeObserver(() => {
    const newTotal = Math.ceil(el.scrollWidth / (pageWidth + columnGap));
    setTotalPages(newTotal);
    // 현재 페이지가 범위를 초과하면 마지막 페이지로 이동
    if (currentPage >= newTotal) {
      setCurrentPage(newTotal - 1);
    }
  });

  observer.observe(el);
  return () => observer.disconnect();
}, [pageWidth, columnGap, currentPage]);
```

---

## 제스처 핸들링

### 탭 영역 + 스와이프 구현

```tsx
// components/reader/gesture-tap-zones.tsx
'use client';

import { useRef } from 'react';
import { useSwipeable } from 'react-swipeable';
import { useAtomValue } from 'jotai';
import { readerSettingsAtom } from '@/atoms/reader';

interface GestureTapZonesProps {
  onPrev: () => void;
  onNext: () => void;
  onToggleUI?: () => void;
}

export function GestureTapZones({ onPrev, onNext, onToggleUI }: GestureTapZonesProps) {
  const settings = useAtomValue(readerSettingsAtom);
  const tapZone = settings.tapZoneRatio; // [20, 60, 20] 기본값

  // 스와이프 핸들러 (framer-motion 또는 react-swipeable)
  const swipeHandlers = useSwipeable({
    onSwipedLeft: () => onNext(),
    onSwipedRight: () => onPrev(),
    trackMouse: false,
    preventScrollOnSwipe: true,
    delta: 50, // 최소 스와이프 거리
  });

  const handleTap = (e: React.MouseEvent) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const width = rect.width;
    const relativeX = x / width;

    const leftBoundary = tapZone[0] / 100;
    const rightBoundary = 1 - tapZone[2] / 100;

    if (relativeX < leftBoundary) {
      onPrev();
    } else if (relativeX > rightBoundary) {
      onNext();
    } else {
      onToggleUI?.();
    }
  };

  return (
    <div
      {...swipeHandlers}
      onClick={handleTap}
      className="absolute inset-0 z-10"
      role="presentation"
    />
  );
}
```

### 제스처 맵 (요약)

```
  ┌──────────┬──────────────────────┬──────────┐
  │          │                      │          │
  │  탭:     │      탭:             │  탭:     │
  │  이전    │      UI 토글         │  다음    │
  │  페이지  │   (헤더/툴바 표시)   │  페이지  │
  │          │                      │          │
  │   20%    │        60%           │   20%    │
  └──────────┴──────────────────────┴──────────┘

  ← 스와이프: 이전 페이지
  → 스와이프: 다음 페이지
  ↑↓ 스크롤: 스크롤 모드에서만 동작
```

---

## 리더 설정

### 설정 항목 및 기본값

| 설정 | 키 | 타입 | 기본값 | 범위 |
|------|-----|------|--------|------|
| 글자 크기 | `fontSize` | number | 16 | 10-28 (px) |
| 폰트 | `fontFamily` | string | `'system-ui'` | system-ui, Noto Sans KR, Noto Serif KR |
| 줄 간격 | `lineHeight` | number | 1.8 | 1.2-2.5 |
| 배경색 | `bgColor` | string | `'#FFFFFF'` | 5가지 테마 |
| 글자색 | `textColor` | string | `'#1A1A1A'` | 배경에 맞춤 자동 |
| 읽기 모드 | `readingMode` | string | `'page'` | page, scroll |
| 탭 영역 비율 | `tapZoneRatio` | tuple | `[20, 60, 20]` | 커스텀 |
| 여백 | `maxWidth` | string | `'640px'` | 좁게/기본/넓게 |
| 블루라이트 필터 | `blueFilter` | boolean | false | - |
| 화면 꺼짐 방지 | `keepAwake` | boolean | true | - |

### 설정 바텀시트 (vaul)

```tsx
// components/reader/reader-settings-sheet.tsx
'use client';

import { Drawer } from 'vaul';
import { Slider } from '@/components/ui/slider';
import { Switch } from '@/components/ui/switch';
import { useAtom } from 'jotai';
import { readerSettingsAtom } from '@/atoms/reader';

const BG_THEMES = [
  { name: '화이트', bg: '#FFFFFF', text: '#1A1A1A' },
  { name: '세피아', bg: '#F4ECD8', text: '#5C4B37' },
  { name: '브라운', bg: '#3D2B1F', text: '#D4C4B0' },
  { name: '다크',   bg: '#1A1A1A', text: '#C8C8C8' },
  { name: '그린',   bg: '#0A2F1C', text: '#A8D5BA' },
];

const FONTS = [
  { label: '시스템 기본', value: 'system-ui' },
  { label: '나눔고딕', value: "'Nanum Gothic', sans-serif" },
  { label: '본명조', value: "'Noto Serif KR', serif" },
];

export function ReaderSettingsSheet({ open, onOpenChange }: { open: boolean; onOpenChange: (v: boolean) => void }) {
  const [settings, setSettings] = useAtom(readerSettingsAtom);

  return (
    <Drawer.Root open={open} onOpenChange={onOpenChange}>
      <Drawer.Portal>
        <Drawer.Overlay className="fixed inset-0 bg-black/40" />
        <Drawer.Content className="fixed bottom-0 left-0 right-0 rounded-t-2xl bg-background p-4">
          <div className="mx-auto mb-4 h-1.5 w-12 rounded-full bg-muted" />

          {/* 글자 크기 */}
          <section className="mb-6">
            <label className="mb-2 block text-caption text-muted-foreground">
              글자 크기 ({settings.fontSize}px)
            </label>
            <div className="flex items-center gap-3">
              <span className="text-xs">A</span>
              <Slider
                value={[settings.fontSize]}
                min={10} max={28} step={1}
                onValueChange={([v]) => setSettings((s) => ({ ...s, fontSize: v }))}
              />
              <span className="text-lg">A</span>
            </div>
          </section>

          {/* 줄 간격 */}
          <section className="mb-6">
            <label className="mb-2 block text-caption text-muted-foreground">
              줄 간격 ({settings.lineHeight})
            </label>
            <Slider
              value={[settings.lineHeight * 10]}
              min={12} max={25} step={1}
              onValueChange={([v]) => setSettings((s) => ({ ...s, lineHeight: v / 10 }))}
            />
          </section>

          {/* 배경 색상 */}
          <section className="mb-6">
            <label className="mb-2 block text-caption text-muted-foreground">배경 색상</label>
            <div className="flex gap-3">
              {BG_THEMES.map((theme) => (
                <button
                  key={theme.name}
                  onClick={() => setSettings((s) => ({ ...s, bgColor: theme.bg, textColor: theme.text }))}
                  className={`h-10 w-10 rounded-full border-2 ${
                    settings.bgColor === theme.bg ? 'border-brand-500' : 'border-border'
                  }`}
                  style={{ backgroundColor: theme.bg }}
                />
              ))}
            </div>
          </section>

          {/* 폰트 선택 */}
          <section className="mb-6">
            <label className="mb-2 block text-caption text-muted-foreground">폰트</label>
            <div className="flex flex-wrap gap-2">
              {FONTS.map((font) => (
                <button
                  key={font.value}
                  onClick={() => setSettings((s) => ({ ...s, fontFamily: font.value }))}
                  className={`rounded-lg px-3 py-1.5 text-caption ${
                    settings.fontFamily === font.value
                      ? 'bg-brand-500 text-white'
                      : 'bg-secondary text-secondary-foreground'
                  }`}
                >
                  {font.label}
                </button>
              ))}
            </div>
          </section>

          {/* 블루라이트 필터 */}
          <section className="flex items-center justify-between">
            <span className="text-body">블루라이트 필터</span>
            <Switch
              checked={settings.blueFilter}
              onCheckedChange={(v) => setSettings((s) => ({ ...s, blueFilter: v }))}
            />
          </section>
        </Drawer.Content>
      </Drawer.Portal>
    </Drawer.Root>
  );
}
```

---

## 읽기 진행률 추적 및 동기화

### 전략

| 저장소 | 용도 | 동기화 주기 |
|--------|------|-------------|
| Jotai atom (메모리) | 현재 세션 실시간 위치 | 즉시 |
| IndexedDB | 오프라인 저장, 앱 재시작 복원 | 스크롤/페이지 변경 시 (debounce 2초) |
| 서버 API | 디바이스 간 동기화 | 페이지 이탈 시 + 30초 주기 |

### 훅 구현

```typescript
// hooks/use-reading-progress.ts
import { useCallback, useEffect, useRef } from 'react';
import { useMutation } from '@tanstack/react-query';
import { getDB } from '@/lib/offline/db';
import { api } from '@/lib/api/client';

interface ProgressData {
  scrollPosition: number;
  pageIndex: number;
  percentage: number;
}

export function useReadingProgress(workId: string, episodeId: string) {
  const debounceRef = useRef<NodeJS.Timeout | null>(null);
  const latestProgress = useRef<ProgressData | null>(null);

  // 서버 동기화 mutation
  const syncMutation = useMutation({
    mutationFn: (data: ProgressData) =>
      api.patch(`/reading-progress/${workId}/${episodeId}`, data),
  });

  // IndexedDB + 서버 동기화
  const saveProgress = useCallback(
    (data: ProgressData) => {
      latestProgress.current = data;

      // 즉시: IndexedDB 저장 (debounce 2초)
      if (debounceRef.current) clearTimeout(debounceRef.current);
      debounceRef.current = setTimeout(async () => {
        const db = await getDB();
        await db.put('readingProgress', {
          workId,
          episodeId,
          ...data,
          updatedAt: Date.now(),
        });
      }, 2000);
    },
    [workId, episodeId],
  );

  // 페이지 이탈 시 서버 동기화
  useEffect(() => {
    const handleBeforeUnload = () => {
      if (latestProgress.current) {
        // sendBeacon 사용 (비동기 안전)
        navigator.sendBeacon(
          `${process.env.NEXT_PUBLIC_API_URL}/reading-progress/${workId}/${episodeId}`,
          JSON.stringify(latestProgress.current),
        );
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    document.addEventListener('visibilitychange', () => {
      if (document.visibilityState === 'hidden') handleBeforeUnload();
    });

    // 30초 주기 서버 동기화
    const interval = setInterval(() => {
      if (latestProgress.current) {
        syncMutation.mutate(latestProgress.current);
      }
    }, 30_000);

    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
      clearInterval(interval);
    };
  }, [workId, episodeId, syncMutation]);

  // 초기 위치 로드
  const loadProgress = useCallback(async (): Promise<ProgressData | null> => {
    // 1. 서버에서 최신 위치 조회
    try {
      const serverData = await api.get<ProgressData>(
        `/reading-progress/${workId}/${episodeId}`,
      );
      return serverData;
    } catch {
      // 2. 오프라인 폴백: IndexedDB
      const db = await getDB();
      const local = await db.get('readingProgress', [workId, episodeId]);
      return local ?? null;
    }
  }, [workId, episodeId]);

  return { saveProgress, loadProgress };
}
```

---

## 오프라인 읽기

### 오프라인 콘텐츠 로드 흐름

```
Reader 페이지 진입
       │
       ├── 온라인? ──► API에서 콘텐츠 fetch
       │                    │
       │                    └── IndexedDB에도 캐시 저장
       │
       └── 오프라인? ──► IndexedDB에서 콘텐츠 로드
                             │
                             ├── 있음 → 콘텐츠 표시
                             └── 없음 → "다운로드 필요" 안내
```

```typescript
// hooks/use-episode-content.ts
import { useQuery } from '@tanstack/react-query';
import { getDB } from '@/lib/offline/db';
import { api } from '@/lib/api/client';

export function useEpisodeContent(workId: string, episodeId: string) {
  return useQuery({
    queryKey: ['episode-content', workId, episodeId],
    queryFn: async () => {
      // 온라인: API 호출
      if (navigator.onLine) {
        const data = await api.get<{ content: string }>(
          `/works/${workId}/episodes/${episodeId}/content`,
        );
        // IndexedDB에 캐시
        const db = await getDB();
        await db.put('episodes', {
          workId,
          episodeId,
          workTitle: '',
          episodeNumber: 0,
          episodeTitle: '',
          content: data.content,
          downloadedAt: Date.now(),
          fileSize: new Blob([data.content]).size,
        });
        return data.content;
      }

      // 오프라인: IndexedDB 조회
      const db = await getDB();
      const cached = await db.get('episodes', episodeId);
      if (cached) return cached.content;

      throw new Error('오프라인 상태에서 다운로드되지 않은 회차입니다.');
    },
    staleTime: 1000 * 60 * 60, // 1시간
    gcTime: 1000 * 60 * 60 * 24, // 24시간
  });
}
```

---

## 성능: 긴 회차 가상화

일부 소설 회차는 본문이 매우 길 수 있다 (10,000자 이상). 스크롤 모드에서는 가상화를 적용한다.

### 스크롤 모드 가상화 전략

```typescript
// 본문을 단락 단위로 분할하여 가상화
const paragraphs = content.split(/\n\n+/);

// react-window 또는 @tanstack/virtual 사용
import { useWindowVirtualizer } from '@tanstack/react-virtual';

function VirtualizedScrollReader({ paragraphs }: { paragraphs: string[] }) {
  const virtualizer = useWindowVirtualizer({
    count: paragraphs.length,
    estimateSize: () => 100,    // 예상 높이 (px)
    overscan: 5,                // 뷰포트 바깥 5개 추가 렌더
  });

  return (
    <div style={{ height: virtualizer.getTotalSize(), position: 'relative' }}>
      {virtualizer.getVirtualItems().map((row) => (
        <div
          key={row.key}
          ref={virtualizer.measureElement}
          data-index={row.index}
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            width: '100%',
            transform: `translateY(${row.start}px)`,
          }}
        >
          <p className="mb-4 whitespace-pre-wrap break-keep">{paragraphs[row.index]}</p>
        </div>
      ))}
    </div>
  );
}
```

### 페이지 모드 성능 고려사항

| 항목 | 전략 |
|------|------|
| 초기 렌더 | 본문 전체를 DOM에 넣되, CSS columns가 자동 분할 |
| 전환 애니메이션 | `will-change: transform` + GPU 레이어 |
| 메모리 | 본문이 50,000자 초과 시 청크 분할 로드 |
| 리페인트 최소화 | 설정 변경 시 `requestAnimationFrame`으로 배치 |

---

## 화면 꺼짐 방지 (Wake Lock API)

```typescript
// hooks/use-wake-lock.ts
import { useEffect, useRef } from 'react';

export function useWakeLock(enabled: boolean) {
  const wakeLockRef = useRef<WakeLockSentinel | null>(null);

  useEffect(() => {
    if (!enabled || !('wakeLock' in navigator)) return;

    const request = async () => {
      try {
        wakeLockRef.current = await navigator.wakeLock.request('screen');
      } catch {
        // 권한 거부 또는 미지원
      }
    };

    request();

    // visibility change 시 재요청 (탭 복귀)
    const handleVisibility = () => {
      if (document.visibilityState === 'visible' && enabled) {
        request();
      }
    };
    document.addEventListener('visibilitychange', handleVisibility);

    return () => {
      wakeLockRef.current?.release();
      document.removeEventListener('visibilitychange', handleVisibility);
    };
  }, [enabled]);
}
```
