# Redis 캐시 전략

## 📋 개요

Redis 7+ 사용. 캐시, 세션, Rate Limiting, BullMQ 큐 등 다목적 활용.

---

## 🏗️ Redis 아키텍처

```
┌─────────────────────────────────────────────────┐
│                   Redis 7+                       │
├─────────┬──────────┬──────────┬─────────────────┤
│  DB 0   │  DB 1    │  DB 2    │  DB 3           │
│  Cache  │  Session │  Queue   │  Rate Limit     │
│         │          │ (BullMQ) │                  │
└─────────┴──────────┴──────────┴─────────────────┘
```

---

## 🔑 캐시 키 설계

### 네이밍 컨벤션

```
{service}:{entity}:{id}:{sub}
```

| 패턴 | 예시 | TTL | 설명 |
|------|------|-----|------|
| `work:{id}` | `work:65a1b2c3` | 5분 | 작품 상세 |
| `work:{id}:episodes` | `work:65a1b2c3:episodes` | 3분 | 작품 회차 목록 |
| `works:list:{hash}` | `works:list:abc123` | 2분 | 작품 목록 (필터 해시) |
| `episode:{id}` | `episode:65d4e5f6` | 10분 | 회차 상세 |
| `user:{id}:profile` | `user:65g7h8i9:profile` | 5분 | 사용자 프로필 |
| `user:{id}:balance` | `user:65g7h8i9:balance` | 30초 | 토큰 잔액 |
| `user:{id}:library` | `user:65g7h8i9:library` | 2분 | 서재 목록 |
| `user:{id}:purchased:{episodeId}` | - | 1시간 | 구매 여부 캐시 |
| `ranking:{type}:{period}` | `ranking:views:daily` | 10분 | 랭킹 |
| `home:featured` | - | 5분 | 홈 추천 작품 |
| `genre:{genre}:popular` | `genre:ROMANCE:popular` | 5분 | 장르별 인기 |

### 세션 키

| 패턴 | TTL | 설명 |
|------|-----|------|
| `session:{userId}` | 7일 | Refresh Token 세션 |
| `session:{userId}:devices` | 7일 | 접속 디바이스 목록 |

### Rate Limit 키

| 패턴 | TTL | 설명 |
|------|-----|------|
| `rl:{ip}:{endpoint}` | 1분 | IP 기반 요청 제한 |
| `rl:{userId}:{endpoint}` | 1분 | 유저 기반 요청 제한 |
| `rl:ai:{userId}` | 1시간 | AI 생성 요청 제한 |

---

## 🔄 캐시 패턴

### 1. Cache-Aside (기본 패턴)

```typescript
// packages/backend/src/common/cache.service.ts
import { Injectable } from '@nestjs/common';
import { Redis } from 'ioredis';

@Injectable()
export class CacheService {
  constructor(private readonly redis: Redis) {}

  async getOrSet<T>(
    key: string,
    ttlSeconds: number,
    fetcher: () => Promise<T>,
  ): Promise<T> {
    const cached = await this.redis.get(key);
    if (cached) return JSON.parse(cached);

    const data = await fetcher();
    await this.redis.setex(key, ttlSeconds, JSON.stringify(data));
    return data;
  }

  async invalidate(pattern: string): Promise<void> {
    const keys = await this.redis.keys(pattern);
    if (keys.length > 0) {
      await this.redis.del(...keys);
    }
  }
}
```

### 2. 사용 예시: 작품 상세

```typescript
// works.service.ts
async findOne(id: string): Promise<Work> {
  return this.cache.getOrSet(
    `work:${id}`,
    300, // 5분
    () => this.workModel.findById(id).lean(),
  );
}
```

### 3. 사용 예시: 작품 목록

```typescript
async findAll(query: WorkListQueryDto): Promise<PaginatedResult<Work>> {
  const cacheKey = `works:list:${this.hashQuery(query)}`;
  return this.cache.getOrSet(
    cacheKey,
    120, // 2분
    () => this.fetchWorkList(query),
  );
}

private hashQuery(query: WorkListQueryDto): string {
  return createHash('md5')
    .update(JSON.stringify(query))
    .digest('hex')
    .slice(0, 12);
}
```

---

## 🗑️ 캐시 무효화

### 이벤트 기반 무효화

| 이벤트 | 무효화 대상 | 설명 |
|--------|-----------|------|
| 작품 수정/삭제 | `work:{id}`, `works:list:*` | 작품 캐시 갱신 |
| 회차 발행 | `work:{id}:episodes`, `episode:*`, `home:*` | 새 회차 반영 |
| 토큰 충전/사용 | `user:{id}:balance` | 잔액 갱신 |
| 에피소드 구매 | `user:{id}:purchased:*`, `user:{id}:library` | 구매 상태 |
| 좋아요/북마크 | `work:{id}` (카운터) | 통계 갱신 |
| 댓글 작성 | `episode:{id}` (댓글 수) | 카운터 갱신 |

### 무효화 코드

```typescript
// works.service.ts
async update(id: string, dto: UpdateWorkDto): Promise<Work> {
  const work = await this.workModel.findByIdAndUpdate(id, dto, { new: true });

  // 관련 캐시 무효화
  await Promise.all([
    this.cache.invalidate(`work:${id}`),
    this.cache.invalidate(`work:${id}:*`),
    this.cache.invalidate(`works:list:*`),
    this.cache.invalidate(`genre:${work.genre}:*`),
    this.cache.invalidate(`home:*`),
  ]);

  return work;
}
```

---

## 📊 랭킹 캐시 (Sorted Set)

```typescript
// ranking.service.ts

// 조회수 랭킹 업데이트 (실시간)
async incrementViewCount(workId: string): Promise<void> {
  const today = format(new Date(), 'yyyy-MM-dd');
  await this.redis.zincrby(`ranking:views:daily:${today}`, 1, workId);
  await this.redis.zincrby(`ranking:views:weekly`, 1, workId);
  await this.redis.expire(`ranking:views:daily:${today}`, 86400 * 2); // 2일
}

// 일간 TOP 20 조회
async getDailyRanking(limit = 20): Promise<{ workId: string; score: number }[]> {
  const today = format(new Date(), 'yyyy-MM-dd');
  const results = await this.redis.zrevrange(
    `ranking:views:daily:${today}`,
    0, limit - 1,
    'WITHSCORES',
  );

  const ranking = [];
  for (let i = 0; i < results.length; i += 2) {
    ranking.push({ workId: results[i], score: parseInt(results[i + 1]) });
  }
  return ranking;
}

// 주간 랭킹 리셋 (월요일 0시 크론)
async resetWeeklyRanking(): Promise<void> {
  await this.redis.del('ranking:views:weekly');
}
```

---

## 🚦 Rate Limiting

```typescript
// rate-limit.guard.ts
@Injectable()
export class RateLimitGuard implements CanActivate {
  constructor(private readonly redis: Redis) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const key = `rl:${request.ip}:${request.url}`;
    const limit = 100; // 분당 100회
    const window = 60; // 60초

    const current = await this.redis.incr(key);
    if (current === 1) {
      await this.redis.expire(key, window);
    }

    if (current > limit) {
      throw new HttpException('Too Many Requests', 429);
    }

    return true;
  }
}

// AI 생성 요청 Rate Limit (시간당 10회)
const AI_RATE_LIMIT = {
  key: (userId: string) => `rl:ai:${userId}`,
  limit: 10,
  window: 3600,
};
```

---

## 🔧 Redis 설정

### 로컬 개발 (docker-compose.yml)

```yaml
redis:
  image: redis:7-alpine
  ports:
    - "6379:6379"
  command: redis-server --maxmemory 256mb --maxmemory-policy allkeys-lru
  volumes:
    - redis-data:/data
```

### 프로덕션 (AWS ElastiCache / Upstash)

| 설정 | MVP | 성장기 |
|------|-----|--------|
| 서비스 | Upstash Redis | ElastiCache |
| 메모리 | 256MB | 1-4GB |
| 정책 | allkeys-lru | volatile-lru |
| 비용 | $0-10/월 | $50-200/월 |

---

## 📈 모니터링

```typescript
// Redis 상태 모니터링
async getRedisInfo(): Promise<{
  usedMemory: string;
  hitRate: number;
  connectedClients: number;
}> {
  const info = await this.redis.info();
  const stats = parseRedisInfo(info);

  const hits = parseInt(stats.keyspace_hits);
  const misses = parseInt(stats.keyspace_misses);
  const hitRate = hits / (hits + misses) * 100;

  return {
    usedMemory: stats.used_memory_human,
    hitRate: Math.round(hitRate * 100) / 100,
    connectedClients: parseInt(stats.connected_clients),
  };
}
```

목표 Hit Rate: **> 85%** (85% 미만 시 TTL 조정 또는 캐시 키 재설계)

---

*관련 문서: [schema.md](./schema.md) - MongoDB 스키마, [indexes.md](./indexes.md) - 인덱스 전략*
