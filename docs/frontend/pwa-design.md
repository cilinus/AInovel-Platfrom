# PWA 설계 문서

## 개요

스토리AI는 PWA-first 전략을 채택한다. 네이티브 앱 없이도 홈 화면 설치, 오프라인 읽기, 푸시 알림 등 앱 수준의 경험을 제공하는 것이 목표이다.

### 핵심 목표

| 목표 | 설명 | 측정 기준 |
|------|------|-----------|
| 설치 가능 | 홈 화면 아이콘으로 실행 | installability audit pass |
| 오프라인 독서 | 다운로드한 회차를 네트워크 없이 열람 | IndexedDB 기반 콘텐츠 제공 |
| 빠른 재방문 | 앱 셸 캐싱으로 즉시 로딩 | LCP < 1.5s (재방문) |
| 푸시 알림 | 새 회차, 추천 작품 알림 | FCM 기반 전달 |

---

## @serwist/next 통합

> `next-pwa`는 유지보수 중단 상태이므로 후속 프로젝트인 `@serwist/next`를 사용한다.

### 설치 및 설정

```bash
pnpm add @serwist/next @serwist/precaching @serwist/strategies @serwist/routing
```

### next.config.ts

```typescript
// next.config.ts
import withSerwistInit from '@serwist/next';

const withSerwist = withSerwistInit({
  swSrc: 'app/sw.ts',
  swDest: 'public/sw.js',
  reloadOnOnline: true,
  disable: process.env.NODE_ENV === 'development',
});

const nextConfig = {
  experimental: {
    ppr: true,
    turbo: {},
  },
};

export default withSerwist(nextConfig);
```

---

## Service Worker 등록 및 생명주기

### SW 등록 컴포넌트

```tsx
// components/pwa/sw-register.tsx
'use client';

import { useEffect } from 'react';
import { toast } from 'sonner';

export function ServiceWorkerRegister() {
  useEffect(() => {
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker
        .register('/sw.js', { scope: '/' })
        .then((registration) => {
          // 업데이트 감지
          registration.addEventListener('updatefound', () => {
            const newWorker = registration.installing;
            newWorker?.addEventListener('statechange', () => {
              if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
                toast('새 버전이 있습니다.', {
                  action: {
                    label: '업데이트',
                    onClick: () => {
                      newWorker.postMessage({ type: 'SKIP_WAITING' });
                      window.location.reload();
                    },
                  },
                  duration: Infinity,
                });
              }
            });
          });
        });
    }
  }, []);

  return null;
}
```

### SW 생명주기 다이어그램

```
install → activate → fetch (이벤트 리스닝)
   │          │
   │          └─ 이전 캐시 정리 (버전 기반)
   │
   └─ 앱 셸 + 정적 에셋 프리캐시
```

---

## 캐시 전략

### 리소스 유형별 전략

| 리소스 유형 | 전략 | TTL | 설명 |
|-------------|------|-----|------|
| 앱 셸 (HTML/JS/CSS) | **Precache** | 빌드 시 갱신 | `@serwist/precaching` |
| 폰트 (.woff2) | **Cache First** | 1년 | 불변 리소스 |
| 이미지 (표지, 배너) | **Stale While Revalidate** | 7일 | 사용자 체감 속도 + 최신성 |
| API (작품 목록, 검색) | **Network First** | 5분 폴백 | 최신 데이터 우선, 오프라인 폴백 |
| API (작품 상세) | **Stale While Revalidate** | 1시간 | 자주 변하지 않음 |
| 소설 본문 (다운로드) | **Cache Only** | 수동 삭제 | IndexedDB 저장 |

### app/sw.ts 구현

```typescript
// app/sw.ts
import { defaultCache } from '@serwist/next/worker';
import { Serwist } from 'serwist';
import { CacheFirst, NetworkFirst, StaleWhileRevalidate } from '@serwist/strategies';
import { ExpirationPlugin } from '@serwist/expiration';
import { registerRoute } from '@serwist/routing';
import { precacheAndRoute } from '@serwist/precaching';

declare const self: ServiceWorkerGlobalScope & { __SW_MANIFEST: any };

// 프리캐시 (빌드 에셋)
precacheAndRoute(self.__SW_MANIFEST);

// 폰트 → Cache First (1년)
registerRoute(
  ({ request }) => request.destination === 'font',
  new CacheFirst({
    cacheName: 'fonts-cache',
    plugins: [
      new ExpirationPlugin({ maxAgeSeconds: 60 * 60 * 24 * 365 }),
    ],
  }),
);

// 이미지 → Stale While Revalidate (7일, 최대 200개)
registerRoute(
  ({ request }) => request.destination === 'image',
  new StaleWhileRevalidate({
    cacheName: 'images-cache',
    plugins: [
      new ExpirationPlugin({ maxEntries: 200, maxAgeSeconds: 60 * 60 * 24 * 7 }),
    ],
  }),
);

// API (목록/검색) → Network First (5분 폴백)
registerRoute(
  ({ url }) => url.pathname.startsWith('/api/') && !url.pathname.includes('/episodes/content'),
  new NetworkFirst({
    cacheName: 'api-cache',
    plugins: [
      new ExpirationPlugin({ maxEntries: 100, maxAgeSeconds: 60 * 5 }),
    ],
    networkTimeoutSeconds: 3,
  }),
);

// skip waiting 메시지 핸들러
self.addEventListener('message', (event) => {
  if (event.data?.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});
```

---

## 오프라인 읽기 지원 (IndexedDB)

### 데이터베이스 스키마

```typescript
// lib/offline/db.ts
import { openDB, type IDBPDatabase } from 'idb';

interface OfflineDB {
  episodes: {
    key: string;               // `${workId}:${episodeId}`
    value: {
      workId: string;
      episodeId: string;
      workTitle: string;
      episodeNumber: number;
      episodeTitle: string;
      content: string;          // 소설 본문 텍스트
      downloadedAt: number;     // timestamp
      fileSize: number;         // bytes
    };
    indexes: {
      'by-work': string;        // workId
      'by-date': number;        // downloadedAt
    };
  };
  readingProgress: {
    key: string;               // `${workId}:${episodeId}`
    value: {
      workId: string;
      episodeId: string;
      scrollPosition: number;
      pageIndex: number;
      percentage: number;
      updatedAt: number;
    };
    indexes: {
      'by-work': string;
    };
  };
  downloadQueue: {
    key: string;
    value: {
      workId: string;
      episodeId: string;
      status: 'pending' | 'downloading' | 'completed' | 'failed';
      priority: number;
      createdAt: number;
    };
  };
}

export async function getDB(): Promise<IDBPDatabase<OfflineDB>> {
  return openDB<OfflineDB>('storyai-offline', 1, {
    upgrade(db) {
      // episodes 스토어
      const episodeStore = db.createObjectStore('episodes', { keyPath: 'episodeId' });
      episodeStore.createIndex('by-work', 'workId');
      episodeStore.createIndex('by-date', 'downloadedAt');

      // readingProgress 스토어
      const progressStore = db.createObjectStore('readingProgress', {
        keyPath: ['workId', 'episodeId'],
      });
      progressStore.createIndex('by-work', 'workId');

      // downloadQueue 스토어
      db.createObjectStore('downloadQueue', { keyPath: 'episodeId' });
    },
  });
}
```

### 다운로드 매니저

```typescript
// lib/offline/download-manager.ts
import { getDB } from './db';
import { api } from '@/lib/api/client';

export class DownloadManager {
  private isProcessing = false;

  /** 작품 전체 회차 다운로드 큐 등록 */
  async enqueueWork(workId: string, episodeIds: string[]) {
    const db = await getDB();
    const tx = db.transaction('downloadQueue', 'readwrite');

    for (let i = 0; i < episodeIds.length; i++) {
      await tx.store.put({
        workId,
        episodeId: episodeIds[i],
        status: 'pending',
        priority: i,
        createdAt: Date.now(),
      });
    }
    await tx.done;

    this.processQueue();
  }

  /** 큐 순차 처리 */
  private async processQueue() {
    if (this.isProcessing) return;
    this.isProcessing = true;

    const db = await getDB();
    try {
      const pending = await db.getAll('downloadQueue');
      const sorted = pending
        .filter((item) => item.status === 'pending')
        .sort((a, b) => a.priority - b.priority);

      for (const item of sorted) {
        await db.put('downloadQueue', { ...item, status: 'downloading' });

        try {
          const content = await api.get<{ content: string }>(
            `/episodes/${item.episodeId}/content`,
          );

          await db.put('episodes', {
            workId: item.workId,
            episodeId: item.episodeId,
            workTitle: '',
            episodeNumber: 0,
            episodeTitle: '',
            content: content.content,
            downloadedAt: Date.now(),
            fileSize: new Blob([content.content]).size,
          });

          await db.put('downloadQueue', { ...item, status: 'completed' });
        } catch {
          await db.put('downloadQueue', { ...item, status: 'failed' });
        }
      }
    } finally {
      this.isProcessing = false;
    }
  }

  /** 저장된 용량 조회 */
  async getStorageUsage(): Promise<{ used: number; count: number }> {
    const db = await getDB();
    const all = await db.getAll('episodes');
    return {
      count: all.length,
      used: all.reduce((sum, ep) => sum + ep.fileSize, 0),
    };
  }
}

export const downloadManager = new DownloadManager();
```

---

## 홈 화면 추가 (A2HS)

### Install 배너 컴포넌트

```tsx
// components/pwa/install-prompt.tsx
'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Drawer, DrawerContent, DrawerHeader, DrawerTitle } from 'vaul';
import { Download } from 'lucide-react';

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

export function InstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [showBanner, setShowBanner] = useState(false);

  useEffect(() => {
    // 이미 설치된 경우 또는 이전에 닫은 경우 표시하지 않음
    const dismissed = localStorage.getItem('pwa-install-dismissed');
    if (dismissed && Date.now() - Number(dismissed) < 7 * 24 * 60 * 60 * 1000) return;

    const handler = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
      setShowBanner(true);
    };

    window.addEventListener('beforeinstallprompt', handler);
    return () => window.removeEventListener('beforeinstallprompt', handler);
  }, []);

  const handleInstall = async () => {
    if (!deferredPrompt) return;
    await deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === 'accepted') {
      setShowBanner(false);
    }
    setDeferredPrompt(null);
  };

  const handleDismiss = () => {
    setShowBanner(false);
    localStorage.setItem('pwa-install-dismissed', String(Date.now()));
  };

  if (!showBanner) return null;

  return (
    <Drawer open={showBanner} onOpenChange={setShowBanner}>
      <DrawerContent>
        <DrawerHeader>
          <DrawerTitle>앱처럼 사용하기</DrawerTitle>
        </DrawerHeader>
        <div className="flex flex-col gap-4 px-4 pb-6">
          <p className="text-sm text-muted-foreground">
            홈 화면에 추가하면 더 빠르게 접근하고, 오프라인에서도 읽을 수 있어요!
          </p>
          <Button onClick={handleInstall} className="w-full">
            <Download className="mr-2 h-4 w-4" />
            홈 화면에 추가
          </Button>
          <Button variant="ghost" onClick={handleDismiss} className="w-full">
            나중에
          </Button>
        </div>
      </DrawerContent>
    </Drawer>
  );
}
```

### Web App Manifest

```typescript
// app/manifest.ts
import type { MetadataRoute } from 'next';

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: '스토리AI - 무한한 이야기',
    short_name: '스토리AI',
    description: 'AI가 만드는 무한한 소설의 세계',
    start_url: '/',
    display: 'standalone',
    orientation: 'portrait-primary',
    theme_color: '#6366f1',
    background_color: '#ffffff',
    categories: ['books', 'entertainment'],
    icons: [
      { src: '/icons/icon-192.png', sizes: '192x192', type: 'image/png', purpose: 'maskable' },
      { src: '/icons/icon-512.png', sizes: '512x512', type: 'image/png', purpose: 'any' },
    ],
    screenshots: [
      { src: '/screenshots/home.png', sizes: '1080x1920', type: 'image/png', form_factor: 'narrow' },
      { src: '/screenshots/reader.png', sizes: '1080x1920', type: 'image/png', form_factor: 'narrow' },
    ],
  };
}
```

---

## 푸시 알림 아키텍처

### 흐름도

```
클라이언트                     백엔드 (NestJS)              FCM
─────────                     ───────────────              ───
1. 알림 권한 요청
2. FCM 토큰 발급 ───────────► 3. 토큰 저장 (MongoDB)
                                    │
                               4. 새 회차 발행 이벤트
                                    │
                               5. 구독자 토큰 조회
                                    │
                                    └──────────────────► 6. FCM 전송
                                                              │
7. SW push 이벤트 수신 ◄──────────────────────────────────────┘
8. 알림 표시 (Notification API)
9. 알림 클릭 → 뷰어 페이지 이동
```

### 클라이언트 측 구현

```typescript
// lib/push/register.ts
import { api } from '@/lib/api/client';

export async function registerPushSubscription() {
  if (!('Notification' in window) || !('serviceWorker' in navigator)) return;

  const permission = await Notification.requestPermission();
  if (permission !== 'granted') return;

  const registration = await navigator.serviceWorker.ready;

  const subscription = await registration.pushManager.subscribe({
    userVisibleOnly: true,
    applicationServerKey: process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY,
  });

  // 서버에 구독 정보 저장
  await api.post('/push/subscribe', {
    endpoint: subscription.endpoint,
    keys: {
      p256dh: btoa(String.fromCharCode(...new Uint8Array(subscription.getKey('p256dh')!))),
      auth: btoa(String.fromCharCode(...new Uint8Array(subscription.getKey('auth')!))),
    },
  });
}
```

### Service Worker 푸시 핸들러

```typescript
// sw.ts 내부 추가
self.addEventListener('push', (event: PushEvent) => {
  const data = event.data?.json() ?? {};

  const options: NotificationOptions = {
    body: data.body ?? '새로운 소식이 있습니다.',
    icon: '/icons/icon-192.png',
    badge: '/icons/badge-72.png',
    tag: data.tag ?? 'default',
    data: { url: data.url ?? '/' },
    actions: [
      { action: 'open', title: '바로 읽기' },
      { action: 'close', title: '닫기' },
    ],
  };

  event.waitUntil(
    self.registration.showNotification(data.title ?? '스토리AI', options),
  );
});

self.addEventListener('notificationclick', (event: NotificationEvent) => {
  event.notification.close();

  const url = event.notification.data?.url ?? '/';
  event.waitUntil(
    self.clients.matchAll({ type: 'window' }).then((clients) => {
      // 이미 열린 탭이 있으면 포커스
      for (const client of clients) {
        if (client.url === url && 'focus' in client) {
          return client.focus();
        }
      }
      // 없으면 새 탭
      return self.clients.openWindow(url);
    }),
  );
});
```

---

## 오프라인 상태 감지 UI

```tsx
// components/pwa/offline-indicator.tsx
'use client';

import { useSyncExternalStore } from 'react';
import { WifiOff } from 'lucide-react';

function subscribe(callback: () => void) {
  window.addEventListener('online', callback);
  window.addEventListener('offline', callback);
  return () => {
    window.removeEventListener('online', callback);
    window.removeEventListener('offline', callback);
  };
}

export function OfflineIndicator() {
  const isOnline = useSyncExternalStore(
    subscribe,
    () => navigator.onLine,
    () => true, // SSR fallback
  );

  if (isOnline) return null;

  return (
    <div className="fixed top-0 z-50 flex w-full items-center justify-center gap-2 bg-destructive py-1 text-xs text-destructive-foreground">
      <WifiOff className="h-3 w-3" />
      오프라인 모드 - 저장된 작품만 읽을 수 있습니다
    </div>
  );
}
```

---

## 알림 유형별 페이로드

| 알림 유형 | tag | 데이터 예시 |
|-----------|-----|-------------|
| 새 회차 | `new-episode:{workId}` | `{ title: "악녀의 두 번째 인생", body: "101화가 업데이트되었습니다", url: "/reader/abc/ep101" }` |
| 맞춤 추천 | `recommendation` | `{ title: "오늘의 추천", body: "취향 저격 신작이 도착했어요", url: "/works/xyz" }` |
| 무료 이벤트 | `free-event:{workId}` | `{ title: "무료 회차 오픈!", body: "1~10화 무료 열람", url: "/works/abc" }` |
| 댓글 알림 | `comment:{episodeId}` | `{ title: "새 답글", body: "내 댓글에 답글이 달렸습니다", url: "/works/abc/episodes#comments" }` |
