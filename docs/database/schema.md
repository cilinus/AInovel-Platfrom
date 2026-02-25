# MongoDB 컬렉션 스키마 설계

## 📋 개요

MongoDB 8.0+ 기반, Mongoose + Typegoose ODM 사용.
모든 컬렉션은 `timestamps: true` (createdAt, updatedAt 자동 관리).

---

## 📊 컬렉션 다이어그램

```
┌──────────────┐     ┌──────────────┐     ┌──────────────┐
│    users     │────<│   works      │────<│  episodes    │
│              │     │              │     │              │
│ _id          │     │ _id          │     │ _id          │
│ email        │     │ authorId →   │     │ workId →     │
│ nickname     │     │ title        │     │ number       │
│ role         │     │ genre        │     │ title        │
│ tokenBalance │     │ status       │     │ content      │
│ provider     │     │ isAiGenerated│     │ price        │
└──────┬───────┘     └──────────────┘     └──────────────┘
       │
       │  1:N          1:N                   1:N
       │
┌──────┴───────┐     ┌──────────────┐     ┌──────────────┐
│  purchases   │     │ transactions │     │  bookmarks   │
│              │     │              │     │              │
│ userId →     │     │ userId →     │     │ userId →     │
│ episodeId →  │     │ amount       │     │ workId →     │
│ tokenUsed    │     │ type         │     │ lastEpisode  │
│ type         │     │ balanceAfter │     │ readProgress │
└──────────────┘     └──────────────┘     └──────────────┘

┌──────────────┐     ┌──────────────┐     ┌──────────────┐
│   comments   │     │    likes     │     │  ai_jobs     │
│              │     │              │     │              │
│ userId →     │     │ userId →     │     │ requestedBy→ │
│ episodeId →  │     │ workId →     │     │ workId →     │
│ content      │     │              │     │ status       │
│ parentId →   │     │              │     │ result       │
└──────────────┘     └──────────────┘     └──────────────┘
```

---

## 🗄️ 컬렉션 상세

### 1. users

```typescript
import { prop, modelOptions, Severity } from '@typegoose/typegoose';

export enum UserRole {
  USER = 'USER',
  AUTHOR = 'AUTHOR',
  ADMIN = 'ADMIN',
}

export enum AuthProvider {
  LOCAL = 'LOCAL',
  KAKAO = 'KAKAO',
  NAVER = 'NAVER',
  GOOGLE = 'GOOGLE',
}

@modelOptions({
  schemaOptions: { timestamps: true, collection: 'users' },
  options: { allowMixed: Severity.ALLOW },
})
export class User {
  @prop({ required: true, unique: true, lowercase: true, trim: true })
  email: string;

  @prop() // null for social login users
  passwordHash?: string;

  @prop({ required: true, unique: true, trim: true, minlength: 2, maxlength: 20 })
  nickname: string;

  @prop({ enum: UserRole, default: UserRole.USER })
  role: UserRole;

  @prop({ enum: AuthProvider, default: AuthProvider.LOCAL })
  provider: AuthProvider;

  @prop() // social provider user ID
  providerId?: string;

  @prop({ default: 0, min: 0 })
  tokenBalance: number;

  @prop()
  profileImage?: string;

  @prop()
  bio?: string;

  @prop() // refresh token hash
  refreshTokenHash?: string;

  @prop({ default: false })
  isAuthor: boolean;

  @prop() // 작가 등록 시 정보
  authorProfile?: {
    penName: string;
    genres: string[];
    introduction: string;
    bankAccount?: {
      bankName: string;
      accountNumber: string; // 암호화 저장
      holderName: string;
    };
    tier: 'ROOKIE' | 'REGULAR' | 'PRO' | 'BEST' | 'HONOR';
    totalSettlement: number;
  };

  @prop({ default: true })
  isActive: boolean;
}
```

### 2. works (작품)

```typescript
export enum WorkStatus {
  DRAFT = 'DRAFT',
  ONGOING = 'ONGOING',
  COMPLETED = 'COMPLETED',
  HIATUS = 'HIATUS',
  DELETED = 'DELETED',
}

export enum Genre {
  ROMANCE = 'ROMANCE',
  FANTASY = 'FANTASY',
  MARTIAL_ARTS = 'MARTIAL_ARTS',
  MODERN = 'MODERN',
  MYSTERY = 'MYSTERY',
  SF = 'SF',
}

@modelOptions({
  schemaOptions: { timestamps: true, collection: 'works' },
})
export class Work {
  @prop({ required: true, ref: () => User })
  authorId: Ref<User>;

  @prop({ required: true, trim: true, maxlength: 100 })
  title: string;

  @prop({ required: true, maxlength: 2000 })
  synopsis: string;

  @prop()
  coverImageUrl?: string;

  @prop({ required: true, enum: Genre })
  genre: Genre;

  @prop({ type: () => [String], default: [] })
  subGenres: string[];

  @prop({ type: () => [String], default: [] })
  tags: string[]; // #계약연애 #재벌 등

  @prop({ enum: WorkStatus, default: WorkStatus.DRAFT })
  status: WorkStatus;

  @prop({ default: false })
  isAiGenerated: boolean;

  @prop({ default: 'HUMAN' })
  contentType: 'HUMAN' | 'AI' | 'HYBRID';

  @prop({ default: 0, min: 0 })
  totalEpisodes: number;

  @prop({ default: 5, min: 0 })
  freeEpisodeCount: number; // 무료 공개 회차 수

  @prop({ default: 2, min: 0 })
  pricePerEpisode: number; // 유료 회차당 토큰

  // 통계 (비정규화 - 성능 최적화)
  @prop({ default: 0 })
  viewCount: number;

  @prop({ default: 0 })
  likeCount: number;

  @prop({ default: 0 })
  bookmarkCount: number;

  @prop({ default: 0 })
  commentCount: number;

  @prop({ default: 0 })
  rating: number; // 평균 평점 (0-5)

  @prop({ default: 0 })
  ratingCount: number;

  @prop() // 연재 주기
  schedule?: {
    daysOfWeek: number[]; // 0=일, 1=월, ...
    time: string; // "18:00"
  };
}
```

### 3. episodes (회차)

```typescript
@modelOptions({
  schemaOptions: { timestamps: true, collection: 'episodes' },
})
export class Episode {
  @prop({ required: true, ref: () => Work })
  workId: Ref<Work>;

  @prop({ required: true, min: 1 })
  number: number; // 회차 번호

  @prop({ required: true, trim: true, maxlength: 200 })
  title: string;

  @prop({ required: true })
  content: string; // 본문 (HTML 또는 Markdown)

  @prop()
  contentUrl?: string; // S3 URL (대용량 콘텐츠)

  @prop({ default: 0, min: 0 })
  wordCount: number;

  @prop({ default: 0, min: 0 })
  price: number; // 0 = 무료

  @prop({ default: false })
  isFree: boolean;

  @prop({ default: false })
  isPublished: boolean;

  @prop()
  publishedAt?: Date;

  @prop()
  scheduledAt?: Date; // 예약 발행

  @prop({ default: 0 })
  viewCount: number;

  @prop({ default: 0 })
  likeCount: number;

  @prop({ default: 0 })
  commentCount: number;

  @prop() // AI 생성 메타데이터
  aiMetadata?: {
    model: string;
    promptTokens: number;
    completionTokens: number;
    generationTime: number; // ms
    jobId: string;
  };

  @prop()
  authorNote?: string; // 작가의 말
}
```

### 4. purchases (구매 내역)

```typescript
@modelOptions({
  schemaOptions: { timestamps: true, collection: 'purchases' },
})
export class Purchase {
  @prop({ required: true, ref: () => User })
  userId: Ref<User>;

  @prop({ required: true, ref: () => Episode })
  episodeId: Ref<Episode>;

  @prop({ required: true, ref: () => Work })
  workId: Ref<Work>;

  @prop({ required: true, min: 0 })
  tokenUsed: number;

  @prop({ required: true, enum: ['PURCHASE', 'RENT', 'SUBSCRIPTION'] })
  type: string;

  @prop() // 대여 시 만료 시간
  expiresAt?: Date;
}
```

### 5. token_transactions (토큰 거래)

```typescript
export enum TransactionType {
  CHARGE = 'CHARGE',       // 충전 (결제)
  PURCHASE = 'PURCHASE',   // 사용 (에피소드 구매)
  BONUS = 'BONUS',         // 보너스 지급
  REFUND = 'REFUND',       // 환불
  SETTLEMENT = 'SETTLEMENT', // 작가 정산
  EXPIRED = 'EXPIRED',     // 만료
}

@modelOptions({
  schemaOptions: { timestamps: true, collection: 'token_transactions' },
})
export class TokenTransaction {
  @prop({ required: true, ref: () => User })
  userId: Ref<User>;

  @prop({ required: true })
  amount: number; // + 충전, - 사용

  @prop({ required: true, enum: TransactionType })
  type: TransactionType;

  @prop({ required: true })
  balanceAfter: number; // 거래 후 잔액 (감사 추적)

  @prop()
  description?: string;

  @prop() // 결제 연동 정보
  paymentInfo?: {
    pgProvider: string; // 'TOSS'
    paymentKey: string;
    orderId: string;
    amount: number; // 원화 금액
    method: string; // 'CARD', 'TRANSFER'
  };

  @prop() // 관련 에피소드 (구매 시)
  relatedEpisodeId?: Ref<Episode>;

  @prop({ required: true })
  idempotencyKey: string; // 중복 방지 키
}
```

### 6. bookmarks (서재/북마크)

```typescript
@modelOptions({
  schemaOptions: { timestamps: true, collection: 'bookmarks' },
})
export class Bookmark {
  @prop({ required: true, ref: () => User })
  userId: Ref<User>;

  @prop({ required: true, ref: () => Work })
  workId: Ref<Work>;

  @prop({ ref: () => Episode })
  lastReadEpisodeId?: Ref<Episode>;

  @prop({ default: 0 })
  lastReadEpisodeNumber: number;

  @prop({ default: 0 })
  readProgress: number; // 0-100 퍼센트

  @prop()
  lastReadAt?: Date;

  @prop({ default: false })
  isBookmarked: boolean; // 찜 여부

  @prop({ default: true })
  notifyNewEpisode: boolean; // 새 회차 알림
}
```

### 7. comments (댓글)

```typescript
@modelOptions({
  schemaOptions: { timestamps: true, collection: 'comments' },
})
export class Comment {
  @prop({ required: true, ref: () => User })
  userId: Ref<User>;

  @prop({ required: true, ref: () => Episode })
  episodeId: Ref<Episode>;

  @prop({ required: true, ref: () => Work })
  workId: Ref<Work>;

  @prop({ required: true, maxlength: 1000 })
  content: string;

  @prop({ ref: () => Comment }) // 대댓글
  parentId?: Ref<Comment>;

  @prop({ default: 0 })
  likeCount: number;

  @prop({ default: false })
  isDeleted: boolean;

  @prop({ default: false })
  isBlocked: boolean; // 관리자 차단
}
```

### 8. likes

```typescript
@modelOptions({
  schemaOptions: { timestamps: true, collection: 'likes' },
})
export class Like {
  @prop({ required: true, ref: () => User })
  userId: Ref<User>;

  @prop({ required: true })
  targetType: 'WORK' | 'EPISODE' | 'COMMENT';

  @prop({ required: true })
  targetId: Types.ObjectId;
}
```

### 9. ai_jobs (AI 생성 작업)

```typescript
export enum AIJobStatus {
  PENDING = 'PENDING',
  PROCESSING = 'PROCESSING',
  COMPLETED = 'COMPLETED',
  FAILED = 'FAILED',
  CANCELLED = 'CANCELLED',
}

@modelOptions({
  schemaOptions: { timestamps: true, collection: 'ai_jobs' },
})
export class AIJob {
  @prop({ required: true, ref: () => User })
  requestedBy: Ref<User>;

  @prop({ ref: () => Work })
  workId?: Ref<Work>;

  @prop({ required: true })
  jobType: 'NOVEL_GENERATE' | 'NOVEL_CONTINUE' | 'COVER_GENERATE' | 'SYNOPSIS_GENERATE';

  @prop({ enum: AIJobStatus, default: AIJobStatus.PENDING })
  status: AIJobStatus;

  @prop({ type: () => Object }) // 생성 요청 파라미터
  params: {
    genre?: string;
    style?: string;
    prompt?: string;
    previousContext?: string;
    maxTokens?: number;
    model?: string;
  };

  @prop() // 생성 결과
  result?: {
    content: string;
    model: string;
    promptTokens: number;
    completionTokens: number;
    cost: number; // USD
  };

  @prop()
  error?: string;

  @prop()
  startedAt?: Date;

  @prop()
  completedAt?: Date;

  @prop({ default: 0 })
  retryCount: number;

  @prop({ default: 3 })
  maxRetries: number;
}
```

### 10. notifications (알림)

```typescript
@modelOptions({
  schemaOptions: { timestamps: true, collection: 'notifications' },
})
export class Notification {
  @prop({ required: true, ref: () => User })
  userId: Ref<User>;

  @prop({ required: true })
  type: 'NEW_EPISODE' | 'COMMENT_REPLY' | 'LIKE' | 'SYSTEM' | 'PAYMENT' | 'SETTLEMENT';

  @prop({ required: true })
  title: string;

  @prop({ required: true })
  message: string;

  @prop()
  linkUrl?: string;

  @prop({ default: false })
  isRead: boolean;

  @prop()
  metadata?: Record<string, any>;
}
```

---

## 🔗 참조 관계 요약

| 컬렉션 | 참조 대상 | 관계 | 설명 |
|---------|----------|------|------|
| works | users | N:1 | 작가 |
| episodes | works | N:1 | 소속 작품 |
| purchases | users, episodes, works | N:1 | 구매자, 구매 회차 |
| token_transactions | users | N:1 | 거래 주체 |
| bookmarks | users, works | N:1 | 독자 서재 |
| comments | users, episodes, comments | N:1 | 작성자, 대댓글 |
| likes | users | N:1 | 좋아요 주체 |
| ai_jobs | users, works | N:1 | 요청자, 대상 작품 |
| notifications | users | N:1 | 수신자 |

---

*다음 문서: [indexes.md](./indexes.md) - 인덱스 전략*
