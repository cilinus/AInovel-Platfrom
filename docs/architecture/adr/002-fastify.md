# ADR-002: NestJS HTTP 어댑터로 Fastify 선택

- **상태**: 승인됨
- **일자**: 2025-01-15
- **의사결정자**: 기술 리드

## 컨텍스트

NestJS는 HTTP 어댑터 패턴을 통해 Express와 Fastify 두 가지 HTTP 엔진을 지원한다. 기본값은 Express이며, 대부분의 NestJS 튜토리얼과 예제가 Express 기반이다.

AI 소설 플랫폼의 API 서버는 다음과 같은 워크로드를 처리한다.

| 엔드포인트 유형 | 예시 | 특성 |
|----------------|------|------|
| 목록 조회 | `GET /works`, `GET /episodes` | 높은 빈도, JSON 응답 크기 중간 |
| 상세 조회 | `GET /works/:id` | 높은 빈도, 캐시 가능 |
| AI 생성 요청 | `POST /ai/generate` | 낮은 빈도, 장시간 처리 |
| 인증/토큰 | `POST /auth/login` | 중간 빈도, 빠른 응답 필요 |
| JSON 응답 크기 | 작품 목록 20건 | 평균 ~15KB |

특히 작품 목록/상세 조회 API는 JSON 직렬화 비용이 성능의 핵심 병목이다.

### 검토한 선택지

| 선택지 | 설명 |
|--------|------|
| **A. Express (기본)** | NestJS 기본 어댑터, 생태계 최대 |
| **B. Fastify** | 고성능 HTTP 프레임워크, 스키마 기반 직렬화 |

## 결정

**선택지 B: Fastify를 NestJS HTTP 어댑터로 사용한다.**

## 근거

### 1. 벤치마크 성능 비교

NestJS 공식 문서와 독립 벤치마크에서 Fastify는 Express 대비 **2~3배 높은 처리량**을 보인다.

```
NestJS + Express vs NestJS + Fastify (JSON 응답, 동일 환경)
───────────────────────────────────────────────────────────
                       req/sec     latency(avg)    latency(p99)
Express (기본)          8,200       12.1ms          45ms
Fastify                21,500        4.6ms          15ms
───────────────────────────────────────────────────────────
개선율                   +162%       -62%            -67%
```

> 참고: 실제 성능은 미들웨어, DB 쿼리, 비즈니스 로직에 따라 다르다. 순수 프레임워크 오버헤드 차이이며, DB 바운드 작업에서는 차이가 줄어든다.

### 2. fast-json-stringify

Fastify의 핵심 성능 이점은 **fast-json-stringify**에 있다. JSON Schema를 기반으로 컴파일 타임에 최적화된 직렬화 함수를 생성한다.

```typescript
// NestJS + Fastify에서 JSON Schema 응답 직렬화
// apps/backend/src/modules/works/works.controller.ts
import { Controller, Get, Query } from '@nestjs/common';

@Controller('works')
export class WorksController {
  @Get()
  @ApiResponse({
    status: 200,
    schema: {
      type: 'object',
      properties: {
        items: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              _id: { type: 'string' },
              title: { type: 'string' },
              genre: { type: 'string' },
              coverImageUrl: { type: 'string' },
              stats: {
                type: 'object',
                properties: {
                  viewCount: { type: 'number' },
                  likeCount: { type: 'number' },
                  avgRating: { type: 'number' },
                },
              },
            },
          },
        },
        total: { type: 'number' },
        page: { type: 'number' },
      },
    },
  })
  async findAll(@Query() query: ListWorksDto) {
    return this.worksService.findAll(query);
  }
}
```

작품 목록 API는 1회 응답에 20건의 작품 데이터(~15KB JSON)를 반환한다. `fast-json-stringify`는 `JSON.stringify` 대비 **2~5배 빠른 직렬화**를 제공하여, 높은 빈도의 목록 조회에서 유의미한 성능 차이를 만든다.

```
JSON 직렬화 벤치마크 (15KB 응답 기준)
─────────────────────────────────────
JSON.stringify()           : 2,100 ops/ms
fast-json-stringify()      : 8,400 ops/ms  (+300%)
─────────────────────────────────────
```

### 3. 요청 유효성 검사 (Ajv)

Fastify는 내장된 Ajv(JSON Schema validator)로 요청 본문을 검증한다. NestJS의 `class-validator`와 병행하거나, 성능이 중요한 엔드포인트에서는 Fastify 네이티브 유효성 검사를 사용할 수 있다.

```typescript
// Fastify 네이티브 유효성 검사 활용 (선택적)
// 대부분의 엔드포인트에서는 NestJS ValidationPipe + class-validator 유지
// 성능 최적화가 필요한 경우에만 Fastify schema 직접 활용

@Controller('episodes')
export class EpisodesController {
  // NestJS 표준 방식 (class-validator) - 대부분의 엔드포인트
  @Post()
  async create(@Body() dto: CreateEpisodeDto) {
    return this.episodesService.create(dto);
  }
}
```

### 4. 부트스트랩 설정

```typescript
// apps/backend/src/main.ts
import { NestFactory } from '@nestjs/core';
import {
  FastifyAdapter,
  NestFastifyApplication,
} from '@nestjs/platform-fastify';
import { ValidationPipe } from '@nestjs/common';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create<NestFastifyApplication>(
    AppModule,
    new FastifyAdapter({
      logger: process.env.NODE_ENV === 'development',
      trustProxy: true,
      bodyLimit: 1_048_576,     // 1MB
    }),
  );

  // 글로벌 설정
  app.setGlobalPrefix('api/v1');
  app.enableCors({
    origin: process.env.ALLOWED_ORIGINS?.split(',') ?? ['http://localhost:3000'],
    credentials: true,
  });
  app.useGlobalPipes(new ValidationPipe({
    whitelist: true,
    forbidNonWhitelisted: true,
    transform: true,
  }));

  // Swagger
  if (process.env.NODE_ENV !== 'production') {
    const { DocumentBuilder, SwaggerModule } = await import('@nestjs/swagger');
    const config = new DocumentBuilder()
      .setTitle('AINovel API')
      .setVersion('1.0')
      .addBearerAuth()
      .build();
    const document = SwaggerModule.createDocument(app, config);
    SwaggerModule.setup('api/docs', app, document);
  }

  await app.listen(process.env.PORT ?? 4000, '0.0.0.0');
}
bootstrap();
```

### 5. Express에서 Fastify로 마이그레이션 시 주의사항

| 영역 | Express | Fastify | 비고 |
|------|---------|---------|------|
| Request 객체 | `req: Request` | `req: FastifyRequest` | NestJS 추상화로 대부분 투명 |
| Response 객체 | `res: Response` | `res: FastifyReply` | `@Res()` 사용 시 주의 |
| 미들웨어 | Express 미들웨어 | Fastify 플러그인 | `helmet`, `cors` 교체 필요 |
| 파일 업로드 | `multer` | `@fastify/multipart` | 별도 설치 필요 |
| 쿠키 | `cookie-parser` | `@fastify/cookie` | 별도 설치 필요 |
| 정적 파일 | `serve-static` | `@fastify/static` | 거의 사용하지 않음 (CDN) |

```typescript
// 미들웨어 등록 (Fastify 플러그인 방식)
// apps/backend/src/app.module.ts
import { Module, NestModule, MiddlewareConsumer } from '@nestjs/common';

@Module({ /* ... */ })
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    // NestJS 미들웨어는 Express/Fastify 모두 동작
    consumer
      .apply(LoggerMiddleware)
      .forRoutes('*');
  }
}
```

```typescript
// 파일 업로드 설정 (커버 이미지)
// apps/backend/src/main.ts (부트스트랩에 추가)
import multipart from '@fastify/multipart';

// FastifyAdapter 인스턴스에서 직접 등록
const fastifyInstance = app.getHttpAdapter().getInstance();
await fastifyInstance.register(multipart, {
  limits: {
    fileSize: 5 * 1024 * 1024,  // 5MB
    files: 1,
  },
});
```

### 6. NestJS 호환성

NestJS의 핵심 기능(DI, Guards, Interceptors, Pipes, Filters)은 HTTP 어댑터와 **무관하게 동작**한다. Fastify로 전환해도 비즈니스 로직 코드는 변경할 필요가 없다.

```typescript
// 이 코드는 Express/Fastify 어댑터와 무관하게 동일하게 동작
@UseGuards(JwtAuthGuard)
@UseInterceptors(CacheInterceptor)
@Controller('works')
export class WorksController {
  @Get(':id')
  @CacheTTL(60)
  async findOne(@Param('id') id: string, @CurrentUser() user: UserPayload) {
    return this.worksService.findOne(id);
  }
}
```

유일하게 주의할 점은 `@Req()`, `@Res()` 데코레이터로 **네이티브 HTTP 객체에 직접 접근하는 코드**이다. 이 패턴은 최소화하고, NestJS 추상화 계층을 통해 접근하는 것을 원칙으로 한다.

## 결과

### 긍정적 결과

- **처리량 향상**: 동일 ECS Fargate 사양(0.5 vCPU/1GB)에서 2~3배 높은 req/sec 처리
- **JSON 직렬화 최적화**: 작품 목록 등 빈번한 JSON 응답의 직렬화 비용 절감
- **비용 효율**: 같은 트래픽을 더 적은 컴퓨팅 리소스로 처리 가능
- **NestJS 호환성**: 비즈니스 로직 코드 변경 없이 어댑터만 교체

### 부정적 결과 (인지된 트레이드오프)

- **생태계 크기**: Express 미들웨어/플러그인 생태계가 더 넓음. 일부 서드파티 미들웨어는 Fastify용 대체제를 찾아야 함
- **학습 곡선**: Express 경험 개발자에게 Fastify 플러그인 시스템이 생소할 수 있음
- **디버깅**: 일부 NestJS 커뮤니티 해결책이 Express 기준으로 작성되어 있음. Fastify 관련 이슈 해결 시 공식 문서 참조 필요
- **파일 업로드**: `multer` 대신 `@fastify/multipart`를 별도 설정해야 함

### 의존성 목록

```json
{
  "dependencies": {
    "@nestjs/platform-fastify": "^11.0.0",
    "@fastify/multipart": "^9.0.0",
    "@fastify/cookie": "^11.0.0",
    "@fastify/helmet": "^13.0.0",
    "@fastify/cors": "^10.0.0"
  }
}
```

> NestJS가 `enableCors()` 등의 추상화를 제공하므로, `@fastify/cors`는 NestJS가 내부적으로 처리한다. 직접 설치가 필요한 것은 `@fastify/multipart`와 `@fastify/cookie` 정도이다.

## 참고

- [NestJS Performance (Fastify)](https://docs.nestjs.com/techniques/performance)
- [Fastify Benchmarks](https://fastify.dev/benchmarks/)
- [fast-json-stringify](https://github.com/fastify/fast-json-stringify)
- [NestJS + Fastify 마이그레이션 가이드](https://docs.nestjs.com/techniques/performance#adapter)
