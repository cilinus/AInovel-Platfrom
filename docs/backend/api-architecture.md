# API 아키텍처 설계서

## 1. 개요

NestJS 11 + Fastify 어댑터 기반의 모듈러 아키텍처.
모든 모듈은 단일 책임 원칙에 따라 분리되며, 의존성 주입(DI)을 통해 결합.

---

## 2. 모듈 의존성 다이어그램

```
                          ┌──────────────┐
                          │   AppModule  │
                          └──────┬───────┘
            ┌─────────┬─────────┼─────────┬──────────┬──────────┐
            v         v         v         v          v          v
      ┌─────────┐ ┌────────┐ ┌───────┐ ┌────────┐ ┌──────┐ ┌────────┐
      │AuthModule│ │Users   │ │Works  │ │Payment │ │AI    │ │Admin   │
      │         │ │Module  │ │Module │ │Module  │ │Module│ │Module  │
      └────┬────┘ └───┬────┘ └───┬───┘ └───┬────┘ └──┬───┘ └───┬────┘
           │          │          │          │         │         │
           v          v          v          v         v         v
      ┌──────────────────────────────────────────────────────────────┐
      │                      SharedModule                            │
      │  (DatabaseModule, CacheModule, QueueModule, ConfigModule)    │
      └──────────────────────────────────────────────────────────────┘
           │              │              │              │
           v              v              v              v
      ┌─────────┐  ┌──────────┐  ┌──────────┐  ┌────────────┐
      │MongoDB 8│  │ Redis 7  │  │ BullMQ   │  │ ConfigSvc  │
      │Mongoose │  │  Cache   │  │  Queues  │  │ (.env)     │
      └─────────┘  └──────────┘  └──────────┘  └────────────┘
```

---

## 3. 애플리케이션 부트스트랩 (main.ts)

```typescript
// src/main.ts
import { NestFactory } from '@nestjs/core';
import {
  FastifyAdapter,
  NestFastifyApplication,
} from '@nestjs/platform-fastify';
import { AppModule } from './app.module';
import { ValidationPipe, VersioningType } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import fastifyCookie from '@fastify/cookie';
import fastifyHelmet from '@fastify/helmet';
import { HttpExceptionFilter } from './common/filters/http-exception.filter';
import { MongoExceptionFilter } from './common/filters/mongo-exception.filter';
import { LoggingInterceptor } from './common/interceptors/logging.interceptor';
import { TransformInterceptor } from './common/interceptors/transform.interceptor';
import { ConfigService } from '@nestjs/config';

async function bootstrap() {
  const app = await NestFactory.create<NestFastifyApplication>(
    AppModule,
    new FastifyAdapter({ logger: true }),
  );

  const config = app.get(ConfigService);

  // Fastify 플러그인
  await app.register(fastifyCookie, {
    secret: config.get<string>('COOKIE_SECRET'),
  });
  await app.register(fastifyHelmet);

  // API 버전 관리
  app.enableVersioning({
    type: VersioningType.URI,
    defaultVersion: '1',
    prefix: 'api/v',
  });

  // CORS 설정
  app.enableCors({
    origin: config.get<string>('CORS_ORIGIN')?.split(',') ?? [],
    credentials: true,
  });

  // 글로벌 파이프
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
      transformOptions: { enableImplicitConversion: true },
    }),
  );

  // 글로벌 필터 (순서: 뒤에서부터 적용)
  app.useGlobalFilters(
    new MongoExceptionFilter(),
    new HttpExceptionFilter(),
  );

  // 글로벌 인터셉터
  app.useGlobalInterceptors(
    new LoggingInterceptor(),
    new TransformInterceptor(),
  );

  // Swagger 설정
  const swaggerConfig = new DocumentBuilder()
    .setTitle('AI 소설 플랫폼 API')
    .setDescription('AI 소설 플랫폼 백엔드 REST API')
    .setVersion('1.0')
    .addBearerAuth()
    .addCookieAuth('refreshToken')
    .build();
  const document = SwaggerModule.createDocument(app, swaggerConfig);
  SwaggerModule.setup('docs', app, document);

  const port = config.get<number>('PORT') ?? 4000;
  await app.listen(port, '0.0.0.0');
}
bootstrap();
```

---

## 4. Guard 계층 구조

요청 처리 순서: `ThrottlerGuard → JwtAuthGuard → RolesGuard`

```typescript
// Guard 적용 순서 (실행 순서는 등록 역순)
@UseGuards(JwtAuthGuard, RolesGuard)
@Throttle({ default: { limit: 60, ttl: 60000 } })
```

| Guard | 역할 | 적용 범위 |
|-------|------|-----------|
| `ThrottlerGuard` | IP 기반 요청 제한 | 글로벌 (AppModule) |
| `JwtAuthGuard` | JWT 토큰 검증, `@Public()` 데코레이터로 제외 | 글로벌 |
| `RolesGuard` | `@Roles('ADMIN')` 데코레이터 기반 역할 확인 | 엔드포인트별 |

```typescript
// src/common/guards/jwt-auth.guard.ts
@Injectable()
export class JwtAuthGuard extends AuthGuard('jwt') {
  constructor(private reflector: Reflector) { super(); }

  canActivate(context: ExecutionContext) {
    const isPublic = this.reflector.getAllAndOverride<boolean>(
      IS_PUBLIC_KEY,
      [context.getHandler(), context.getClass()],
    );
    if (isPublic) return true;
    return super.canActivate(context);
  }
}

// src/common/guards/roles.guard.ts
@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const requiredRoles = this.reflector.getAllAndOverride<Role[]>(
      ROLES_KEY,
      [context.getHandler(), context.getClass()],
    );
    if (!requiredRoles) return true;
    const { user } = context.switchToHttp().getRequest();
    return requiredRoles.some((role) => user.roles?.includes(role));
  }
}
```

---

## 5. 인터셉터

```typescript
// src/common/interceptors/transform.interceptor.ts
@Injectable()
export class TransformInterceptor<T> implements NestInterceptor<T, ApiResponse<T>> {
  intercept(context: ExecutionContext, next: CallHandler): Observable<ApiResponse<T>> {
    return next.handle().pipe(
      map((data) => ({
        success: true,
        data,
        timestamp: new Date().toISOString(),
      })),
    );
  }
}

// src/common/interceptors/logging.interceptor.ts
@Injectable()
export class LoggingInterceptor implements NestInterceptor {
  private readonly logger = new Logger('HTTP');

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const req = context.switchToHttp().getRequest();
    const { method, url } = req;
    const now = Date.now();

    return next.handle().pipe(
      tap(() => this.logger.log(`${method} ${url} ${Date.now() - now}ms`)),
    );
  }
}
```

---

## 6. 예외 필터

```typescript
// src/common/filters/http-exception.filter.ts
@Catch(HttpException)
export class HttpExceptionFilter implements ExceptionFilter {
  catch(exception: HttpException, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const reply = ctx.getResponse<FastifyReply>();
    const status = exception.getStatus();
    const response = exception.getResponse();

    reply.status(status).send({
      success: false,
      statusCode: status,
      message: typeof response === 'string' ? response : (response as any).message,
      timestamp: new Date().toISOString(),
    });
  }
}

// src/common/filters/mongo-exception.filter.ts
@Catch(MongoServerError)
export class MongoExceptionFilter implements ExceptionFilter {
  catch(exception: MongoServerError, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const reply = ctx.getResponse<FastifyReply>();

    if (exception.code === 11000) {
      reply.status(409).send({
        success: false,
        statusCode: 409,
        message: '이미 존재하는 데이터입니다.',
        timestamp: new Date().toISOString(),
      });
      return;
    }
    reply.status(500).send({
      success: false,
      statusCode: 500,
      message: '데이터베이스 오류가 발생했습니다.',
      timestamp: new Date().toISOString(),
    });
  }
}
```

---

## 7. 모듈 목록 및 책임

| 모듈 | 경로 | 책임 |
|------|------|------|
| `AppModule` | `src/app.module.ts` | 루트 모듈, 글로벌 가드/필터 등록 |
| `SharedModule` | `src/shared/` | DB, Redis, BullMQ, Config 공용 모듈 |
| `AuthModule` | `src/modules/auth/` | 회원가입, 로그인, JWT, 소셜 로그인 |
| `UsersModule` | `src/modules/users/` | 사용자 프로필, 내 라이브러리 |
| `WorksModule` | `src/modules/works/` | 작품 CRUD, 검색, 필터링 |
| `EpisodesModule` | `src/modules/episodes/` | 회차 CRUD, 발행, 열람권 |
| `PaymentModule` | `src/modules/payment/` | 토큰 충전, 구매, 정산, 토스페이먼츠 |
| `AIModule` | `src/modules/ai/` | AI 생성 요청, BullMQ 작업 관리 |
| `AdminModule` | `src/modules/admin/` | 관리자 통계, 콘텐츠 승인/반려 |
| `NotificationModule` | `src/modules/notification/` | 알림 전송 (BullMQ 비동기) |

---

## 8. AppModule 등록

```typescript
// src/app.module.ts
@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    ThrottlerModule.forRoot([{ ttl: 60000, limit: 60 }]),
    SharedModule,
    AuthModule,
    UsersModule,
    WorksModule,
    EpisodesModule,
    PaymentModule,
    AIModule,
    AdminModule,
    NotificationModule,
  ],
  providers: [
    { provide: APP_GUARD, useClass: ThrottlerGuard },
    { provide: APP_GUARD, useClass: JwtAuthGuard },
    { provide: APP_GUARD, useClass: RolesGuard },
  ],
})
export class AppModule {}
```

---

## 9. SharedModule 구성

```typescript
// src/shared/shared.module.ts
@Global()
@Module({
  imports: [
    MongooseModule.forRootAsync({
      useFactory: (config: ConfigService) => ({
        uri: config.get<string>('MONGODB_URI'),
        // Mongoose 8+ 기본 옵션 사용
      }),
      inject: [ConfigService],
    }),
    CacheModule.registerAsync({
      useFactory: (config: ConfigService) => ({
        store: redisStore,
        host: config.get('REDIS_HOST'),
        port: config.get('REDIS_PORT'),
        ttl: 300, // 5분 기본 TTL
      }),
      inject: [ConfigService],
    }),
    BullModule.forRootAsync({
      useFactory: (config: ConfigService) => ({
        connection: {
          host: config.get('REDIS_HOST'),
          port: config.get('REDIS_PORT'),
        },
      }),
      inject: [ConfigService],
    }),
  ],
  exports: [MongooseModule, CacheModule, BullModule],
})
export class SharedModule {}
```

---

## 10. 디렉토리 구조

```
src/
├── main.ts
├── app.module.ts
├── common/
│   ├── decorators/        # @Public(), @Roles(), @CurrentUser()
│   ├── filters/           # HttpExceptionFilter, MongoExceptionFilter
│   ├── guards/            # JwtAuthGuard, RolesGuard
│   ├── interceptors/      # LoggingInterceptor, TransformInterceptor
│   ├── pipes/             # ParseObjectIdPipe
│   └── interfaces/        # ApiResponse<T>, PaginatedResponse<T>
├── shared/
│   └── shared.module.ts
└── modules/
    ├── auth/
    │   ├── auth.module.ts
    │   ├── auth.controller.ts
    │   ├── auth.service.ts
    │   ├── strategies/     # jwt.strategy.ts, kakao.strategy.ts, ...
    │   └── dto/            # login.dto.ts, register.dto.ts
    ├── users/
    ├── works/
    ├── episodes/
    ├── payment/
    ├── ai/
    ├── admin/
    └── notification/
```
