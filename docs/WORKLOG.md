# 작업일지 (Work Log)

---

## 2026-02-25 (화) — 프로젝트 초기 구조 수립

**작업자**: 김종윤
**작업 시간**: ~4시간
**지원 도구**: Claude Code (Opus 4.6) + 에이전트팀 분석

---

### 1. 완료된 작업

#### Phase A: 모노레포 + 폴더 구조 생성
- [x] 루트에 Turborepo + pnpm workspace 설정 (`package.json`, `pnpm-workspace.yaml`, `turbo.json`, `.npmrc`)
- [x] 기존 기획서 10개 파일을 `docs/planning/`으로 `git mv` 이동
- [x] `docs/`, `packages/`, `services/`, `infra/` 전체 디렉토리 구조 생성

#### Phase B: 기술 설계서 작성 (21개 문서)

| 영역 | 파일 | 주요 내용 |
|------|------|-----------|
| **architecture/** | `system-overview.md` | 3개 서비스 구성도, REST/BullMQ 통신, 데이터 흐름 3종 |
| | `infrastructure.md` | AWS VPC/ECS 구조, Docker Compose, CI/CD, 비용 시뮬레이션 ($50~150/월) |
| | `adr/001-mongodb.md` | MongoDB 단독 사용 결정 근거, 트랜잭션 패턴, 마이그레이션 전략 |
| | `adr/002-fastify.md` | Fastify vs Express 벤치마크 (21,500 vs 8,200 req/s), 마이그레이션 가이드 |
| | `adr/003-monorepo.md` | Turborepo vs Nx 비교, 빌드 캐시 전략, Python 서비스 관리 방안 |
| **frontend/** | `web-architecture.md` | Next.js 16 라우팅, PPR 전략, 미들웨어, 레이아웃 계층 |
| | `pwa-design.md` | @serwist/next, 오프라인 읽기, IndexedDB, 푸시 알림 |
| | `design-system.md` | oklch 컬러 토큰, 타이포 스케일, shadcn/ui 17개 컴포넌트, 커스텀 컴포넌트 |
| | `reader-architecture.md` | 스크롤/페이지 모드, CSS Multi-Column, 제스처, 진행률 3단계 저장 |
| | `state-management.md` | Zustand(전역) + Jotai(리더) + TanStack Query(서버) 역할 분담 |
| **backend/** | `api-architecture.md` | NestJS 모듈 구조, Guard/Interceptor/Filter 체인, 10개 모듈 |
| | `api-endpoints.md` | **68개 REST 엔드포인트** 전체 명세, DTO, 응답 형식 |
| | `authentication.md` | JWT 플로우, Refresh Token Rotation, 소셜 로그인 3사, RBAC |
| | `payment-system.md` | 토큰 경제 (1토큰=100원), 토스페이먼츠, 정산 로직 (작가 80%) |
| | `service-modules.md` | 핵심 서비스 메서드 시그니처, BullMQ 큐 4개, 알림 프로세서 |
| **database/** | `schema.md` | MongoDB 10개 컬렉션 Mongoose 스키마 + Typegoose 코드 |
| | `indexes.md` | 컬렉션별 복합 인덱스, Atlas Search 한국어 설정, 쿼리 패턴 |
| | `cache-strategy.md` | Redis DB 분리 (0~3), 키 설계, TTL, 무효화 전략 |
| **ai/** | `ai-pipeline.md` | FastAPI 생성 파이프라인, 3-tier 폴백, BullMQ 연동 |
| | `prompt-engineering.md` | 장르별 프롬프트 템플릿 (로맨스/판타지/무협/미스터리/SF) |
| | `model-strategy.md` | 모델 비용 계산, Circuit Breaker, A/B 테스트, 안전 필터 |

#### Phase C: 소스코드 초기 설정 (70개 파일)

**packages/shared/** (9 파일)
- TypeScript 타입 정의: User, Work, Episode, Payment
- 상수: Genre enum + 한국어 라벨, ERROR_CODES

**packages/web/** (14 파일)
- Next.js 16 + React 19.2 + Tailwind v4 설정
- `app/layout.tsx` (RootLayout + PWA manifest)
- `lib/api-client.ts` (fetch 래퍼, 토큰 갱신, 에러 처리)
- `lib/utils.ts` (cn, formatNumber, formatDate, formatCurrency)
- `stores/` (Zustand auth/app 스토어, Jotai reader atoms)
- `hooks/` (useWorks 무한스크롤, useAuth 인증)

**packages/backend/** (37 파일)
- NestJS 11 + Fastify 부트스트랩 (`main.ts`)
- `app.module.ts` (MongoDB, Redis, BullMQ, ThrottlerModule 연결)
- **auth 모듈**: JWT 전략, JwtAuthGuard, RolesGuard, 소셜 로그인 서비스
- **users 모듈**: 프로필 CRUD, 토큰 잔액 조회
- **works 모듈**: 작품 CRUD, 텍스트 검색, 페이지네이션
- **episodes 모듈**: 회차 생성/조회, 작가 소유권 검증
- **payments 모듈**: MongoDB 트랜잭션으로 토큰 충전/구매, 거래 내역
- **ai 모듈**: BullMQ 큐 연동, 작업 상태 조회
- **admin 모듈**: 관리자 대시보드 스텁
- **common/**: HttpExceptionFilter, TransformInterceptor, @Public/@Roles/@CurrentUser 데코레이터

**services/ai-service/** (10 파일)
- FastAPI + Anthropic SDK 연동
- `/api/v1/generate` 엔드포인트 (Claude Sonnet 호출)
- `/health` 헬스체크

#### Phase D: 인프라 설정 (6 파일)
- `docker-compose.yml`: MongoDB 8 (ReplicaSet), Redis 7, MinIO + 버킷 초기화
- `Dockerfile.web/api/ai`: 멀티스테이지 빌드, non-root 유저
- GitHub Actions: `ci.yml` (PR: lint + typecheck + test, paths-filter), `deploy.yml` (main 머지: ECR push)

#### Phase E: 문서화
- `README.md`: 프로젝트 개요, Quick Start, 프로젝트 구조, 스크립트 목록
- `CLAUDE.md`: 코딩 컨벤션, 아키텍처 요약, 핵심 파일 경로

---

### 2. 다음에 해야 할 일 (TODO)

#### 우선순위 P0 (즉시)
- [ ] `pnpm install` 실행하여 의존성 설치 확인
- [ ] `docker compose up -d` 로 인프라 기동 확인 (MongoDB ReplicaSet 초기화 포함)
- [ ] 각 패키지 `pnpm dev` 실행하여 기본 부팅 확인
- [ ] `.env.example` → `.env` 복사 후 실제 시크릿 값 설정

#### 우선순위 P1 (이번 주)
- [ ] **ESLint + Prettier 설정** — 루트 `eslint.config.js`, `.prettierrc` 생성
- [ ] **shadcn/ui 초기화** — `packages/web`에서 `npx shadcn@latest init` 실행
- [ ] **로그인/회원가입 페이지 구현** — `app/(auth)/login/page.tsx`, `register/page.tsx`
- [ ] **카카오 소셜 로그인 연동** — Passport 카카오 전략 구현 (네이버/구글은 후순위)
- [ ] **작품 목록 페이지** — `app/works/page.tsx` + WorkCard 컴포넌트
- [ ] **작품 상세 페이지** — `app/works/[id]/page.tsx` + 에피소드 리스트
- [ ] **소설 리더 페이지** — `app/reader/[episodeId]/page.tsx` 스크롤 모드 우선

#### 우선순위 P2 (다음 주)
- [ ] AI 소설 생성 UI (프롬프트 입력 → 생성 대기 → 결과 확인)
- [ ] 토큰 충전 페이지 (토스페이먼츠 SDK 연동)
- [ ] 마이페이지 (내 서재, 구매 내역, 프로필 수정)
- [ ] PWA 설정 (`manifest.json`, Service Worker 등록)
- [ ] E2E 테스트 프레임워크 설정 (Playwright)

#### 우선순위 P3 (Phase 2)
- [ ] 작가 시스템 (작가 신청, 작품 관리 대시보드)
- [ ] 커뮤니티 (댓글, 좋아요, 북마크)
- [ ] 관리자 대시보드 구현
- [ ] 만화 생성 (ComfyUI 연동)
- [ ] 네이티브 앱 (Expo / React Native)

---

### 3. 개발 시 주의사항

#### MongoDB 관련
> **반드시 ReplicaSet 모드로 실행해야 합니다.**

- 결제/토큰 트랜잭션에서 `session.startTransaction()` 사용 → ReplicaSet 필수
- Docker Compose에서 `--replSet rs0` 옵션과 `rs.initiate()` 헬스체크로 자동 구성됨
- **로컬 MongoDB를 ReplicaSet 없이 띄우면 결제 모듈 전체가 동작하지 않음**
- Atlas 사용 시에는 기본 ReplicaSet이므로 문제 없음

#### Fastify 관련
> **Express 미들웨어를 직접 사용하면 안 됩니다.**

- NestJS에서 Fastify 어댑터를 사용하므로 Express 미들웨어(`app.use()`) 호환 안 됨
- 파일 업로드: `multer` 대신 `@fastify/multipart` 사용
- 쿠키: `cookie-parser` 대신 `@fastify/cookie` 사용
- Helmet: `helmet` 대신 `@fastify/helmet` 사용
- `npm` 패키지 설치 시 `@fastify/` 접두사 패키지를 먼저 확인할 것

#### Tailwind v4 관련
> **v3와 설정 방식이 완전히 다릅니다.**

- `tailwind.config.js` 파일 **없음** — CSS 파일 내 `@theme` 디렉티브로 설정
- `@apply` 지시자 사용 자제 → 유틸리티 클래스를 직접 사용
- `globals.css` 참고: `@import "tailwindcss"` + `@theme { ... }`
- 공식 문서: https://tailwindcss.com/docs/v4-beta

#### 인증/보안
- JWT 시크릿은 반드시 `.env`에 설정 (기본값 `your-access-secret-change-in-production` 그대로 사용 금지)
- Refresh Token은 `httpOnly` 쿠키로 전송 (XSS 방어)
- 비밀번호 해싱: `bcrypt` (saltRounds: 12)
- 모든 API는 기본적으로 JWT 인증 필요 → 공개 엔드포인트에만 `@Public()` 데코레이터 사용

#### 모노레포 규칙
- **패키지 매니저는 반드시 pnpm** — npm/yarn 사용 시 workspace 연결이 깨짐
- 공유 타입은 `packages/shared`에 정의 → `@ainovel/shared`로 import
- 새 패키지 의존성 추가: `pnpm add <package> --filter @ainovel/web` (루트에서 직접 설치 X)
- Turborepo 캐시: `.turbo/` 디렉토리가 생기며 `.gitignore`에 추가할 것

---

### 4. 확인이 필요한 사항

#### 기술적 확인
- [ ] **pnpm 9.15.0** 설치 여부 확인 (`corepack enable && corepack prepare pnpm@9.15.0 --activate`)
- [ ] **Node.js 20+** 버전 확인 (`node -v`)
- [ ] **Docker Desktop** 설치 및 실행 상태 확인
- [ ] **Python 3.12+** 설치 확인 (AI 서비스용)
- [ ] `pnpm install` 후 `packages/shared` 빌드가 선행되는지 확인 (turbo build 의존성 그래프)
- [ ] `@ainovel/shared`를 web/backend에서 import 가능한지 확인

#### 비즈니스 확인 (팀 논의 필요)
- [ ] **토큰 이름 결정** — 현재 "토큰"으로 되어있으나 브랜딩 필요
- [ ] **에피소드 기본 가격** — 현재 2토큰(200원) 설정, 적정 가격 논의
- [ ] **무료 에피소드 정책** — 작품당 처음 N화 무료? 또는 일부 무료작?
- [ ] **작가 수익 분배율** — 현재 80% 설정, 업계 표준은 60~70%
- [ ] **카카오 개발자 앱 등록** — https://developers.kakao.com 에서 앱 생성 필요
- [ ] **네이버 개발자 앱 등록** — https://developers.naver.com 에서 앱 생성 필요
- [ ] **토스페이먼츠 가맹점 등록** — https://developers.tosspayments.com 에서 테스트 키 발급

---

### 5. 기술 스택 상세 버전 및 참고 자료

#### 핵심 프레임워크

| 기술 | 버전 | 공식 문서 | 비고 |
|------|------|-----------|------|
| Next.js | 16.x | https://nextjs.org/docs | App Router, PPR, Turbopack |
| React | 19.2 | https://react.dev | `use()` 훅, Server Actions |
| NestJS | 11.x | https://docs.nestjs.com | Fastify 어댑터 |
| Fastify | 5.x | https://fastify.dev/docs | NestJS가 내부 관리 |
| MongoDB | 8.0 | https://www.mongodb.com/docs | Atlas Search 한국어 지원 |
| Mongoose | 8.10 | https://mongoosejs.com/docs | @nestjs/mongoose 11 |
| Redis | 7.x | https://redis.io/docs | 캐시/세션/큐/레이트리밋 |

#### 프론트엔드 라이브러리

| 라이브러리 | 버전 | 공식 문서 | 용도 |
|-----------|------|-----------|------|
| Tailwind CSS | v4 | https://tailwindcss.com/docs/v4-beta | @theme 디렉티브, CSS-first |
| Zustand | 5.x | https://zustand.docs.pmnd.rs | 전역 상태 (인증, 테마) |
| Jotai | 2.x | https://jotai.org/docs | 리더 로컬 상태 |
| TanStack Query | 5.x | https://tanstack.com/query/latest | 서버 상태 관리 |
| shadcn/ui | latest | https://ui.shadcn.com | UI 컴포넌트 (복사 방식) |
| embla-carousel | 8.5 | https://www.embla-carousel.com | 캐러셀 (3KB) |
| framer-motion | 12.x | https://motion.dev | 페이지 전환, 제스처 |
| nuqs | 2.x | https://nuqs.47ng.com | URL 상태 (필터, 검색) |
| vaul | latest | https://vaul.emilkowal.ski | 바텀시트 (모바일) |
| sonner | latest | https://sonner.emilkowal.ski | 토스트 알림 |
| react-hook-form | 7.x | https://react-hook-form.com | 폼 관리 |
| zod | 3.x | https://zod.dev | 스키마 검증 |

#### 백엔드 라이브러리

| 라이브러리 | 버전 | 공식 문서 | 용도 |
|-----------|------|-----------|------|
| BullMQ | 5.x | https://docs.bullmq.io | 비동기 큐 (AI 생성) |
| Passport | 0.7 | https://www.passportjs.org | 인증 전략 |
| passport-kakao | 1.x | https://www.npmjs.com/package/passport-kakao | 카카오 OAuth |
| class-validator | 0.14 | https://github.com/typestack/class-validator | DTO 유효성 검사 |
| bcrypt | 5.x | https://github.com/kelektiv/node.bcrypt.js | 비밀번호 해싱 |
| ioredis | 5.x | https://github.com/redis/ioredis | Redis 클라이언트 |

#### AI 서비스

| 라이브러리 | 버전 | 공식 문서 | 용도 |
|-----------|------|-----------|------|
| FastAPI | 0.115+ | https://fastapi.tiangolo.com | AI API 서버 |
| Anthropic SDK | 0.45+ | https://docs.anthropic.com/en/api | Claude 호출 |
| OpenAI SDK | 1.60+ | https://platform.openai.com/docs | GPT-4o 폴백 |
| Ollama | latest | https://ollama.com | 로컬 모델 (비용 절감) |

#### 인프라 & 외부 서비스

| 서비스 | 용도 | 대시보드/문서 |
|--------|------|--------------|
| 토스페이먼츠 | PG 결제 | https://developers.tosspayments.com |
| 카카오 로그인 | 소셜 인증 | https://developers.kakao.com/docs/latest/ko/kakaologin |
| 네이버 로그인 | 소셜 인증 | https://developers.naver.com/docs/login/overview |
| 구글 로그인 | 소셜 인증 | https://developers.google.com/identity |
| MongoDB Atlas | 관리형 DB | https://www.mongodb.com/cloud/atlas |
| MinIO | 로컬 S3 | https://min.io/docs/minio/container |
| AWS ECR/ECS | 컨테이너 배포 | https://docs.aws.amazon.com/ecs |
| Sentry | 에러 추적 | https://sentry.io (무료 5K 이벤트/월) |
| UptimeRobot | 가동 모니터링 | https://uptimerobot.com (무료 50개 모니터) |

---

### 6. 프로젝트 구조 요약 (신규 팀원용)

```
AInovel-Platform/
├── README.md                    # 프로젝트 개요 + 빠른 시작
├── CLAUDE.md                    # Claude Code 코딩 컨벤션
├── package.json                 # 루트 Turborepo 설정
├── pnpm-workspace.yaml          # 워크스페이스 정의
├── turbo.json                   # 빌드 태스크 파이프라인
│
├── docs/                        # 📋 모든 설계 문서
│   ├── planning/                #   기획서 10개 (기존)
│   ├── architecture/            #   시스템 아키텍처 + ADR 3개
│   ├── frontend/                #   프론트엔드 설계 5개
│   ├── backend/                 #   백엔드 설계 5개
│   ├── database/                #   DB 설계 3개
│   ├── ai/                      #   AI 설계 3개
│   └── WORKLOG.md               #   ★ 이 작업일지
│
├── packages/
│   ├── web/                     # 🌐 Next.js 16 프론트엔드
│   │   ├── app/                 #   App Router 페이지
│   │   ├── components/          #   UI 컴포넌트 (예정)
│   │   ├── hooks/               #   React Query 훅
│   │   ├── stores/              #   Zustand/Jotai 상태
│   │   ├── lib/                 #   유틸리티, API 클라이언트
│   │   └── styles/              #   Tailwind v4 글로벌 CSS
│   │
│   ├── backend/                 # ⚙️ NestJS + Fastify API
│   │   └── src/
│   │       ├── auth/            #   인증 (JWT, 소셜)
│   │       ├── users/           #   사용자 관리
│   │       ├── works/           #   작품 CRUD
│   │       ├── episodes/        #   회차 관리
│   │       ├── payments/        #   결제/토큰
│   │       ├── ai/              #   AI 생성 프록시
│   │       ├── admin/           #   관리자
│   │       └── common/          #   공통 (가드, 필터, 데코레이터, 스키마)
│   │
│   └── shared/                  # 📦 공유 타입/상수
│       └── src/
│           ├── types/           #   User, Work, Episode, Payment
│           └── constants/       #   Genre, ErrorCodes
│
├── services/
│   └── ai-service/              # 🤖 FastAPI AI 서비스 (Python)
│       └── app/
│           ├── routers/         #   /generate 엔드포인트
│           └── generators/      #   소설 생성 로직 (예정)
│
└── infra/
    ├── docker/                  # 🐳 Docker Compose + Dockerfiles
    └── .github/workflows/       # 🔄 CI/CD
```

---

### 7. 에이전트팀 분석에서 도출된 핵심 결정 사항

아래 결정들은 `docs/architecture/adr/` 에 상세 문서화되어 있습니다.

| # | 결정 | 이유 | 주의사항 |
|---|------|------|---------|
| ADR-001 | **MongoDB 단독 사용** (PostgreSQL 미사용) | 소설/에피소드의 유연한 스키마, Atlas Search 한국어 지원, 수평 확장 | 결제 트랜잭션에 반드시 `session` 사용, TPS 1000 이상 시 PG 분리 검토 |
| ADR-002 | **Fastify 어댑터** (Express 대신) | 2.6배 처리량 향상 (21,500 vs 8,200 req/s), JSON 직렬화 4배 빠름 | Express 미들웨어 직접 사용 불가, `@fastify/*` 패키지 사용 |
| ADR-003 | **Turborepo 모노레포** | 빌드 캐시, 타입 공유, 통합 CI | Python AI 서비스는 Turborepo 밖에서 별도 관리 |
| — | **PWA 우선** (네이티브 앱 후순위) | MVP 비용 절감, 빠른 출시, 웹소설 UX에 PWA 충분 | A2HS 배너, 오프라인 읽기 구현 필요 |
| — | **3-tier AI 모델** | Claude(프리미엄) → GPT-4o(스탠다드) → Ollama(로컬) | API 키 비용 모니터링 필수, 일일 예산 한도 설정 |

---

### 8. 알려진 이슈 & 리스크

| # | 이슈 | 심각도 | 대응 방안 |
|---|------|--------|----------|
| 1 | Next.js 16이 아직 최신이라 일부 패키지 호환성 문제 가능 | 중 | React 19.2 호환 여부를 패키지 설치 시마다 확인 |
| 2 | Tailwind v4 생태계가 v3 대비 작음 | 하 | 커스텀 플러그인 대신 CSS 직접 작성으로 대체 가능 |
| 3 | MongoDB Atlas Search 한국어 nori 분석기 설정 필요 | 중 | 로컬에서는 `$text` 인덱스 사용, Atlas 배포 시 Search Index 별도 생성 |
| 4 | Anthropic API 비용이 대량 생성 시 급증 가능 | 상 | `model-strategy.md`의 일일 예산 모니터링 + 로컬 모델 폴백 구현 |
| 5 | 토스페이먼츠 테스트 모드와 실제 모드 전환 시 주의 | 중 | `.env`에서 시크릿 키만 교체, 웹훅 URL도 프로덕션으로 변경 필요 |
| 6 | Docker MongoDB ReplicaSet 초기화 실패 시 트랜잭션 불가 | 상 | `docker compose down -v && docker compose up -d`로 볼륨 초기화 후 재시도 |

---

### 9. 커밋 컨벤션

```
feat: 새로운 기능 추가
fix: 버그 수정
docs: 문서 변경
chore: 빌드, 설정 변경
refactor: 코드 리팩토링 (기능 변경 없음)
test: 테스트 추가/수정
style: 코드 포맷팅 (기능 변경 없음)
```

**예시:**
```
feat(auth): 카카오 소셜 로그인 구현
fix(payments): 중복 구매 방지 로직 수정
docs(architecture): ADR-004 캐시 전략 추가
chore(infra): Docker Compose Redis 버전 업그레이드
```

---

*다음 작업일지는 개발 진행 상황에 따라 업데이트합니다.*
