# 시스템 아키텍처 개요

## 1. 전체 시스템 구성도

```
┌─────────────────────────────────────────────────────────────────────┐
│                          CloudFront (CDN)                           │
│                    정적 자산 + S3 이미지 캐시                         │
└──────────────────────────────┬──────────────────────────────────────┘
                               │ HTTPS
┌──────────────────────────────▼──────────────────────────────────────┐
│                        ALB (Application Load Balancer)               │
│                    Path-based Routing + Health Check                 │
└───────┬──────────────────────┬──────────────────────────────────────┘
        │ /*                   │ /api/*
        │                      │
┌───────▼───────┐      ┌──────▼────────┐       ┌─────────────────┐
│   Web (Next.js)│      │  API (NestJS)  │       │  AI Service     │
│   Port: 3000   │◄────►│  Port: 4000    │──────►│  (FastAPI)      │
│   ECS Fargate  │ REST │  ECS Fargate   │ HTTP  │  Port: 8000     │
│   0.25 vCPU    │      │  0.5 vCPU      │       │  ECS Fargate    │
│   512MB        │      │  1GB           │       │  0.5 vCPU/1GB   │
└───────┬───────┘      └──────┬────────┘       └────────┬────────┘
        │                      │                         │
        │               ┌──────▼────────┐                │
        │               │    Redis 7     │                │
        │               │ (ElastiCache)  │                │
        │               │  캐시/세션/큐   │                │
        │               └──────┬────────┘                │
        │                      │                         │
        │               ┌──────▼────────┐                │
        └──────────────►│  MongoDB 8     │◄───────────────┘
                        │ (DocumentDB/   │
                        │  Atlas)        │
                        └──────┬────────┘
                               │
                        ┌──────▼────────┐
                        │  S3 / MinIO    │
                        │  이미지/커버    │
                        │  AI 생성물     │
                        └───────────────┘
```

## 2. 서비스 통신 패턴

### 2.1 동기 통신 (Request-Response)

| 구간 | 프로토콜 | 용도 | 타임아웃 |
|------|----------|------|----------|
| Browser → Web | HTTPS | SSR 페이지, 정적 자산 | 30s |
| Web → API | REST/HTTP | 서버 컴포넌트 데이터 패칭 | 10s |
| Browser → API | REST/HTTP | 클라이언트 API 호출 | 10s |
| API → AI Service | HTTP/JSON | AI 생성 요청 | 120s |
| API → MongoDB | MongoDB Wire | CRUD 쿼리 | 5s |
| API → Redis | RESP | 캐시 조회/저장 | 1s |

### 2.2 비동기 통신 (Job Queue)

```
┌──────────┐    BullMQ     ┌──────────────┐     HTTP      ┌────────────┐
│ API      │──── enqueue──►│ Redis Queue  │◄── polling ──│ API Worker │
│ (NestJS) │               │ (BullMQ)     │               │ (NestJS)   │
└──────────┘               └──────────────┘               └─────┬──────┘
                                                                │
                                                          ┌─────▼──────┐
                                                          │ AI Service │
                                                          │ (FastAPI)  │
                                                          └────────────┘
```

AI 소설 생성처럼 오래 걸리는 작업은 BullMQ를 통해 비동기 처리한다.

```typescript
// apps/backend/src/modules/ai/ai-generation.producer.ts
import { InjectQueue } from '@nestjs/bullmq';
import { Queue } from 'bullmq';

@Injectable()
export class AiGenerationProducer {
  constructor(
    @InjectQueue('ai-generation') private readonly queue: Queue,
  ) {}

  async requestNovelGeneration(dto: GenerateNovelDto): Promise<string> {
    const job = await this.queue.add('generate-novel', {
      workId: dto.workId,
      episodeNumber: dto.episodeNumber,
      genre: dto.genre,
      context: dto.previousContext,
      parameters: dto.parameters,
    }, {
      attempts: 3,
      backoff: { type: 'exponential', delay: 5000 },
      removeOnComplete: 100,
      removeOnFail: 50,
    });
    return job.id;
  }
}
```

```typescript
// apps/backend/src/modules/ai/ai-generation.consumer.ts
import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Job } from 'bullmq';

@Processor('ai-generation')
export class AiGenerationConsumer extends WorkerHost {
  constructor(
    private readonly aiClient: AiServiceClient,
    private readonly episodeService: EpisodeService,
  ) { super(); }

  async process(job: Job<GenerateNovelPayload>): Promise<void> {
    await job.updateProgress(10);

    // 1. AI Service 호출
    const result = await this.aiClient.generateNovel({
      genre: job.data.genre,
      context: job.data.context,
      parameters: job.data.parameters,
    });
    await job.updateProgress(70);

    // 2. 품질 검수
    const validated = await this.validateContent(result.content);
    await job.updateProgress(90);

    // 3. MongoDB 저장
    await this.episodeService.createFromAi({
      workId: job.data.workId,
      episodeNumber: job.data.episodeNumber,
      content: validated.content,
      metadata: result.metadata,
    });
    await job.updateProgress(100);
  }
}
```

## 3. 데이터 흐름

### 3.1 사용자 소설 열람 흐름

```
Browser                Web (Next.js)           API (NestJS)          MongoDB        Redis
  │                        │                       │                    │              │
  │── GET /works/123 ─────►│                       │                    │              │
  │                        │── GET /api/works/123 ─►│                    │              │
  │                        │                       │── cache.get() ────►│              │
  │                        │                       │◄── cache hit ──────│              │
  │                        │                       │   (또는 miss)       │              │
  │                        │                       │── find({_id}) ────►│              │
  │                        │                       │◄── document ───────│              │
  │                        │                       │── cache.set() ─────────────────►│
  │                        │◄── JSON response ─────│                    │              │
  │◄── SSR HTML ───────────│                       │                    │              │
```

### 3.2 AI 소설 생성 흐름

```
관리자/시스템         API (NestJS)          Redis/BullMQ       AI Service       MongoDB    S3
  │                     │                      │               (FastAPI)          │         │
  │── 생성 요청 ────────►│                      │                  │               │         │
  │                     │── enqueue job ───────►│                  │               │         │
  │◄── jobId 반환 ──────│                      │                  │               │         │
  │                     │                      │                  │               │         │
  │                     │  [Worker picks up]    │                  │               │         │
  │                     │◄─── dequeue ─────────│                  │               │         │
  │                     │── POST /generate ────────────────────►│               │         │
  │                     │                      │          LLM 호출 + 생성        │         │
  │                     │◄── 생성 결과 ─────────────────────────│               │         │
  │                     │── insertOne() ───────────────────────────────────────►│         │
  │                     │── putObject() ──────────────────────────────────────────────►│
  │                     │── progress 100% ────►│                  │               │         │
  │  [SSE/폴링으로 확인]  │                      │                  │               │         │
```

### 3.3 결제/토큰 소모 흐름 (Multi-Document Transaction)

```typescript
// apps/backend/src/modules/payment/payment.service.ts
async purchaseEpisode(userId: string, episodeId: string): Promise<PurchaseResult> {
  const session = await this.connection.startSession();

  try {
    const result = await session.withTransaction(async () => {
      // 1. 에피소드 가격 조회
      const episode = await this.episodeModel
        .findById(episodeId)
        .session(session);
      if (!episode) throw new NotFoundException('에피소드를 찾을 수 없습니다');

      // 2. 중복 구매 확인
      const existing = await this.purchaseModel
        .findOne({ userId, episodeId })
        .session(session);
      if (existing) throw new ConflictException('이미 구매한 에피소드입니다');

      // 3. 토큰 차감 (atomic)
      const user = await this.userModel.findOneAndUpdate(
        { _id: userId, tokenBalance: { $gte: episode.price } },
        { $inc: { tokenBalance: -episode.price } },
        { new: true, session },
      );
      if (!user) throw new BadRequestException('토큰이 부족합니다');

      // 4. 구매 기록 생성
      const purchase = await this.purchaseModel.create([{
        userId, episodeId,
        workId: episode.workId,
        tokenUsed: episode.price,
        type: 'OWN',
      }], { session });

      // 5. 토큰 거래 내역
      await this.tokenTransactionModel.create([{
        userId,
        amount: -episode.price,
        type: 'USE',
        description: `에피소드 구매: ${episode.title}`,
        referenceId: purchase[0]._id,
      }], { session });

      return { purchaseId: purchase[0]._id, remainingTokens: user.tokenBalance };
    });

    return result;
  } finally {
    await session.endSession();
  }
}
```

## 4. 모노레포 구조

```
ainovel-platform/                    # Turborepo + pnpm workspace root
├── apps/
│   ├── web/                         # Next.js 16 (프론트엔드)
│   │   ├── src/
│   │   │   ├── app/                 # App Router (페이지)
│   │   │   ├── components/          # UI 컴포넌트
│   │   │   ├── hooks/               # 커스텀 훅
│   │   │   ├── lib/                 # 유틸리티
│   │   │   └── styles/              # Tailwind 설정
│   │   ├── next.config.ts
│   │   └── package.json             # @ainovel/web
│   │
│   └── backend/                     # NestJS + Fastify (API 서버)
│       ├── src/
│       │   ├── modules/
│       │   │   ├── auth/            # 인증/인가
│       │   │   ├── users/           # 사용자
│       │   │   ├── works/           # 작품
│       │   │   ├── episodes/        # 회차
│       │   │   ├── payments/        # 결제/토큰
│       │   │   └── ai/             # AI 연동 + BullMQ
│       │   ├── common/              # 가드, 필터, 인터셉터
│       │   └── main.ts              # Fastify 어댑터 부트스트랩
│       └── package.json             # @ainovel/backend
│
├── packages/
│   └── shared/                      # 공유 TypeScript 패키지
│       ├── src/
│       │   ├── types/               # 공통 타입 (Work, Episode, User)
│       │   ├── constants/           # 장르, 상태값 상수
│       │   ├── validators/          # Zod 스키마 (프론트+백 공유)
│       │   └── utils/               # 공통 유틸 (날짜, 포맷)
│       └── package.json             # @ainovel/shared
│
├── services/
│   └── ai-service/                  # FastAPI (Python, 별도 관리)
│       ├── app/
│       │   ├── main.py              # FastAPI 앱
│       │   ├── routers/             # API 라우터
│       │   ├── services/            # LLM 호출 로직
│       │   ├── prompts/             # 장르별 프롬프트 템플릿
│       │   └── models/              # Pydantic 모델
│       ├── pyproject.toml
│       └── Dockerfile
│
├── infra/
│   ├── docker/
│   │   └── docker-compose.yml       # 로컬 개발 환경
│   └── terraform/                   # AWS IaC (선택)
│
├── turbo.json                       # Turborepo 태스크 설정
├── pnpm-workspace.yaml              # pnpm 워크스페이스
└── package.json                     # 루트 스크립트
```

### 4.1 패키지 의존성 그래프

```
@ainovel/web ─────────► @ainovel/shared
                              ▲
@ainovel/backend ─────────────┘

ai-service (Python) ── 독립, HTTP 통신으로 연동
```

`@ainovel/shared`는 프론트엔드와 백엔드가 공유하는 타입, 상수, 유효성 검사 스키마를 포함한다.

```typescript
// packages/shared/src/validators/work.schema.ts
import { z } from 'zod';
import { GENRES, WORK_STATUS } from '../constants';

export const createWorkSchema = z.object({
  title: z.string().min(1).max(100),
  synopsis: z.string().max(2000),
  genre: z.enum(GENRES),
  tags: z.array(z.string()).max(10),
  isAiGenerated: z.boolean().default(true),
});

export type CreateWorkDto = z.infer<typeof createWorkSchema>;
```

## 5. API 서버 부트스트랩 (Fastify 어댑터)

```typescript
// apps/backend/src/main.ts
import { NestFactory } from '@nestjs/core';
import { FastifyAdapter, NestFastifyApplication } from '@nestjs/platform-fastify';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create<NestFastifyApplication>(
    AppModule,
    new FastifyAdapter({
      logger: process.env.NODE_ENV !== 'production',
      trustProxy: true,           // ALB 뒤에서 동작
      bodyLimit: 1048576,          // 1MB
    }),
  );

  app.setGlobalPrefix('api/v1');
  app.enableCors({
    origin: process.env.ALLOWED_ORIGINS?.split(','),
    credentials: true,
  });

  await app.listen(4000, '0.0.0.0');
}
bootstrap();
```

## 6. 환경별 설정 요약

| 항목 | 개발 (Local) | 스테이징 | 프로덕션 |
|------|-------------|----------|----------|
| MongoDB | Docker (27017) | DocumentDB/Atlas | DocumentDB/Atlas |
| Redis | Docker (6379) | ElastiCache (t4g.micro) | ElastiCache (t4g.small) |
| S3 | MinIO (9000) | S3 Bucket | S3 + CloudFront |
| Web | next dev (3000) | ECS Fargate | ECS Fargate |
| API | nest start --watch (4000) | ECS Fargate | ECS Fargate |
| AI | uvicorn --reload (8000) | ECS Fargate | ECS Fargate |
