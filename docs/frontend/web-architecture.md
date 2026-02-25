# 프론트엔드 웹 아키텍처

## 기술 스택 요약

| 카테고리 | 기술 | 버전 |
|----------|------|------|
| 프레임워크 | Next.js (App Router, PPR, Turbopack) | 16 |
| UI 라이브러리 | React (Server Components, `use()` hook) | 19.2 |
| 스타일링 | Tailwind CSS (`@theme` directive) | 4 |
| 번들러 (dev) | Turbopack | built-in |
| HTTP 어댑터 | Fastify (백엔드) | - |

---

## 라우트 트리 (app/ 디렉토리 구조)

```
app/
├── layout.tsx                      # RootLayout: 폰트, 메타데이터, Providers
├── not-found.tsx                   # 글로벌 404
├── error.tsx                       # 글로벌 에러 바운더리
├── loading.tsx                     # 글로벌 서스펜스 폴백
│
├── (auth)/                         # 인증 라우트 그룹 (레이아웃: 로고 + 센터 카드)
│   ├── layout.tsx
│   ├── login/page.tsx
│   ├── register/page.tsx
│   ├── forgot-password/page.tsx
│   └── onboarding/page.tsx         # 취향 설정
│
├── (main)/                         # 메인 앱 라우트 그룹 (하단 탭 + 헤더)
│   ├── layout.tsx                  # MainLayout: BottomNav, Header
│   ├── page.tsx                    # 홈 피드 (/)
│   ├── explore/
│   │   └── page.tsx                # 탐색 (/explore)
│   ├── search/
│   │   └── page.tsx                # 검색 (/search?q=)
│   ├── library/
│   │   ├── page.tsx                # 서재 (/library)
│   │   └── downloads/page.tsx      # 다운로드 관리
│   └── my/
│       ├── page.tsx                # 마이페이지 (/my)
│       ├── tokens/page.tsx         # 토큰 충전
│       ├── purchases/page.tsx      # 구매 내역
│       └── settings/page.tsx       # 설정
│
├── works/[workId]/                 # 작품 상세 (독립 레이아웃)
│   ├── layout.tsx
│   ├── page.tsx                    # 작품 정보
│   └── episodes/page.tsx           # 회차 목록
│
├── reader/[workId]/[episodeId]/    # 뷰어 (풀스크린, 독립 레이아웃)
│   ├── layout.tsx                  # ReaderLayout: 몰입모드, 제스처 컨텍스트
│   └── page.tsx
│
├── api/                            # Route Handlers
│   ├── auth/[...nextauth]/route.ts
│   └── revalidate/route.ts         # On-demand ISR
│
└── manifest.ts                     # PWA manifest (동적 생성)
```

---

## 미들웨어 설계

### middleware.ts

```typescript
import { NextRequest, NextResponse } from 'next/server';
import { getToken } from 'next-auth/jwt';

// 인증이 필요한 경로
const PROTECTED_ROUTES = ['/library', '/my', '/reader'];
// 인증 후 접근 불가 경로
const AUTH_ROUTES = ['/login', '/register'];

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const token = await getToken({ req: request });
  const response = NextResponse.next();

  // 1. 디바이스 감지 → 커스텀 헤더
  const ua = request.headers.get('user-agent') ?? '';
  const isMobile = /iPhone|iPad|Android|Mobile/i.test(ua);
  response.headers.set('x-device-type', isMobile ? 'mobile' : 'desktop');

  // 2. 인증 체크
  if (PROTECTED_ROUTES.some((r) => pathname.startsWith(r))) {
    if (!token) {
      const loginUrl = new URL('/login', request.url);
      loginUrl.searchParams.set('callbackUrl', pathname);
      return NextResponse.redirect(loginUrl);
    }
  }

  // 3. 로그인 상태에서 auth 페이지 접근 시 홈으로 리다이렉트
  if (AUTH_ROUTES.some((r) => pathname.startsWith(r)) && token) {
    return NextResponse.redirect(new URL('/', request.url));
  }

  return response;
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|icons|api/auth).*)'],
};
```

---

## SSR / CSR / PPR 전략

| 라우트 | 렌더링 전략 | 이유 |
|--------|-------------|------|
| `/` (홈) | **PPR** | 셸은 정적, 추천/인기 섹션은 스트리밍 |
| `/explore` | **PPR** | 장르 탭은 정적, 작품 목록은 동적 |
| `/search` | **CSR** | 전적으로 클라이언트 인터랙션 의존 |
| `/works/[workId]` | **PPR** | 작품 메타 정적 프리렌더 + 회차/댓글 스트리밍 |
| `/reader/[workId]/[episodeId]` | **SSR** | 인증 + 구매 검증 필요, 콘텐츠 보호 |
| `/library` | **SSR** | 사용자별 데이터, 캐시 불가 |
| `/my` | **SSR** | 사용자 개인 정보 |
| `/login`, `/register` | **Static** | 완전 정적 페이지 |

### PPR 적용 예시 (홈 페이지)

```tsx
// app/(main)/page.tsx
import { Suspense } from 'react';
import { HeroBanner } from '@/components/home/hero-banner';
import { ContinueReading } from '@/components/home/continue-reading';
import { RecommendedWorks } from '@/components/home/recommended-works';
import { TrendingWorks } from '@/components/home/trending-works';
import { WorkCardSkeleton } from '@/components/skeletons';

// 정적 셸 (PPR: 빌드 시 프리렌더)
export default function HomePage() {
  return (
    <main className="flex flex-col gap-6 pb-20">
      {/* 정적: 배너 레이아웃 (콘텐츠는 동적) */}
      <Suspense fallback={<div className="h-48 animate-pulse rounded-xl bg-muted" />}>
        <HeroBanner />
      </Suspense>

      {/* 동적: 사용자별 이어읽기 */}
      <Suspense fallback={<WorkCardSkeleton count={1} variant="horizontal" />}>
        <ContinueReading />
      </Suspense>

      {/* 동적: AI 맞춤 추천 */}
      <Suspense fallback={<WorkCardSkeleton count={4} variant="carousel" />}>
        <RecommendedWorks />
      </Suspense>

      {/* 동적: 인기 작품 */}
      <Suspense fallback={<WorkCardSkeleton count={4} variant="carousel" />}>
        <TrendingWorks />
      </Suspense>
    </main>
  );
}
```

---

## 레이아웃 계층 구조

```
RootLayout (app/layout.tsx)
  ├─ ThemeProvider (다크/라이트 모드)
  ├─ QueryProvider (TanStack Query)
  ├─ AuthSessionProvider
  ├─ ToastProvider (sonner)
  │
  ├── AuthLayout (app/(auth)/layout.tsx)
  │     └─ 로고 + 중앙 정렬 카드
  │
  ├── MainLayout (app/(main)/layout.tsx)
  │     ├─ Header (로고, 알림, 프로필)
  │     ├─ <main>{children}</main>
  │     └─ BottomNav (홈/탐색/검색/서재/MY)
  │
  ├── WorkDetailLayout (app/works/[workId]/layout.tsx)
  │     └─ 상단 뒤로가기 + 공유 버튼
  │
  └── ReaderLayout (app/reader/[workId]/[episodeId]/layout.tsx)
        └─ 풀스크린, 제스처 Provider, 상태바 숨김
```

### RootLayout 구현

```tsx
// app/layout.tsx
import type { Metadata, Viewport } from 'next';
import { Noto_Sans_KR } from 'next/font/google';
import { Providers } from '@/components/providers';
import '@/styles/globals.css';

const notoSansKR = Noto_Sans_KR({
  subsets: ['latin'],
  weight: ['400', '500', '700'],
  variable: '--font-sans',
  display: 'swap',
});

export const metadata: Metadata = {
  title: { default: '스토리AI', template: '%s | 스토리AI' },
  description: 'AI가 만드는 무한한 소설의 세계',
  manifest: '/manifest.webmanifest',
  appleWebApp: { capable: true, statusBarStyle: 'default', title: '스토리AI' },
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: '#ffffff' },
    { media: '(prefers-color-scheme: dark)', color: '#09090b' },
  ],
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ko" suppressHydrationWarning>
      <body className={`${notoSansKR.variable} font-sans antialiased`}>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
```

### MainLayout 구현

```tsx
// app/(main)/layout.tsx
import { Header } from '@/components/layout/header';
import { BottomNav } from '@/components/layout/bottom-nav';

export default function MainLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-dvh flex-col">
      <Header />
      <main className="flex-1 px-4">{children}</main>
      <BottomNav />
    </div>
  );
}
```

---

## API 클라이언트 설계

### fetch 래퍼 (인터셉터 패턴)

```typescript
// lib/api/client.ts
import { getSession } from 'next-auth/react';

const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:4000';

interface ApiOptions extends Omit<RequestInit, 'body'> {
  body?: unknown;
  params?: Record<string, string>;
}

class ApiError extends Error {
  constructor(
    public status: number,
    public data: unknown,
  ) {
    super(`API Error: ${status}`);
    this.name = 'ApiError';
  }
}

async function apiFetch<T>(endpoint: string, options: ApiOptions = {}): Promise<T> {
  const { body, params, headers: customHeaders, ...rest } = options;

  // URL 빌드
  const url = new URL(`${API_BASE}${endpoint}`);
  if (params) {
    Object.entries(params).forEach(([k, v]) => url.searchParams.set(k, v));
  }

  // 인증 토큰 주입
  const session = await getSession();
  const headers = new Headers(customHeaders);
  headers.set('Content-Type', 'application/json');
  if (session?.accessToken) {
    headers.set('Authorization', `Bearer ${session.accessToken}`);
  }

  const response = await fetch(url.toString(), {
    ...rest,
    headers,
    body: body ? JSON.stringify(body) : undefined,
  });

  // 401 → 토큰 갱신 시도
  if (response.status === 401 && session?.refreshToken) {
    const refreshed = await refreshAccessToken(session.refreshToken);
    if (refreshed) {
      headers.set('Authorization', `Bearer ${refreshed}`);
      const retryResponse = await fetch(url.toString(), {
        ...rest,
        headers,
        body: body ? JSON.stringify(body) : undefined,
      });
      if (!retryResponse.ok) throw new ApiError(retryResponse.status, await retryResponse.json());
      return retryResponse.json() as Promise<T>;
    }
  }

  if (!response.ok) {
    throw new ApiError(response.status, await response.json());
  }

  return response.json() as Promise<T>;
}

// 편의 메서드
export const api = {
  get: <T>(url: string, params?: Record<string, string>) =>
    apiFetch<T>(url, { method: 'GET', params }),
  post: <T>(url: string, body?: unknown) =>
    apiFetch<T>(url, { method: 'POST', body }),
  patch: <T>(url: string, body?: unknown) =>
    apiFetch<T>(url, { method: 'PATCH', body }),
  delete: <T>(url: string) =>
    apiFetch<T>(url, { method: 'DELETE' }),
};
```

### Server Action에서 직접 fetch

```typescript
// app/actions/works.ts
'use server';

import { cookies } from 'next/headers';

const API_BASE = process.env.API_INTERNAL_URL ?? 'http://api:4000';

export async function getWorkDetail(workId: string) {
  const cookieStore = await cookies();
  const token = cookieStore.get('session-token')?.value;

  const res = await fetch(`${API_BASE}/works/${workId}`, {
    headers: { Authorization: `Bearer ${token}` },
    next: { revalidate: 60, tags: [`work-${workId}`] },
  });

  if (!res.ok) throw new Error('작품 정보를 불러올 수 없습니다.');
  return res.json();
}
```

---

## 페이지 전환 애니메이션 (framer-motion 12)

```tsx
// components/providers/page-transition.tsx
'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { usePathname } from 'next/navigation';

const variants = {
  initial: { opacity: 0, y: 8 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -8 },
};

export function PageTransition({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  return (
    <AnimatePresence mode="wait" initial={false}>
      <motion.div
        key={pathname}
        variants={variants}
        initial="initial"
        animate="animate"
        exit="exit"
        transition={{ duration: 0.2, ease: 'easeInOut' }}
      >
        {children}
      </motion.div>
    </AnimatePresence>
  );
}
```

---

## 환경 변수

```env
# .env.local
NEXT_PUBLIC_API_URL=http://localhost:4000
API_INTERNAL_URL=http://api:4000
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=your-secret-key

# OAuth
KAKAO_CLIENT_ID=...
KAKAO_CLIENT_SECRET=...
NAVER_CLIENT_ID=...
NAVER_CLIENT_SECRET=...
GOOGLE_CLIENT_ID=...
GOOGLE_CLIENT_SECRET=...
```
