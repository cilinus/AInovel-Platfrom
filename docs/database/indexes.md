# MongoDB 인덱스 전략

## 📋 개요

MongoDB 인덱스 설계 원칙:
- **ESR 규칙** (Equality → Sort → Range) 순서로 복합 인덱스 구성
- 자주 쿼리되는 패턴 기반 인덱스 생성
- 쓰기 성능과 인덱스 수의 균형 (컬렉션당 최대 10개 목표)

---

## 🗂️ 컬렉션별 인덱스

### users

```javascript
// 로그인 조회
db.users.createIndex({ email: 1 }, { unique: true });

// 닉네임 중복 확인
db.users.createIndex({ nickname: 1 }, { unique: true });

// 소셜 로그인 조회
db.users.createIndex({ provider: 1, providerId: 1 }, { unique: true, sparse: true });

// 작가 목록 조회
db.users.createIndex({ isAuthor: 1, "authorProfile.tier": 1 });
```

### works

```javascript
// 장르별 목록 (최신순) - 메인 목록 쿼리
db.works.createIndex({ genre: 1, status: 1, createdAt: -1 });

// 인기순 목록
db.works.createIndex({ status: 1, viewCount: -1 });
db.works.createIndex({ status: 1, likeCount: -1 });
db.works.createIndex({ status: 1, rating: -1 });

// 작가별 작품 목록
db.works.createIndex({ authorId: 1, createdAt: -1 });

// 태그 검색
db.works.createIndex({ tags: 1, status: 1 });

// AI 생성 작품 필터
db.works.createIndex({ isAiGenerated: 1, status: 1, createdAt: -1 });

// Atlas Search (전문 검색) - 별도 검색 인덱스
// Atlas UI 또는 API로 생성
/*
{
  "mappings": {
    "dynamic": false,
    "fields": {
      "title": { "type": "string", "analyzer": "lucene.korean" },
      "synopsis": { "type": "string", "analyzer": "lucene.korean" },
      "tags": { "type": "string", "analyzer": "lucene.keyword" },
      "genre": { "type": "string", "analyzer": "lucene.keyword" },
      "status": { "type": "string", "analyzer": "lucene.keyword" }
    }
  }
}
*/
```

### episodes

```javascript
// 작품의 회차 목록 (번호순)
db.episodes.createIndex({ workId: 1, number: 1 }, { unique: true });

// 발행된 회차만 조회
db.episodes.createIndex({ workId: 1, isPublished: 1, number: 1 });

// 예약 발행 조회 (BullMQ 스케줄러)
db.episodes.createIndex(
  { scheduledAt: 1 },
  { sparse: true, partialFilterExpression: { isPublished: false, scheduledAt: { $exists: true } } }
);

// 최신 에피소드 (홈 피드)
db.episodes.createIndex({ isPublished: 1, publishedAt: -1 });
```

### purchases

```javascript
// 사용자의 구매 내역
db.purchases.createIndex({ userId: 1, createdAt: -1 });

// 에피소드 구매 확인 (중복 방지)
db.purchases.createIndex({ userId: 1, episodeId: 1 }, { unique: true });

// 작품별 구매 통계
db.purchases.createIndex({ workId: 1, createdAt: -1 });

// 대여 만료 확인
db.purchases.createIndex(
  { expiresAt: 1 },
  { sparse: true, expireAfterSeconds: 0 } // TTL 인덱스
);
```

### token_transactions

```javascript
// 사용자 거래 내역
db.token_transactions.createIndex({ userId: 1, createdAt: -1 });

// 거래 유형별 조회
db.token_transactions.createIndex({ userId: 1, type: 1, createdAt: -1 });

// 멱등성 키 (중복 거래 방지)
db.token_transactions.createIndex({ idempotencyKey: 1 }, { unique: true });

// 정산 대상 조회 (작가 수익)
db.token_transactions.createIndex(
  { type: 1, createdAt: 1 },
  { partialFilterExpression: { type: 'PURCHASE' } }
);

// PG 결제키 조회
db.token_transactions.createIndex(
  { "paymentInfo.paymentKey": 1 },
  { sparse: true }
);
```

### bookmarks

```javascript
// 사용자 서재 (최근 읽은 순)
db.bookmarks.createIndex({ userId: 1, lastReadAt: -1 });

// 찜한 작품
db.bookmarks.createIndex(
  { userId: 1, isBookmarked: 1, updatedAt: -1 },
  { partialFilterExpression: { isBookmarked: true } }
);

// 작품별 북마크 수 집계
db.bookmarks.createIndex({ workId: 1 });

// 중복 방지
db.bookmarks.createIndex({ userId: 1, workId: 1 }, { unique: true });
```

### comments

```javascript
// 에피소드 댓글 목록 (최신순)
db.comments.createIndex({ episodeId: 1, isDeleted: 1, createdAt: -1 });

// 대댓글 조회
db.comments.createIndex({ parentId: 1, createdAt: 1 });

// 사용자 작성 댓글
db.comments.createIndex({ userId: 1, createdAt: -1 });

// 인기 댓글
db.comments.createIndex({ episodeId: 1, likeCount: -1 });
```

### likes

```javascript
// 좋아요 중복 방지
db.likes.createIndex({ userId: 1, targetType: 1, targetId: 1 }, { unique: true });

// 타겟별 좋아요 수 집계
db.likes.createIndex({ targetType: 1, targetId: 1 });
```

### ai_jobs

```javascript
// 사용자의 작업 목록
db.ai_jobs.createIndex({ requestedBy: 1, createdAt: -1 });

// 대기/처리중 작업 조회 (BullMQ)
db.ai_jobs.createIndex({ status: 1, createdAt: 1 });

// 작품별 생성 이력
db.ai_jobs.createIndex({ workId: 1, status: 1 });
```

### notifications

```javascript
// 사용자 알림 (최신순)
db.notifications.createIndex({ userId: 1, createdAt: -1 });

// 읽지 않은 알림
db.notifications.createIndex(
  { userId: 1, isRead: 1, createdAt: -1 },
  { partialFilterExpression: { isRead: false } }
);

// 오래된 알림 자동 삭제 (90일)
db.notifications.createIndex(
  { createdAt: 1 },
  { expireAfterSeconds: 7776000 } // 90 days
);
```

---

## 📊 주요 쿼리 패턴 및 최적화

### 1. 작품 목록 (메인 페이지)

```typescript
// 장르별 + 연재중 + 최신순 + 페이지네이션
const works = await WorkModel.find({
  genre: 'ROMANCE',
  status: 'ONGOING',
})
  .sort({ createdAt: -1 })
  .skip(page * limit)
  .limit(limit)
  .select('title synopsis coverImageUrl genre tags viewCount likeCount rating')
  .lean();

// 인덱스: { genre: 1, status: 1, createdAt: -1 }
// IXSCAN → 커버링 쿼리에 가까움
```

### 2. 에피소드 구매 확인

```typescript
// 사용자가 이미 구매했는지 확인
const purchased = await PurchaseModel.exists({
  userId: userId,
  episodeId: episodeId,
});

// 인덱스: { userId: 1, episodeId: 1 } (unique)
// 단일 도큐먼트 룩업 → O(1)
```

### 3. 토큰 결제 (트랜잭션)

```typescript
// MongoDB 세션 기반 트랜잭션
const session = await mongoose.startSession();
session.startTransaction();

try {
  // 1. 잔액 차감
  const user = await UserModel.findOneAndUpdate(
    { _id: userId, tokenBalance: { $gte: price } },
    { $inc: { tokenBalance: -price } },
    { session, new: true }
  );
  if (!user) throw new Error('INSUFFICIENT_BALANCE');

  // 2. 구매 기록
  await PurchaseModel.create([{ userId, episodeId, workId, tokenUsed: price, type: 'PURCHASE' }], { session });

  // 3. 거래 내역
  await TokenTransactionModel.create([{
    userId, amount: -price, type: 'PURCHASE',
    balanceAfter: user.tokenBalance,
    idempotencyKey: `purchase-${userId}-${episodeId}`,
    relatedEpisodeId: episodeId,
  }], { session });

  await session.commitTransaction();
} catch (error) {
  await session.abortTransaction();
  throw error;
} finally {
  session.endSession();
}
```

### 4. Atlas Search (전문 검색)

```typescript
// 작품 검색 (제목 + 시놉시스 + 태그)
const results = await WorkModel.aggregate([
  {
    $search: {
      index: 'works_search',
      compound: {
        should: [
          { text: { query: searchQuery, path: 'title', score: { boost: { value: 3 } } } },
          { text: { query: searchQuery, path: 'synopsis' } },
          { text: { query: searchQuery, path: 'tags', score: { boost: { value: 2 } } } },
        ],
      },
    },
  },
  { $match: { status: 'ONGOING' } },
  { $limit: 20 },
  { $project: { title: 1, synopsis: 1, coverImageUrl: 1, genre: 1, tags: 1, score: { $meta: 'searchScore' } } },
]);
```

---

## ⚡ 성능 가이드라인

| 원칙 | 설명 |
|------|------|
| **커서 기반 페이지네이션** | skip/limit 대신 `{ _id: { $gt: lastId } }` 사용 (대량 데이터) |
| **Projection** | `.select()` 또는 `$project`로 필요한 필드만 반환 |
| **lean()** | 읽기 전용 쿼리에 `.lean()` 사용 (Mongoose 오버헤드 제거) |
| **Bulk Operations** | 대량 쓰기 시 `bulkWrite()` 사용 |
| **인덱스 모니터링** | `db.collection.getIndexes()`, `explain('executionStats')` 정기 확인 |
| **TTL 인덱스** | 대여 만료, 오래된 알림 자동 삭제 |

---

*다음 문서: [cache-strategy.md](./cache-strategy.md) - Redis 캐시 전략*
