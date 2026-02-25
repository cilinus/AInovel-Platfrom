# ADR-003: Turborepo + pnpm 모노레포 구조 선택

- **상태**: 승인됨
- **일자**: 2025-01-15
- **의사결정자**: 기술 리드

## 컨텍스트

AI 소설 플랫폼은 다음과 같은 패키지로 구성된다.

| 패키지 | 언어 | 설명 |
|--------|------|------|
| `apps/web` | TypeScript | Next.js 16 프론트엔드 |
| `apps/backend` | TypeScript | NestJS + Fastify API 서버 |
| `packages/shared` | TypeScript | 공유 타입, 상수, 유효성 검사 |
| `services/ai-service` | Python | FastAPI AI 생성 서비스 |

TypeScript 패키지 3개가 코드를 공유해야 하며, Python 서비스는 독립적으로 관리된다. 프로젝트 초기부터 타입 공유와 빌드 효율성을 확보할 도구가 필요하다.

### 검토한 선택지

| 선택지 | 설명 |
|--------|------|
| **A. 멀티레포** | 각 서비스를 독립 Git 저장소로 관리 |
| **B. Nx** | 모노레포 도구 (그래프 기반 빌드, 플러그인 생태계) |
| **C. Turborepo + pnpm** | 모노레포 빌드 시스템 + 패키지 매니저 |

## 결정

**선택지 C: Turborepo + pnpm을 모노레포 도구로 사용한다.**

Python AI 서비스는 Turborepo 워크스페이스에 포함하지 않고 `services/` 디렉토리에서 독립 관리한다.

## 근거

### 1. 멀티레포 대비 모노레포의 이점

```
[멀티레포]                              [모노레포]

ainovel-web/       ← npm publish →      ainovel-platform/
ainovel-backend/   ← npm publish →      ├── apps/web/
ainovel-shared/    ← 버전 동기화 수동   ├── apps/backend/
                                        ├── packages/shared/   ← 직접 참조
                                        └── services/ai-service/
```

| 비교 항목 | 멀티레포 | 모노레포 |
|----------|---------|---------|
| 타입 공유 | npm 패키지 발행 필요 | 직접 import |
| 변경 추적 | 레포별 PR | 단일 PR로 전체 변경 |
| CI/CD | 레포별 파이프라인 | 변경 감지 기반 단일 파이프라인 |
| 버전 동기화 | 수동 (깨지기 쉬움) | 자동 (워크스페이스) |
| 코드 리뷰 | 레포 간 컨텍스트 분산 | 전체 변경사항 한눈에 확인 |

MVP 규모(개발자 1~3명)에서 멀티레포는 관리 오버헤드만 증가시킨다.

### 2. Turborepo vs Nx 비교

| 기준 | Turborepo | Nx |
|------|-----------|-----|
| **설정 복잡도** | 최소 (`turbo.json` 하나) | 높음 (`nx.json` + 프로젝트별 설정) |
| **학습 곡선** | 낮음 (기존 npm 스크립트 활용) | 높음 (자체 CLI, 생성기, 플러그인) |
| **빌드 캐싱** | 원격 캐시 기본 지원 | 원격 캐시 지원 (Nx Cloud) |
| **태스크 파이프라인** | `dependsOn` 선언적 | 프로젝트 그래프 기반 |
| **코드 생성기** | 없음 (직접 작성) | 풍부한 generator/plugin |
| **프레임워크 통합** | 없음 (프레임워크 불가지론) | Next.js, NestJS 플러그인 |
| **번들 크기** | ~10MB | ~50MB+ |
| **Vercel 통합** | 네이티브 (같은 회사) | 별도 설정 필요 |

**Turborepo를 선택한 이유**:

1. **단순함**: MVP에서는 코드 생성기보다 **빌드 캐싱과 태스크 오케스트레이션**이 핵심. Turborepo는 이것에만 집중
2. **점진적 도입**: 기존 `package.json` 스크립트를 그대로 유지하고 `turbo.json`만 추가하면 됨
3. **pnpm 네이티브 지원**: pnpm 워크스페이스와 자연스럽게 통합
4. **유지보수 부담**: Nx는 기능이 많은 만큼 버전 업그레이드 시 마이그레이션 비용이 큼

### 3. 워크스페이스 구성

```yaml
# pnpm-workspace.yaml
packages:
  - 'apps/*'
  - 'packages/*'
  # services/ai-service는 Python이므로 제외
```

```json
// turbo.json
{
  "$schema": "https://turbo.build/schema.json",
  "tasks": {
    "build": {
      "dependsOn": ["^build"],
      "outputs": [".next/**", "dist/**"],
      "env": ["NODE_ENV", "MONGODB_URI", "REDIS_HOST"]
    },
    "dev": {
      "cache": false,
      "persistent": true
    },
    "lint": {
      "dependsOn": ["^build"]
    },
    "typecheck": {
      "dependsOn": ["^build"]
    },
    "test": {
      "dependsOn": ["^build"],
      "outputs": ["coverage/**"]
    }
  }
}
```

### 4. 패키지 구조 상세

```
ainovel-platform/
├── apps/
│   ├── web/                          # @ainovel/web
│   │   ├── package.json
│   │   ├── next.config.ts
│   │   ├── tsconfig.json             # extends ../../tsconfig.base.json
│   │   └── src/
│   │
│   └── backend/                      # @ainovel/backend
│       ├── package.json
│       ├── nest-cli.json
│       ├── tsconfig.json
│       └── src/
│
├── packages/
│   └── shared/                       # @ainovel/shared
│       ├── package.json
│       ├── tsconfig.json
│       └── src/
│           ├── types/                # 공통 타입 정의
│           │   ├── work.types.ts
│           │   ├── episode.types.ts
│           │   ├── user.types.ts
│           │   └── index.ts
│           ├── constants/            # 상수 (장르, 상태값)
│           │   ├── genres.ts
│           │   ├── status.ts
│           │   └── index.ts
│           ├── validators/           # Zod 스키마
│           │   ├── work.schema.ts
│           │   ├── episode.schema.ts
│           │   └── index.ts
│           └── utils/                # 유틸리티
│               ├── date.ts
│               ├── format.ts
│               └── index.ts
│
├── services/
│   └── ai-service/                   # Python (Turborepo 외부)
│       ├── pyproject.toml
│       ├── Dockerfile
│       └── app/
│
├── infra/
│   └── docker/
│       └── docker-compose.yml
│
├── turbo.json
├── pnpm-workspace.yaml
├── tsconfig.base.json                # 공통 TS 설정
└── package.json                      # 루트 스크립트
```

### 5. 공유 패키지 사용 예시

```json
// packages/shared/package.json
{
  "name": "@ainovel/shared",
  "version": "0.0.0",
  "private": true,
  "main": "./src/index.ts",
  "types": "./src/index.ts",
  "scripts": {
    "build": "tsc --build",
    "lint": "eslint src/",
    "typecheck": "tsc --noEmit"
  },
  "dependencies": {
    "zod": "^3.23"
  }
}
```

```json
// apps/web/package.json (발췌)
{
  "name": "@ainovel/web",
  "dependencies": {
    "@ainovel/shared": "workspace:*"
  }
}
```

```json
// apps/backend/package.json (발췌)
{
  "name": "@ainovel/backend",
  "dependencies": {
    "@ainovel/shared": "workspace:*"
  }
}
```

```typescript
// 프론트엔드에서 공유 타입/검증 사용
// apps/web/src/app/works/new/page.tsx
import { createWorkSchema, type CreateWorkDto, GENRES } from '@ainovel/shared';

export default function NewWorkPage() {
  const form = useForm<CreateWorkDto>({
    resolver: zodResolver(createWorkSchema),
  });
  // ...
}
```

```typescript
// 백엔드에서 동일한 검증 스키마 사용
// apps/backend/src/modules/works/dto/create-work.dto.ts
import { createWorkSchema, type CreateWorkDto } from '@ainovel/shared';

// NestJS 파이프에서 Zod 스키마 활용
export class CreateWorkValidationPipe implements PipeTransform {
  transform(value: unknown): CreateWorkDto {
    return createWorkSchema.parse(value);
  }
}
```

### 6. 빌드 캐싱 전략

#### 로컬 캐시

Turborepo는 기본적으로 `node_modules/.cache/turbo`에 태스크 출력을 캐싱한다.

```bash
# 첫 빌드: 전체 실행
$ pnpm turbo build
 Tasks:    3 successful, 3 total
 Duration: 45.2s

# 코드 변경 없이 재빌드: 캐시 히트
$ pnpm turbo build
 Tasks:    3 successful, 3 total
 Duration: 0.8s (cache hit)

# shared만 변경 후 재빌드: shared + 의존 패키지만 재빌드
$ pnpm turbo build
 Tasks:    3 successful, 3 total
   - @ainovel/shared: cache miss (변경됨)
   - @ainovel/web: cache miss (의존성 변경)
   - @ainovel/backend: cache miss (의존성 변경)
```

#### 원격 캐시 (CI/CD)

GitHub Actions에서 Turborepo Remote Cache를 활성화하면 CI 빌드 시간을 크게 단축한다.

```yaml
# .github/workflows/ci.yml (발췌)
- name: Build
  run: pnpm turbo build --filter=...[origin/main]
  env:
    TURBO_TOKEN: ${{ secrets.TURBO_TOKEN }}
    TURBO_TEAM: ${{ secrets.TURBO_TEAM }}
```

```
CI 빌드 시간 비교 (캐시 없음 vs 원격 캐시)
──────────────────────────────────────────
                     캐시 없음    원격 캐시
전체 빌드              90s          90s (초회)
shared만 변경          90s          35s
web만 변경             90s          25s
변경 없음              90s           3s
──────────────────────────────────────────
```

### 7. Python AI 서비스 관리

Python 서비스는 pnpm/Turborepo 워크스페이스에 포함하지 않는다.

```bash
# 루트 package.json의 편의 스크립트로 관리
{
  "scripts": {
    "dev:ai": "cd services/ai-service && uvicorn app.main:app --reload --port 8000",
    "test:ai": "cd services/ai-service && pytest tests/ -v",
    "lint:ai": "cd services/ai-service && ruff check ."
  }
}
```

CI에서는 `paths-filter`로 `services/ai-service/**` 변경을 감지하여 별도 파이프라인을 실행한다. Docker 빌드도 독립적으로 수행한다.

```
┌─────────────────────────────────────────────────────┐
│                Turborepo 워크스페이스                  │
│                                                       │
│  @ainovel/web ◄──── @ainovel/shared ────► @ainovel/backend  │
│                                                       │
└───────────────────────────┬───────────────────────────┘
                            │ HTTP (REST)
                ┌───────────▼──────────┐
                │  services/ai-service │  ← 독립 Python 프로젝트
                │  (FastAPI)           │
                └──────────────────────┘
```

## 결과

### 긍정적 결과

- **타입 공유**: `@ainovel/shared`를 통해 프론트/백엔드 간 타입, 상수, 유효성 검사 스키마를 단일 소스로 관리
- **빌드 효율**: Turborepo 캐싱으로 변경되지 않은 패키지는 빌드를 건너뛰어 CI/CD 시간 단축
- **단순한 설정**: `turbo.json` 하나로 태스크 파이프라인 관리. 별도 학습 비용 최소
- **CI 최적화**: `paths-filter`와 Turborepo `--filter`를 결합하여 변경된 서비스만 빌드/배포
- **개발 경험**: `pnpm dev`로 web + backend 동시 실행, 핫 리로드 지원

### 부정적 결과 (인지된 트레이드오프)

- **코드 생성기 없음**: Nx의 `generate` 명령어 같은 스캐폴딩 기능이 없음. NestJS CLI나 수동 생성으로 대체
- **의존성 관리 주의**: pnpm의 strict 모드에서 phantom dependency 문제가 발생할 수 있음. `.npmrc`에서 `shamefully-hoist=true`가 필요한 경우 있음
- **Python 분리 관리**: AI 서비스가 Turborepo 워크스페이스 외부에 있어 통합 빌드/테스트가 안 됨. 별도 CI 잡으로 관리 필요
- **저장소 크기**: 모든 코드가 하나의 저장소에 있어 클론 시간이 점점 길어질 수 있음. Shallow clone으로 대응

### 향후 고려사항

- 프로젝트 규모가 커지면(패키지 10개 이상) Nx로의 마이그레이션을 검토
- `packages/ui` (공유 UI 컴포넌트 라이브러리) 추가 가능
- `packages/config` (ESLint, TypeScript 공유 설정) 분리 가능

## 참고

- [Turborepo 공식 문서](https://turbo.build/repo/docs)
- [pnpm Workspaces](https://pnpm.io/workspaces)
- [Turborepo vs Nx 비교](https://turbo.build/repo/docs/getting-started/existing-monorepo)
- [Turborepo Remote Cache](https://turbo.build/repo/docs/core-concepts/remote-caching)
