# REST API 엔드포인트 명세서

## 1. 개요

모든 엔드포인트는 `/api/v1` 접두사를 사용한다. 인증이 필요한 엔드포인트는 `Authorization: Bearer <token>` 헤더가 필수이다.

### 공통 응답 형식

```typescript
interface ApiResponse<T> {
  success: boolean;
  data: T;
  timestamp: string;
}

interface PaginatedResponse<T> extends ApiResponse<T[]> {
  meta: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

interface ErrorResponse {
  success: false;
  statusCode: number;
  message: string | string[];
  timestamp: string;
}
```

---

## 2. Auth 모듈 (`/auth`)

| # | Method | Path | Auth | 설명 |
|---|--------|------|------|------|
| 1 | POST | `/auth/register` | X | 이메일 회원가입 |
| 2 | POST | `/auth/login` | X | 이메일 로그인 |
| 3 | POST | `/auth/refresh` | Cookie | 토큰 갱신 |
| 4 | POST | `/auth/logout` | O | 로그아웃 (리프레시 토큰 무효화) |
| 5 | POST | `/auth/social/kakao` | X | 카카오 소셜 로그인 |
| 6 | POST | `/auth/social/naver` | X | 네이버 소셜 로그인 |
| 7 | POST | `/auth/social/google` | X | 구글 소셜 로그인 |
| 8 | GET | `/auth/social/kakao/callback` | X | 카카오 콜백 |
| 9 | GET | `/auth/social/naver/callback` | X | 네이버 콜백 |
| 10 | GET | `/auth/social/google/callback` | X | 구글 콜백 |
| 11 | POST | `/auth/password/reset-request` | X | 비밀번호 재설정 요청 |
| 12 | POST | `/auth/password/reset` | X | 비밀번호 재설정 실행 |

### 주요 요청/응답

```typescript
// POST /auth/register
interface RegisterDto {
  email: string;          // @IsEmail()
  password: string;       // @MinLength(8) @Matches(/^(?=.*[a-zA-Z])(?=.*\d)/)
  nickname: string;       // @Length(2, 20)
  agreeTerms: boolean;    // @IsTrue()
  agreePrivacy: boolean;  // @IsTrue()
}
// Response 201: { accessToken: string } + Set-Cookie: refreshToken

// POST /auth/login
interface LoginDto {
  email: string;
  password: string;
}
// Response 200: { accessToken: string, user: UserProfile } + Set-Cookie: refreshToken

// POST /auth/social/{provider}
interface SocialLoginDto {
  code: string;           // OAuth 인가 코드
  redirectUri: string;
}
// Response 200: { accessToken: string, user: UserProfile, isNewUser: boolean }
```

---

## 3. Users 모듈 (`/users`)

| # | Method | Path | Auth | Role | 설명 |
|---|--------|------|------|------|------|
| 13 | GET | `/users/me` | O | ANY | 내 프로필 조회 |
| 14 | PATCH | `/users/me` | O | ANY | 내 프로필 수정 |
| 15 | PATCH | `/users/me/password` | O | ANY | 비밀번호 변경 |
| 16 | DELETE | `/users/me` | O | ANY | 회원 탈퇴 (소프트 삭제) |
| 17 | GET | `/users/me/library` | O | ANY | 내 구매 라이브러리 |
| 18 | GET | `/users/me/bookmarks` | O | ANY | 내 북마크 목록 |
| 19 | POST | `/users/me/bookmarks/:workId` | O | ANY | 작품 북마크 추가 |
| 20 | DELETE | `/users/me/bookmarks/:workId` | O | ANY | 북마크 제거 |
| 21 | GET | `/users/me/reading-history` | O | ANY | 열람 기록 |
| 22 | GET | `/users/:id` | X | - | 공개 프로필 조회 |
| 23 | POST | `/users/me/author-request` | O | USER | 작가 신청 |

```typescript
// PATCH /users/me
interface UpdateProfileDto {
  nickname?: string;      // @Length(2, 20) @IsOptional()
  bio?: string;           // @MaxLength(200) @IsOptional()
  avatarUrl?: string;     // @IsUrl() @IsOptional()
}

// GET /users/me/library?page=1&limit=20
// Response 200: PaginatedResponse<LibraryItem>
interface LibraryItem {
  episodeId: string;
  workId: string;
  workTitle: string;
  episodeNumber: number;
  episodeTitle: string;
  purchasedAt: string;
  lastReadAt: string | null;
}
```

---

## 4. Works 모듈 (`/works`)

| # | Method | Path | Auth | Role | 설명 |
|---|--------|------|------|------|------|
| 24 | GET | `/works` | X | - | 작품 목록 (페이지네이션) |
| 25 | GET | `/works/search` | X | - | 작품 검색 |
| 26 | GET | `/works/ranking` | X | - | 인기 랭킹 |
| 27 | GET | `/works/:id` | X | - | 작품 상세 |
| 28 | POST | `/works` | O | AUTHOR | 작품 생성 |
| 29 | PATCH | `/works/:id` | O | AUTHOR | 작품 수정 (본인) |
| 30 | DELETE | `/works/:id` | O | AUTHOR | 작품 삭제 (본인) |
| 31 | GET | `/works/:id/stats` | O | AUTHOR | 작품 통계 (본인) |
| 32 | POST | `/works/:id/rate` | O | USER | 작품 평가 (1-5점) |
| 33 | GET | `/works/genres` | X | - | 장르 목록 |

```typescript
// GET /works?page=1&limit=20&genre=fantasy&sort=latest&status=ongoing
interface WorksQueryDto {
  page?: number;          // @Min(1) default 1
  limit?: number;         // @Min(1) @Max(50) default 20
  genre?: Genre;          // @IsEnum(Genre) @IsOptional()
  sort?: 'latest' | 'popular' | 'rating';
  status?: 'ongoing' | 'completed' | 'hiatus';
  keyword?: string;       // @MaxLength(50) @IsOptional()
}

// POST /works
interface CreateWorkDto {
  title: string;          // @Length(1, 100)
  description: string;    // @Length(10, 2000)
  genre: Genre;           // @IsEnum(Genre)
  tags: string[];         // @ArrayMaxSize(10)
  coverImageUrl?: string;
  isAIGenerated: boolean;
  ageRating: 'ALL' | '15+' | '19+';
}

// Response: WorkDetail
interface WorkDetail {
  _id: string;
  title: string;
  description: string;
  author: { _id: string; nickname: string; avatarUrl: string };
  genre: Genre;
  tags: string[];
  coverImageUrl: string;
  status: 'draft' | 'ongoing' | 'completed' | 'hiatus' | 'suspended';
  ageRating: string;
  isAIGenerated: boolean;
  stats: { views: number; likes: number; avgRating: number; episodeCount: number };
  createdAt: string;
  updatedAt: string;
}
```

---

## 5. Episodes 모듈 (`/episodes`)

| # | Method | Path | Auth | Role | 설명 |
|---|--------|------|------|------|------|
| 34 | GET | `/works/:workId/episodes` | X | - | 회차 목록 |
| 35 | GET | `/episodes/:id` | X/O | - | 회차 상세 (유/무료 분기) |
| 36 | GET | `/episodes/:id/content` | O | PURCHASED | 회차 본문 열람 |
| 37 | POST | `/works/:workId/episodes` | O | AUTHOR | 회차 생성 |
| 38 | PATCH | `/episodes/:id` | O | AUTHOR | 회차 수정 |
| 39 | DELETE | `/episodes/:id` | O | AUTHOR | 회차 삭제 |
| 40 | POST | `/episodes/:id/publish` | O | AUTHOR | 회차 발행 |
| 41 | POST | `/episodes/:id/schedule` | O | AUTHOR | 예약 발행 설정 |
| 42 | GET | `/episodes/:id/comments` | X | - | 회차 댓글 목록 |
| 43 | POST | `/episodes/:id/comments` | O | ANY | 댓글 작성 |
| 44 | DELETE | `/comments/:id` | O | OWNER/ADMIN | 댓글 삭제 |

```typescript
// POST /works/:workId/episodes
interface CreateEpisodeDto {
  title: string;          // @Length(1, 100)
  content: string;        // @MinLength(100) 본문
  episodeNumber: number;  // @Min(1)
  authorNote?: string;    // @MaxLength(500)
  isFree: boolean;
  tokenPrice: number;     // @Min(0) @Max(100) 무료면 0
}

// GET /episodes/:id/content
// Response 200
interface EpisodeContent {
  _id: string;
  title: string;
  content: string;        // 본문 (구매 확인 후)
  episodeNumber: number;
  wordCount: number;
  authorNote: string;
  prevEpisodeId: string | null;
  nextEpisodeId: string | null;
  createdAt: string;
}
```

---

## 6. Payment 모듈 (`/payments`)

| # | Method | Path | Auth | Role | 설명 |
|---|--------|------|------|------|------|
| 45 | GET | `/payments/balance` | O | ANY | 토큰 잔액 조회 |
| 46 | POST | `/payments/charge` | O | ANY | 토큰 충전 (PG 결제) |
| 47 | POST | `/payments/charge/confirm` | O | ANY | 충전 승인 확인 |
| 48 | POST | `/payments/purchase/:episodeId` | O | ANY | 에피소드 구매 |
| 49 | GET | `/payments/history` | O | ANY | 결제 내역 |
| 50 | GET | `/payments/subscriptions` | O | ANY | 구독 상태 조회 |
| 51 | POST | `/payments/subscriptions` | O | ANY | 구독 시작 |
| 52 | DELETE | `/payments/subscriptions` | O | ANY | 구독 해지 |
| 53 | GET | `/payments/settlements` | O | AUTHOR | 정산 내역 |
| 54 | POST | `/payments/refund/:transactionId` | O | ANY | 환불 요청 |

```typescript
// POST /payments/charge
interface ChargeTokensDto {
  amount: number;         // @Min(1000) 최소 1,000원, 100 단위
  paymentMethod: 'CARD' | 'TRANSFER' | 'VIRTUAL_ACCOUNT';
}
// Response 200: { orderId: string, paymentKey: string, amount: number, checkoutUrl: string }

// POST /payments/charge/confirm
interface ConfirmChargeDto {
  paymentKey: string;
  orderId: string;
  amount: number;
}
// Response 200: { tokenBalance: number, chargedTokens: number }

// POST /payments/purchase/:episodeId
// Response 200: { remainingBalance: number, tokenPrice: number }
// Response 402: { message: '토큰이 부족합니다.' }
```

---

## 7. AI 모듈 (`/ai`)

| # | Method | Path | Auth | Role | 설명 |
|---|--------|------|------|------|------|
| 55 | POST | `/ai/generate` | O | AUTHOR | AI 소설 생성 요청 |
| 56 | GET | `/ai/status/:jobId` | O | AUTHOR | 생성 작업 상태 |
| 57 | GET | `/ai/history` | O | AUTHOR | 생성 이력 |
| 58 | POST | `/ai/retry/:jobId` | O | AUTHOR | 실패한 작업 재시도 |

```typescript
// POST /ai/generate
interface GenerateNovelDto {
  workId: string;         // @IsMongoId()
  prompt: string;         // @Length(10, 2000)
  genre: Genre;
  style: 'literary' | 'web_novel' | 'light_novel';
  length: 'short' | 'medium' | 'long';  // 2000자 / 4000자 / 8000자 목표
  previousEpisodeId?: string;   // 이전 회차 컨텍스트
  temperature?: number;   // @Min(0) @Max(1) default 0.7
}
// Response 202: { jobId: string, estimatedSeconds: number }

// GET /ai/status/:jobId
// Response 200
interface AIJobStatus {
  jobId: string;
  status: 'queued' | 'processing' | 'completed' | 'failed';
  progress: number;       // 0-100
  result?: { content: string; wordCount: number };
  error?: string;
  createdAt: string;
  completedAt: string | null;
}
```

---

## 8. Admin 모듈 (`/admin`)

| # | Method | Path | Auth | Role | 설명 |
|---|--------|------|------|------|------|
| 59 | GET | `/admin/dashboard` | O | ADMIN | 대시보드 통계 |
| 60 | GET | `/admin/users` | O | ADMIN | 사용자 목록 |
| 61 | PATCH | `/admin/users/:id/role` | O | ADMIN | 역할 변경 |
| 62 | PATCH | `/admin/users/:id/ban` | O | ADMIN | 사용자 정지 |
| 63 | GET | `/admin/works` | O | ADMIN | 작품 관리 목록 |
| 64 | PATCH | `/admin/works/:id/status` | O | ADMIN | 작품 상태 변경 (승인/반려/정지) |
| 65 | GET | `/admin/reports` | O | ADMIN | 신고 목록 |
| 66 | PATCH | `/admin/reports/:id` | O | ADMIN | 신고 처리 |
| 67 | GET | `/admin/settlements` | O | ADMIN | 전체 정산 현황 |
| 68 | POST | `/admin/settlements/execute` | O | ADMIN | 정산 실행 |

```typescript
// GET /admin/dashboard
interface DashboardStats {
  users: { total: number; today: number; monthlyActive: number };
  works: { total: number; ongoing: number; completed: number };
  revenue: { todayKRW: number; monthKRW: number; totalTokensSold: number };
  ai: { totalGenerations: number; todayGenerations: number; avgProcessingTime: number };
}
```

---

## 9. 상태 코드 규약

| 코드 | 용도 |
|------|------|
| 200 | 조회, 수정 성공 |
| 201 | 리소스 생성 성공 |
| 202 | 비동기 작업 접수 (AI 생성) |
| 400 | 유효성 검증 실패 |
| 401 | 인증 필요 / 토큰 만료 |
| 402 | 토큰 잔액 부족 |
| 403 | 권한 없음 |
| 404 | 리소스 없음 |
| 409 | 중복 데이터 |
| 429 | 요청 제한 초과 |
| 500 | 서버 내부 오류 |
