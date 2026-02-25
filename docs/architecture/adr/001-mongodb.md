# ADR-001: MongoDB를 단일 데이터베이스로 선택

- **상태**: 승인됨
- **일자**: 2025-01-15
- **의사결정자**: 기술 리드

## 컨텍스트

AI 소설 플랫폼은 다양한 형태의 데이터를 다뤄야 한다.

- **소설 콘텐츠**: 장르, 태그, 캐릭터 설정 등 스키마가 장르별로 크게 다름
- **에피소드**: 텍스트 본문 + AI 생성 메타데이터 (프롬프트, 모델 정보, 토큰 사용량)
- **사용자 활동**: 읽기 기록, 북마크, 취향 프로필 (배열/중첩 구조)
- **AI 생성 로그**: 비정형 JSON (모델별 응답 형식이 다름)
- **결제/토큰**: 정합성이 중요한 트랜잭션 데이터

초기 기획에서는 PostgreSQL(메인) + MongoDB(AI 로그) 조합을 고려했으나, MVP 단계에서 두 가지 DB를 운영하는 것의 복잡성과 비용 부담이 문제로 제기되었다.

### 검토한 선택지

| 선택지 | 설명 |
|--------|------|
| **A. PostgreSQL 단일** | RDBMS로 모든 데이터 관리, JSONB로 비정형 처리 |
| **B. PostgreSQL + MongoDB** | 정형 데이터는 PG, 비정형은 MongoDB |
| **C. MongoDB 단일** | 모든 데이터를 MongoDB로 관리 |

## 결정

**선택지 C: MongoDB를 단일 데이터베이스로 사용한다.**

결제/토큰 등 정합성이 필요한 영역은 MongoDB의 Multi-Document Transaction을 활용한다.

## 근거

### 1. 콘텐츠 플랫폼의 도메인 특성

소설 플랫폼의 핵심 데이터는 본질적으로 **Document 지향적**이다.

```javascript
// 소설 작품 - 장르별로 메타데이터 구조가 다름
{
  _id: ObjectId("..."),
  title: "별이 빛나는 밤에",
  genre: "ROMANCE",
  tags: ["현대물", "오피스", "연상연하"],
  synopsis: "...",
  coverImageUrl: "https://...",
  stats: {
    viewCount: 15230,
    likeCount: 892,
    avgRating: 4.3,
    episodeCount: 45
  },
  aiConfig: {                        // AI 생성 설정 (장르별 구조 상이)
    model: "gpt-4o",
    temperature: 0.8,
    genrePromptId: "romance-office-v2",
    characterProfiles: [
      { name: "이서연", role: "주인공", traits: ["당찬", "워커홀릭"] },
      { name: "강민혁", role: "상대역", traits: ["차가운", "재벌3세"] }
    ],
    worldBuilding: {
      era: "현대",
      location: "서울 강남",
      company: "한성그룹"
    }
  },
  status: "ONGOING",
  createdAt: ISODate("2025-01-10"),
  updatedAt: ISODate("2025-01-15")
}
```

PostgreSQL의 JSONB로도 가능하지만, 전체 데이터 구조가 이미 Document 모델에 가까운 상황에서 RDBMS를 선택하면 오히려 **ORM 매핑 복잡도**와 **JOIN 비용**이 증가한다.

### 2. 스키마 유연성

MVP 단계에서 스키마는 빈번하게 변경될 것으로 예상된다.

```javascript
// 에피소드 - 콘텐츠 유형 확장 가능
{
  _id: ObjectId("..."),
  workId: ObjectId("..."),
  episodeNumber: 12,
  title: "제12화: 예상치 못한 만남",
  content: "...",                    // 본문 텍스트
  price: 2,                         // 토큰 가격
  isFree: false,
  publishedAt: ISODate("..."),

  // AI 생성 메타데이터 (스키마 유동적)
  aiGeneration: {
    jobId: "job_abc123",
    model: "gpt-4o",
    promptTokens: 2100,
    completionTokens: 3500,
    totalCost: 0.045,
    generatedAt: ISODate("..."),
    qualityScore: 0.87,
    retryCount: 0,
    previousContext: ["ep10_summary", "ep11_summary"]
  }
}
```

MongoDB에서는 `aiGeneration` 필드의 하위 구조가 변경되어도 마이그레이션 없이 새 필드를 추가할 수 있다. PostgreSQL에서는 ALTER TABLE 또는 JSONB 컬럼으로 관리해야 하며, 타입 안전성을 위해 Prisma 스키마를 수동 동기화해야 한다.

### 3. Atlas Search로 전문 검색 통합

별도의 Elasticsearch 없이 MongoDB Atlas Search로 전문 검색을 처리할 수 있다.

```javascript
// Atlas Search 인덱스 정의
{
  "mappings": {
    "dynamic": false,
    "fields": {
      "title": { "type": "string", "analyzer": "lucene.korean" },
      "synopsis": { "type": "string", "analyzer": "lucene.korean" },
      "tags": { "type": "string", "analyzer": "lucene.keyword" },
      "genre": { "type": "stringFacet" },
      "stats.avgRating": { "type": "number" }
    }
  }
}
```

```javascript
// 검색 쿼리 예시
db.works.aggregate([
  {
    $search: {
      index: "works_search",
      compound: {
        must: [
          { text: { query: "판타지 회귀", path: ["title", "synopsis"] } }
        ],
        filter: [
          { equals: { path: "status", value: "ONGOING" } }
        ]
      }
    }
  },
  { $limit: 20 },
  { $project: { title: 1, genre: 1, coverImageUrl: 1, "stats.avgRating": 1 } }
]);
```

이로써 MVP 인프라에서 **검색 엔진을 별도로 운영하지 않아도** 되어 비용과 복잡도를 크게 줄인다.

### 4. 트랜잭션 처리 (결제 영역)

MongoDB 4.0+ Multi-Document Transaction으로 결제 정합성을 보장한다.

```typescript
// Mongoose 트랜잭션 패턴
const session = await mongoose.startSession();
try {
  await session.withTransaction(async () => {
    // 토큰 차감 (원자적 업데이트)
    const user = await User.findOneAndUpdate(
      { _id: userId, tokenBalance: { $gte: price } },
      { $inc: { tokenBalance: -price } },
      { new: true, session }
    );
    if (!user) throw new Error('잔액 부족');

    // 구매 기록 + 거래 내역 생성
    await Purchase.create([{ userId, episodeId, tokenUsed: price }], { session });
    await TokenTransaction.create([{
      userId, amount: -price, type: 'USE'
    }], { session });
  });
} finally {
  await session.endSession();
}
```

**제약**: MongoDB 트랜잭션은 ReplicaSet 환경에서만 동작한다. 로컬 개발 시 Docker Compose에서 단일 노드 ReplicaSet을 구성하고, 프로덕션에서는 Atlas/DocumentDB가 기본으로 ReplicaSet을 제공한다.

### 5. 비용 (MVP $50-$150/월 목표)

| 구성 | DB 비용 | 검색 엔진 | 합계 |
|------|---------|-----------|------|
| PG + ES | RDS t4g.micro ($15) | OpenSearch t3.small ($25) | ~$40 |
| PG + MongoDB | RDS ($15) + Atlas M0 ($0) | - | ~$15 |
| **MongoDB 단일** | **Atlas M10 ($57)** | **Atlas Search (포함)** | **~$57** |
| **MongoDB 최소** | **Atlas M0 ($0)** | **Atlas Search (포함)** | **$0** |

MongoDB 단일 구성은 검색 엔진을 별도 운영하지 않으므로 **운영 복잡도가 가장 낮다**.

## 결과

### 긍정적 결과

- **스키마 유연성**: MVP 단계에서 빈번한 스키마 변경을 마이그레이션 없이 처리
- **검색 통합**: Atlas Search로 별도 검색 엔진 불필요, 인프라 단순화
- **개발 속도**: NestJS + Mongoose(또는 Prisma MongoDB) 조합으로 빠른 개발
- **비용 최적화**: 단일 DB로 운영 비용 및 관리 부담 최소화
- **문서 모델 적합성**: 소설/에피소드 데이터가 본질적으로 Document 지향적

### 부정적 결과 (인지된 트레이드오프)

- **트랜잭션 제약**: Multi-Document Transaction은 RDBMS 대비 성능 오버헤드가 있음. 결제 처리량이 급증하면 별도 결제 DB 분리를 검토해야 함
- **JOIN 부재**: 복잡한 관계형 쿼리(예: 다단계 집계)는 Aggregation Pipeline으로 처리해야 하며, 가독성이 떨어질 수 있음
- **ORM 성숙도**: Prisma의 MongoDB 지원은 PostgreSQL 대비 기능이 적음. Mongoose를 주 ODM으로 사용
- **Atlas 의존**: Atlas Search는 Atlas에서만 사용 가능. DocumentDB 전환 시 검색 기능을 별도 구축해야 함

### 마이그레이션 전략

성장 단계에서 다음 상황 발생 시 **결제 전용 PostgreSQL 분리**를 검토한다.

- 결제 TPS > 100/sec
- 복잡한 정산/집계 쿼리 빈번
- 감사 로그에 대한 규제 요구사항

```
[현재] MongoDB ──── 모든 데이터
         │
[미래]   ├── MongoDB ──── 콘텐츠, 사용자, AI 로그
         └── PostgreSQL ── 결제, 정산, 감사 로그 (필요시)
```

## 참고

- [MongoDB Multi-Document Transactions](https://www.mongodb.com/docs/manual/core/transactions/)
- [Atlas Search 한국어 분석기](https://www.mongodb.com/docs/atlas/atlas-search/analyzers/language/)
- [NestJS + Mongoose 통합](https://docs.nestjs.com/techniques/mongodb)
