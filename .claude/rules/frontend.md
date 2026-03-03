# Frontend Rules - Next.js Architecture

Frontend-specific rules and architecture guidelines for the AiNovel Platform.

## Technology Stack

- **Framework**: Next.js 15 with App Router
- **React**: React 19 with Server Components + Client Components
- **Language**: TypeScript with strict mode
- **Styling**: Styled-Components (SSR Registry)
- **State Management**: Zustand + immer + persist
- **Real-time**: Socket.IO Client
- **i18n**: i18next (ko/en)
- **Forms**: react-hook-form + zod

## Application Structure

### Routing & Layout Architecture

```
app/
  layout.tsx              # Root: StyledComponentsRegistry + ThemeProvider
  page.tsx                # Landing page
  (public)/               # No auth required
    explore/page.tsx      # Work browsing
    works/[workId]/page.tsx
  (auth)/                 # Auth pages (centered layout)
    login/page.tsx
    register/page.tsx
  (protected)/            # Auth guard layout
    my/page.tsx           # My page
    author/               # Author dashboard
```

### Component & Source Architecture

```
src/
  components/
    Layout/         # Header, Footer, Sidebar
    common/         # Button, Input, Modal, Card, Loading
    works/          # Work cards, lists
    episodes/       # Episode reader components
    auth/           # Auth forms
  stores/           # Zustand + immer + persist
    authStore.ts    # JWT auth, user state
    appStore.ts     # Theme, sidebar, UI state
    readerStore.ts  # Reader settings, progress
  hooks/            # Custom hooks
    useAuth.ts      # Login, register, logout, me
    useWorks.ts     # Work list, detail fetch
  lib/
    api.ts          # Fetch-based API client (no axios dependency)
    socket.ts       # Socket.IO client (namespace: /ws)
    i18n.ts         # i18next configuration
    registry.tsx    # styled-components SSR registry
    utils.ts        # formatNumber, formatDate, formatCurrency
  styles/
    theme.ts        # light/dark theme definition
    GlobalStyle.ts  # CSS reset + global styles
  providers/
    ThemeProvider.tsx # styled-components ThemeProvider + GlobalStyle
  types/            # Shared types (from former packages/shared)
  constants/        # Error codes, genres
  locales/          # ko.json, en.json
```

## State Management (Zustand + immer)

| Store | Responsibility |
|-------|---------------|
| authStore | JWT auth, user profile, token balance |
| appStore | Theme (light/dark/system), sidebar state |
| readerStore | Font, line height, reading mode, progress |

All stores use `immer` middleware for immutable updates and `persist` for localStorage.

## Styling Patterns

- **Theme**: All colors/fonts/radii accessed via `${({ theme }) => theme.colors.primary}`
- **SSR**: `StyledComponentsRegistry` in root layout for server-side style extraction
- **GlobalStyle**: CSS reset applied via `createGlobalStyle`
- **No Tailwind**: All styling through styled-components only

## API Pattern

- Direct `fetch` calls via `ApiClient` class (no TanStack Query)
- Hooks use `useState` + `useEffect` + `useCallback` for data fetching
- `apiClient.setAccessToken()` for auth header injection
- `credentials: 'include'` for refresh token cookie

## Mock Data Policy

목 데이터는 **백엔드 미구현 기능의 미리보기 전용**으로만 사용한다.

| 상황 | 동작 |
|------|------|
| 백엔드 구현 완료 엔드포인트 + 서버 실행 중 | 실제 API 호출 |
| 백엔드 구현 완료 엔드포인트 + 서버 미실행 | **에러 메시지 표시** (목 폴백 금지) |
| 백엔드 미구현 엔드포인트 | 목 데이터로 미리보기 제공 |

### 규칙
- `PREVIEW_ONLY_PATTERNS` (api.ts): 백엔드 미구현 엔드포인트 패턴 목록
- 백엔드에 새 엔드포인트 구현 시 → 해당 패턴을 `PREVIEW_ONLY_PATTERNS`에서 제거
- 프론트엔드에 새 기능 추가 시 (백엔드 미구현) → 해당 패턴을 `PREVIEW_ONLY_PATTERNS`에 추가
- `NEXT_PUBLIC_USE_MOCK=true`여도 구현 완료 엔드포인트는 실제 API를 호출
- **API 에러 발생 시 원인을 정확히 진단할 것 (오타/경로 오류 vs 미구현). 미구현이면 백엔드에 구현. 프론트에서 요청 차단/회피 금지**

## Do's

- Use Server Components where possible (pages without interactivity)
- Mark interactive components with `'use client'`
- Use styled-components for all styling
- Use immer for state mutations in Zustand stores
- Implement proper loading/error states
- Use TypeScript strict mode

## Don'ts

- Don't use `any` type without justification
- Don't use Tailwind CSS or inline styles
- Don't mutate state directly (use immer)
- Don't skip loading/error states
- Don't use TanStack Query (use direct fetch + hooks)
- Don't create unnecessary re-renders
