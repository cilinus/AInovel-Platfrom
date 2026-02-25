# 상태 관리 전략

## 개요

스토리AI는 세 가지 상태 관리 도구를 역할에 따라 구분하여 사용한다.
하나의 도구로 모든 상태를 관리하는 대신, 상태의 성격에 맞는 최적의 도구를 선택한다.

### 상태 관리 도구 역할 분담

| 도구 | 버전 | 역할 | 특징 |
|------|------|------|------|
| **Zustand** | 5 | 전역 영속 상태 | 인증, 앱 설정 등 앱 전체에서 공유 |
| **Jotai** | 2 | 컴포넌트 범위 상태 | 리더 설정, UI 상태 등 특정 화면에 한정 |
| **TanStack Query** | 5 | 서버 상태 | API 데이터 캐싱, 동기화, 로딩/에러 |

### 판단 기준 플로차트

```
상태가 서버에서 오는 데이터인가?
  ├── YES → TanStack Query
  └── NO → 여러 페이지에서 공유하는가?
              ├── YES → localStorage 영속이 필요한가?
              │           ├── YES → Zustand (persist)
              │           └── NO  → Zustand (일반)
              └── NO  → 특정 화면/컴포넌트에 한정?
                          ├── YES → Jotai atom
                          └── NO  → React useState
```

---

## Zustand 스토어

### auth.store.ts (인증 상태)

```typescript
// stores/auth.store.ts
import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';

interface User {
  id: string;
  email: string;
  nickname: string;
  profileImageUrl: string | null;
  role: 'USER' | 'ADMIN';
  tokenBalance: number;
}

interface AuthState {
  user: User | null;
  accessToken: string | null;
  refreshToken: string | null;
  isAuthenticated: boolean;
}

interface AuthActions {
  setAuth: (user: User, accessToken: string, refreshToken: string) => void;
  updateUser: (partial: Partial<User>) => void;
  updateTokenBalance: (balance: number) => void;
  logout: () => void;
}

export const useAuthStore = create<AuthState & AuthActions>()(
  persist(
    (set) => ({
      // 상태
      user: null,
      accessToken: null,
      refreshToken: null,
      isAuthenticated: false,

      // 액션
      setAuth: (user, accessToken, refreshToken) =>
        set({ user, accessToken, refreshToken, isAuthenticated: true }),

      updateUser: (partial) =>
        set((state) => ({
          user: state.user ? { ...state.user, ...partial } : null,
        })),

      updateTokenBalance: (balance) =>
        set((state) => ({
          user: state.user ? { ...state.user, tokenBalance: balance } : null,
        })),

      logout: () =>
        set({
          user: null,
          accessToken: null,
          refreshToken: null,
          isAuthenticated: false,
        }),
    }),
    {
      name: 'storyai-auth',
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({
        user: state.user,
        accessToken: state.accessToken,
        refreshToken: state.refreshToken,
        isAuthenticated: state.isAuthenticated,
      }),
    },
  ),
);
```

### app.store.ts (앱 전역 설정)

```typescript
// stores/app.store.ts
import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';

type Theme = 'light' | 'dark' | 'system';
type ContentType = 'novel' | 'comic';

interface AppState {
  theme: Theme;
  sidebarOpen: boolean;
  preferredContentType: ContentType;
  hasSeenOnboarding: boolean;
  installPromptDismissedAt: number | null;
  pushPermission: NotificationPermission | null;
}

interface AppActions {
  setTheme: (theme: Theme) => void;
  toggleSidebar: () => void;
  setSidebarOpen: (open: boolean) => void;
  setPreferredContentType: (type: ContentType) => void;
  completeOnboarding: () => void;
  dismissInstallPrompt: () => void;
  setPushPermission: (permission: NotificationPermission) => void;
}

export const useAppStore = create<AppState & AppActions>()(
  persist(
    (set) => ({
      // 상태
      theme: 'system',
      sidebarOpen: false,
      preferredContentType: 'novel',
      hasSeenOnboarding: false,
      installPromptDismissedAt: null,
      pushPermission: null,

      // 액션
      setTheme: (theme) => set({ theme }),
      toggleSidebar: () => set((s) => ({ sidebarOpen: !s.sidebarOpen })),
      setSidebarOpen: (open) => set({ sidebarOpen: open }),
      setPreferredContentType: (type) => set({ preferredContentType: type }),
      completeOnboarding: () => set({ hasSeenOnboarding: true }),
      dismissInstallPrompt: () => set({ installPromptDismissedAt: Date.now() }),
      setPushPermission: (permission) => set({ pushPermission: permission }),
    }),
    {
      name: 'storyai-app',
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({
        theme: state.theme,
        preferredContentType: state.preferredContentType,
        hasSeenOnboarding: state.hasSeenOnboarding,
        installPromptDismissedAt: state.installPromptDismissedAt,
      }),
    },
  ),
);
```

---

## Jotai Atoms

### 리더 설정 (뷰어 한정 상태)

```typescript
// atoms/reader.ts
import { atom } from 'jotai';
import { atomWithStorage } from 'jotai/utils';

/** 리더 배경 테마 */
export interface ReaderTheme {
  bgColor: string;
  textColor: string;
}

/** 리더 전체 설정 */
export interface ReaderSettings {
  fontSize: number;
  fontFamily: string;
  lineHeight: number;
  bgColor: string;
  textColor: string;
  readingMode: 'page' | 'scroll';
  tapZoneRatio: [number, number, number];
  maxWidth: string;
  blueFilter: boolean;
  keepAwake: boolean;
}

// localStorage 영속 (뷰어 설정은 디바이스별 유지)
export const readerSettingsAtom = atomWithStorage<ReaderSettings>(
  'storyai-reader-settings',
  {
    fontSize: 16,
    fontFamily: 'system-ui',
    lineHeight: 1.8,
    bgColor: '#FFFFFF',
    textColor: '#1A1A1A',
    readingMode: 'page',
    tapZoneRatio: [20, 60, 20],
    maxWidth: '640px',
    blueFilter: false,
    keepAwake: true,
  },
);

// 현재 페이지 (세션 한정, 영속 불필요)
export const currentPageAtom = atom(0);
export const totalPagesAtom = atom(1);

// UI 토글 상태
export const readerUIVisibleAtom = atom(true);
export const settingsSheetOpenAtom = atom(false);
export const tocSheetOpenAtom = atom(false);
```

### 뷰어 파생 atom

```typescript
// atoms/reader-derived.ts
import { atom } from 'jotai';
import { currentPageAtom, totalPagesAtom } from './reader';

/** 진행률 (%) */
export const readingPercentageAtom = atom((get) => {
  const current = get(currentPageAtom);
  const total = get(totalPagesAtom);
  if (total <= 1) return 0;
  return Math.round((current / (total - 1)) * 100);
});

/** 첫 페이지 여부 */
export const isFirstPageAtom = atom((get) => get(currentPageAtom) === 0);

/** 마지막 페이지 여부 */
export const isLastPageAtom = atom((get) => {
  return get(currentPageAtom) >= get(totalPagesAtom) - 1;
});
```

### Jotai를 선택한 이유 (vs Zustand)

| 기준 | Zustand | Jotai |
|------|---------|-------|
| 스토어 구조 | 단일 스토어 (객체) | 개별 atom (bottom-up) |
| 리렌더 범위 | 셀렉터로 수동 최적화 | atom 단위 자동 최적화 |
| 파생 상태 | 직접 계산 | `atom((get) => ...)` 자동 |
| 적합 시나리오 | 전역 싱글톤 상태 | 컴포넌트 트리 로컬 상태 |

리더 설정은 `fontSize`, `lineHeight`, `bgColor` 등 개별 값이 독립적으로 변경되며,
각 값이 서로 다른 컴포넌트에서 구독된다. Jotai의 atom 단위 구독이 불필요한 리렌더를 방지한다.

---

## TanStack Query (서버 상태)

### Query Client 설정

```typescript
// lib/query-client.ts
import { QueryClient } from '@tanstack/react-query';

export function makeQueryClient() {
  return new QueryClient({
    defaultOptions: {
      queries: {
        staleTime: 1000 * 60,      // 1분
        gcTime: 1000 * 60 * 30,    // 30분
        retry: 2,
        refetchOnWindowFocus: false,
        refetchOnReconnect: true,
      },
      mutations: {
        retry: 1,
      },
    },
  });
}
```

### Provider 설정

```tsx
// components/providers/query-provider.tsx
'use client';

import { QueryClientProvider } from '@tanstack/react-query';
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';
import { useState } from 'react';
import { makeQueryClient } from '@/lib/query-client';

export function QueryProvider({ children }: { children: React.ReactNode }) {
  const [client] = useState(makeQueryClient);

  return (
    <QueryClientProvider client={client}>
      {children}
      {process.env.NODE_ENV === 'development' && <ReactQueryDevtools />}
    </QueryClientProvider>
  );
}
```

### API Hooks 패턴

#### useWorks (작품 목록)

```typescript
// hooks/api/use-works.ts
import { useInfiniteQuery, useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api/client';
import type { Work, PaginatedResponse } from '@/types';

/** 작품 목록 (무한스크롤) */
export function useWorks(params?: { genre?: string; sort?: string }) {
  return useInfiniteQuery({
    queryKey: ['works', params],
    queryFn: ({ pageParam = 1 }) =>
      api.get<PaginatedResponse<Work>>('/works', {
        page: String(pageParam),
        limit: '20',
        ...(params?.genre && { genre: params.genre }),
        ...(params?.sort && { sort: params.sort }),
      }),
    initialPageParam: 1,
    getNextPageParam: (lastPage) =>
      lastPage.hasNext ? lastPage.page + 1 : undefined,
    staleTime: 1000 * 60 * 5, // 5분
  });
}

/** 인기 작품 */
export function useTrendingWorks() {
  return useQuery({
    queryKey: ['works', 'trending'],
    queryFn: () => api.get<Work[]>('/works/trending'),
    staleTime: 1000 * 60 * 10, // 10분
  });
}

/** 맞춤 추천 */
export function useRecommendedWorks() {
  return useQuery({
    queryKey: ['works', 'recommended'],
    queryFn: () => api.get<Work[]>('/works/recommended'),
    staleTime: 1000 * 60 * 30, // 30분
  });
}
```

#### useEpisode (회차)

```typescript
// hooks/api/use-episode.ts
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api/client';
import type { Episode, EpisodeContent } from '@/types';

/** 회차 목록 */
export function useEpisodes(workId: string) {
  return useQuery({
    queryKey: ['episodes', workId],
    queryFn: () => api.get<Episode[]>(`/works/${workId}/episodes`),
    staleTime: 1000 * 60 * 5,
  });
}

/** 회차 본문 (콘텐츠) */
export function useEpisodeContent(workId: string, episodeId: string) {
  return useQuery({
    queryKey: ['episode-content', workId, episodeId],
    queryFn: () => api.get<EpisodeContent>(`/works/${workId}/episodes/${episodeId}/content`),
    staleTime: 1000 * 60 * 60, // 1시간 (본문은 잘 안 변함)
    enabled: !!workId && !!episodeId,
  });
}

/** 회차 구매 */
export function usePurchaseEpisode() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ workId, episodeId }: { workId: string; episodeId: string }) =>
      api.post(`/works/${workId}/episodes/${episodeId}/purchase`),
    onSuccess: (_, { workId }) => {
      // 회차 목록 갱신 (구매 상태 반영)
      queryClient.invalidateQueries({ queryKey: ['episodes', workId] });
      // 사용자 토큰 잔액 갱신
      queryClient.invalidateQueries({ queryKey: ['user', 'me'] });
    },
  });
}
```

#### useUser (사용자)

```typescript
// hooks/api/use-user.ts
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api/client';
import { useAuthStore } from '@/stores/auth.store';
import type { User } from '@/types';

/** 내 정보 (서버 상태 + Zustand 동기화) */
export function useMe() {
  const { updateUser } = useAuthStore();

  return useQuery({
    queryKey: ['user', 'me'],
    queryFn: async () => {
      const user = await api.get<User>('/users/me');
      // Zustand에도 동기화
      updateUser(user);
      return user;
    },
    staleTime: 1000 * 60 * 5,
  });
}

/** 토큰 잔액 */
export function useTokenBalance() {
  return useQuery({
    queryKey: ['user', 'token-balance'],
    queryFn: () => api.get<{ balance: number }>('/users/me/token-balance'),
    staleTime: 1000 * 30, // 30초 (결제 후 빠른 갱신)
    refetchOnWindowFocus: true,
  });
}

/** 프로필 수정 */
export function useUpdateProfile() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: { nickname?: string; profileImageUrl?: string }) =>
      api.patch('/users/me', data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['user', 'me'] });
    },
  });
}
```

---

## URL 상태 관리 (nuqs)

검색, 필터, 정렬 등 URL에 반영해야 하는 상태는 `nuqs`를 사용한다.

```typescript
// app/(main)/explore/page.tsx
'use client';

import { useQueryState, parseAsString, parseAsStringEnum } from 'nuqs';
import { useWorks } from '@/hooks/api/use-works';
import { GenreChip } from '@/components/genre-chip';

const GENRES = ['전체', '로맨스', '판타지', '무협', '현판', 'SF', '호러'] as const;
type Genre = (typeof GENRES)[number];

const SORTS = ['popular', 'latest', 'rating'] as const;
type Sort = (typeof SORTS)[number];

export default function ExplorePage() {
  const [genre, setGenre] = useQueryState(
    'genre',
    parseAsStringEnum<Genre>(GENRES).withDefault('전체'),
  );
  const [sort, setSort] = useQueryState(
    'sort',
    parseAsStringEnum<Sort>(SORTS).withDefault('popular'),
  );

  const { data, fetchNextPage, hasNextPage } = useWorks({
    genre: genre === '전체' ? undefined : genre,
    sort,
  });

  return (
    <div>
      {/* 장르 필터 → URL: /explore?genre=로맨스 */}
      <div className="flex gap-2 overflow-x-auto py-3">
        {GENRES.map((g) => (
          <GenreChip
            key={g}
            label={g}
            variant={genre === g ? 'active' : 'default'}
            onClick={() => setGenre(g)}
          />
        ))}
      </div>

      {/* 정렬 → URL: /explore?genre=로맨스&sort=latest */}
      <select
        value={sort}
        onChange={(e) => setSort(e.target.value as Sort)}
        className="rounded-md border px-3 py-1.5 text-caption"
      >
        <option value="popular">인기순</option>
        <option value="latest">최신순</option>
        <option value="rating">별점순</option>
      </select>

      {/* 작품 목록 */}
      {/* ... */}
    </div>
  );
}
```

---

## 상태 도구 선택 요약

| 상태 예시 | 도구 | 이유 |
|-----------|------|------|
| 로그인 사용자 정보 | **Zustand** (persist) | 전역, 영속, 여러 페이지에서 참조 |
| 다크 모드 설정 | **Zustand** (persist) | 전역, 영속 |
| 사이드바 열림/닫힘 | **Zustand** | 전역, 영속 불필요 |
| 리더 폰트 크기 | **Jotai** (atomWithStorage) | 뷰어 한정, 디바이스별 영속 |
| 현재 페이지 번호 | **Jotai** | 뷰어 한정, 세션 한정 |
| 뷰어 UI 토글 상태 | **Jotai** | 뷰어 한정, 휘발 |
| 작품 목록 | **TanStack Query** | 서버 데이터, 캐싱, 페이지네이션 |
| 회차 본문 | **TanStack Query** | 서버 데이터, 캐싱 |
| 토큰 잔액 | **TanStack Query** + **Zustand** 동기화 | 서버가 원본, UI 빠른 접근 |
| 검색 필터/정렬 | **nuqs** | URL 상태, 공유 가능, 뒤로가기 |
| 모달 열림 상태 | **React useState** | 단일 컴포넌트 한정 |

---

## Providers 조합

```tsx
// components/providers/index.tsx
'use client';

import { ThemeProvider } from 'next-themes';
import { QueryProvider } from './query-provider';
import { Provider as JotaiProvider } from 'jotai';
import { ServiceWorkerRegister } from '@/components/pwa/sw-register';
import { InstallPrompt } from '@/components/pwa/install-prompt';
import { OfflineIndicator } from '@/components/pwa/offline-indicator';
import { Toaster } from 'sonner';

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <ThemeProvider attribute="class" defaultTheme="system" enableSystem disableTransitionOnChange>
      <QueryProvider>
        <JotaiProvider>
          {children}
          <Toaster position="bottom-center" richColors />
          <ServiceWorkerRegister />
          <InstallPrompt />
          <OfflineIndicator />
        </JotaiProvider>
      </QueryProvider>
    </ThemeProvider>
  );
}
```

---

## 디렉토리 구조

```
src/
├── stores/              # Zustand 스토어 (전역 영속 상태)
│   ├── auth.store.ts
│   └── app.store.ts
│
├── atoms/               # Jotai atoms (컴포넌트 범위 상태)
│   ├── reader.ts
│   └── reader-derived.ts
│
├── hooks/
│   ├── api/             # TanStack Query hooks (서버 상태)
│   │   ├── use-works.ts
│   │   ├── use-episode.ts
│   │   └── use-user.ts
│   └── use-reading-progress.ts
│
├── lib/
│   ├── api/
│   │   └── client.ts    # fetch 래퍼
│   └── query-client.ts  # QueryClient 팩토리
│
└── components/
    └── providers/
        ├── index.tsx
        └── query-provider.tsx
```
