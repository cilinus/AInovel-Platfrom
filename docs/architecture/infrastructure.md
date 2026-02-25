# 인프라스트럭처 설계

## 1. AWS 인프라 (MVP - 비용 최적화)

### 1.1 리소스 구성도

```
┌─────────────────────────────────────────────────────────────────┐
│                         AWS VPC (ap-northeast-2)                │
│                                                                 │
│  ┌─────────────────────────────────────────────────────────┐    │
│  │                    Public Subnet                         │    │
│  │  ┌──────────────┐                                       │    │
│  │  │     ALB      │  *.ainovel.kr → ALB                   │    │
│  │  │  (리스너)     │  / → web:3000, /api → api:4000       │    │
│  │  └──────┬───────┘                                       │    │
│  └─────────┼───────────────────────────────────────────────┘    │
│            │                                                    │
│  ┌─────────▼───────────────────────────────────────────────┐    │
│  │                   Private Subnet                         │    │
│  │                                                          │    │
│  │  ┌─── ECS Fargate Cluster ───────────────────────────┐  │    │
│  │  │                                                     │  │    │
│  │  │  ┌────────────┐ ┌────────────┐ ┌──────────────┐   │  │    │
│  │  │  │ web        │ │ api        │ │ ai-service   │   │  │    │
│  │  │  │ 0.25vCPU   │ │ 0.5vCPU    │ │ 0.5vCPU      │   │  │    │
│  │  │  │ 512MB      │ │ 1GB        │ │ 1GB          │   │  │    │
│  │  │  │ desired: 1 │ │ desired: 1 │ │ desired: 1   │   │  │    │
│  │  │  └────────────┘ └────────────┘ └──────────────┘   │  │    │
│  │  └─────────────────────────────────────────────────────┘  │    │
│  │                                                          │    │
│  │  ┌───────────────┐  ┌───────────────────────────────┐    │    │
│  │  │ ElastiCache   │  │ DocumentDB / Atlas (M10)      │    │    │
│  │  │ Redis 7       │  │ MongoDB 호환                    │    │    │
│  │  │ t4g.micro     │  │ 또는 Atlas M10 Serverless      │    │    │
│  │  │ 1 node        │  │                               │    │    │
│  │  └───────────────┘  └───────────────────────────────┘    │    │
│  └──────────────────────────────────────────────────────────┘    │
│                                                                 │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────────────┐   │
│  │ S3 Bucket    │  │ CloudFront   │  │ ECR (Container       │   │
│  │ 이미지/커버   │  │ CDN 배포      │  │  Registry)           │   │
│  └──────────────┘  └──────────────┘  └──────────────────────┘   │
└─────────────────────────────────────────────────────────────────┘
```

### 1.2 MVP AWS 리소스 상세

| 서비스 | 사양 | 용도 | 월 예상 비용 |
|--------|------|------|-------------|
| **ECS Fargate (web)** | 0.25 vCPU / 512MB x 1 | Next.js SSR | ~$9 |
| **ECS Fargate (api)** | 0.5 vCPU / 1GB x 1 | NestJS API | ~$18 |
| **ECS Fargate (ai)** | 0.5 vCPU / 1GB x 1 | FastAPI | ~$18 |
| **Atlas M10** | 2GB RAM, 10GB 스토리지 | MongoDB (추천) | ~$57 |
| **ElastiCache** | cache.t4g.micro x 1 | Redis 캐시/큐 | ~$12 |
| **ALB** | 1개 | 로드밸런서 | ~$18 |
| **S3** | ~10GB | 이미지/정적파일 | ~$1 |
| **CloudFront** | ~50GB 전송 | CDN | ~$5 |
| **ECR** | 3 레포지토리 | 컨테이너 이미지 | ~$1 |
| **Route 53** | 1 호스팅 존 | DNS | ~$1 |
| **CloudWatch** | 기본 모니터링 | 로그/메트릭 | ~$5 |
| **Secrets Manager** | 5개 시크릿 | API 키 관리 | ~$2 |
| | | **합계** | **~$147/월** |

> **비용 절감 팁**: Atlas M10 대신 Atlas Serverless를 사용하면 트래픽이 적은 MVP 단계에서 ~$30으로 절감 가능. 또는 DocumentDB 대신 Atlas Free Tier(M0, 512MB)로 시작하여 $0으로 DB 비용 제거 가능.

### 1.3 Atlas vs DocumentDB 선택 가이드

| 기준 | Atlas (추천) | DocumentDB |
|------|-------------|------------|
| MongoDB 호환성 | 100% (공식) | ~85% (에뮬레이션) |
| Atlas Search | 지원 (풀텍스트) | 미지원 |
| Change Streams | 완전 지원 | 부분 지원 |
| Serverless | M0(무료)~Serverless | 미지원 |
| 비용 (MVP) | M0 무료 / M10 $57 | db.t3.medium $58 |
| VPC Peering | 필요 | 같은 VPC |

MVP 단계에서는 **Atlas M10 또는 Serverless**를 추천한다. 트래픽 증가 시 DocumentDB로 마이그레이션 가능하다.

## 2. 로컬 개발 환경 (Docker Compose)

```yaml
# infra/docker/docker-compose.yml
services:
  mongodb:
    image: mongo:8.0
    container_name: ainovel-mongodb
    ports:
      - "27017:27017"
    environment:
      MONGO_INITDB_ROOT_USERNAME: admin
      MONGO_INITDB_ROOT_PASSWORD: password
      MONGO_INITDB_DATABASE: ainovel
    volumes:
      - mongodb_data:/data/db
      - ./init-mongo.js:/docker-entrypoint-initdb.d/init-mongo.js:ro
    command: ["--replSet", "rs0", "--keyFile", "/dev/null", "--bind_ip_all"]
    healthcheck:
      test: ["CMD", "mongosh", "--eval", "db.adminCommand('ping')"]
      interval: 10s
      timeout: 5s
      retries: 5

  # MongoDB ReplicaSet 초기화 (트랜잭션 지원에 필요)
  mongo-init-replica:
    image: mongo:8.0
    container_name: ainovel-mongo-init
    depends_on:
      mongodb:
        condition: service_healthy
    entrypoint: >
      mongosh --host mongodb:27017 -u admin -p password --authenticationDatabase admin --eval '
        rs.initiate({
          _id: "rs0",
          members: [{ _id: 0, host: "mongodb:27017" }]
        })
      '
    restart: "no"

  redis:
    image: redis:7-alpine
    container_name: ainovel-redis
    ports:
      - "6379:6379"
    command: redis-server --maxmemory 128mb --maxmemory-policy allkeys-lru
    volumes:
      - redis_data:/data
    healthcheck:
      test: ["CMD", "redis-cli", "ping"]
      interval: 10s
      timeout: 3s
      retries: 5

  minio:
    image: minio/minio:latest
    container_name: ainovel-minio
    ports:
      - "9000:9000"    # API
      - "9001:9001"    # Console UI
    environment:
      MINIO_ROOT_USER: minioadmin
      MINIO_ROOT_PASSWORD: minioadmin
    volumes:
      - minio_data:/data
    command: server /data --console-address ":9001"
    healthcheck:
      test: ["CMD", "mc", "ready", "local"]
      interval: 10s
      timeout: 5s
      retries: 5

  # MinIO 초기 버킷 생성
  minio-init:
    image: minio/mc:latest
    container_name: ainovel-minio-init
    depends_on:
      minio:
        condition: service_healthy
    entrypoint: >
      /bin/sh -c "
        mc alias set local http://minio:9000 minioadmin minioadmin;
        mc mb local/ainovel-covers --ignore-existing;
        mc mb local/ainovel-episodes --ignore-existing;
        mc mb local/ainovel-uploads --ignore-existing;
        mc anonymous set download local/ainovel-covers;
      "
    restart: "no"

volumes:
  mongodb_data:
  redis_data:
  minio_data:
```

### 로컬 환경 실행

```bash
# 인프라 시작
pnpm infra:up

# 개발 서버 동시 실행 (Turborepo)
pnpm dev

# 또는 개별 실행
pnpm dev:web    # Next.js → http://localhost:3000
pnpm dev:api    # NestJS  → http://localhost:4000
pnpm dev:ai     # FastAPI → http://localhost:8000
```

## 3. CI/CD 파이프라인 (GitHub Actions)

### 3.1 파이프라인 개요

```
┌──────────┐    ┌──────────┐    ┌──────────┐    ┌───────────┐
│  Push /  │───►│  Lint &  │───►│  Build & │───►│  Deploy   │
│  PR      │    │  Test    │    │  Docker  │    │  ECS      │
└──────────┘    └──────────┘    └──────────┘    └───────────┘
     │                │               │               │
     │         paths-filter로     변경된 서비스만     환경별 분기
     │         변경 감지          빌드             (staging/prod)
```

### 3.2 CI 워크플로우

```yaml
# .github/workflows/ci.yml
name: CI

on:
  pull_request:
    branches: [main, develop]
  push:
    branches: [main, develop]

jobs:
  detect-changes:
    runs-on: ubuntu-latest
    outputs:
      web: ${{ steps.filter.outputs.web }}
      backend: ${{ steps.filter.outputs.backend }}
      ai-service: ${{ steps.filter.outputs.ai-service }}
      shared: ${{ steps.filter.outputs.shared }}
    steps:
      - uses: actions/checkout@v4
      - uses: dorny/paths-filter@v3
        id: filter
        with:
          filters: |
            web:
              - 'apps/web/**'
              - 'packages/shared/**'
            backend:
              - 'apps/backend/**'
              - 'packages/shared/**'
            ai-service:
              - 'services/ai-service/**'
            shared:
              - 'packages/shared/**'

  lint-and-test:
    needs: detect-changes
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: pnpm/action-setup@v4
        with:
          version: 9
      - uses: actions/setup-node@v4
        with:
          node-version: 20
          cache: 'pnpm'

      - run: pnpm install --frozen-lockfile

      # Turborepo 원격 캐시
      - run: pnpm turbo lint --filter=...[origin/main]
        env:
          TURBO_TOKEN: ${{ secrets.TURBO_TOKEN }}
          TURBO_TEAM: ${{ secrets.TURBO_TEAM }}

      - run: pnpm turbo test --filter=...[origin/main]

  lint-ai-service:
    needs: detect-changes
    if: needs.detect-changes.outputs.ai-service == 'true'
    runs-on: ubuntu-latest
    defaults:
      run:
        working-directory: services/ai-service
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-python@v5
        with:
          python-version: '3.12'
      - run: pip install ruff pytest
      - run: ruff check .
      - run: pytest tests/ -v

  build-and-push:
    needs: [lint-and-test, detect-changes]
    if: github.ref == 'refs/heads/main'
    runs-on: ubuntu-latest
    strategy:
      matrix:
        include:
          - service: web
            context: .
            dockerfile: apps/web/Dockerfile
            changed: ${{ needs.detect-changes.outputs.web }}
          - service: backend
            context: .
            dockerfile: apps/backend/Dockerfile
            changed: ${{ needs.detect-changes.outputs.backend }}
          - service: ai-service
            context: services/ai-service
            dockerfile: services/ai-service/Dockerfile
            changed: ${{ needs.detect-changes.outputs.ai-service }}
    steps:
      - if: matrix.changed == 'true'
        uses: actions/checkout@v4

      - if: matrix.changed == 'true'
        uses: aws-actions/configure-aws-credentials@v4
        with:
          aws-access-key-id: ${{ secrets.AWS_ACCESS_KEY_ID }}
          aws-secret-access-key: ${{ secrets.AWS_SECRET_ACCESS_KEY }}
          aws-region: ap-northeast-2

      - if: matrix.changed == 'true'
        uses: aws-actions/amazon-ecr-login@v2
        id: ecr

      - if: matrix.changed == 'true'
        run: |
          docker build \
            -f ${{ matrix.dockerfile }} \
            -t ${{ steps.ecr.outputs.registry }}/ainovel-${{ matrix.service }}:${{ github.sha }} \
            -t ${{ steps.ecr.outputs.registry }}/ainovel-${{ matrix.service }}:latest \
            ${{ matrix.context }}
          docker push --all-tags ${{ steps.ecr.outputs.registry }}/ainovel-${{ matrix.service }}

  deploy-staging:
    needs: build-and-push
    if: github.ref == 'refs/heads/main'
    runs-on: ubuntu-latest
    environment: staging
    steps:
      - uses: aws-actions/configure-aws-credentials@v4
        with:
          aws-access-key-id: ${{ secrets.AWS_ACCESS_KEY_ID }}
          aws-secret-access-key: ${{ secrets.AWS_SECRET_ACCESS_KEY }}
          aws-region: ap-northeast-2

      - name: Deploy to ECS
        run: |
          aws ecs update-service \
            --cluster ainovel-staging \
            --service ainovel-web \
            --force-new-deployment
          aws ecs update-service \
            --cluster ainovel-staging \
            --service ainovel-api \
            --force-new-deployment
```

## 4. 환경 관리

### 4.1 환경 구성

| 환경 | 브랜치 | 도메인 | 용도 |
|------|--------|--------|------|
| **Local** | 모든 브랜치 | localhost | 로컬 개발 |
| **Staging** | main (자동) | staging.ainovel.kr | QA/테스트 |
| **Production** | main (수동 승인) | ainovel.kr | 실서비스 |

### 4.2 환경 변수 관리

```bash
# apps/backend/.env.example
NODE_ENV=development
PORT=4000

# MongoDB
MONGODB_URI=mongodb://admin:password@localhost:27017/ainovel?authSource=admin&replicaSet=rs0

# Redis
REDIS_HOST=localhost
REDIS_PORT=6379

# S3/MinIO
S3_ENDPOINT=http://localhost:9000
S3_BUCKET_COVERS=ainovel-covers
S3_ACCESS_KEY=minioadmin
S3_SECRET_KEY=minioadmin

# AI Service
AI_SERVICE_URL=http://localhost:8000

# JWT
JWT_SECRET=dev-secret-key
JWT_EXPIRES_IN=7d

# OpenAI (AI Service에서 사용)
OPENAI_API_KEY=sk-...
```

프로덕션에서는 **AWS Secrets Manager**를 사용하여 시크릿을 관리하고, ECS Task Definition에서 환경 변수로 주입한다.

```json
// ECS Task Definition (발췌)
{
  "secrets": [
    {
      "name": "MONGODB_URI",
      "valueFrom": "arn:aws:secretsmanager:ap-northeast-2:123456:secret:ainovel/prod/mongodb-uri"
    },
    {
      "name": "JWT_SECRET",
      "valueFrom": "arn:aws:secretsmanager:ap-northeast-2:123456:secret:ainovel/prod/jwt-secret"
    }
  ]
}
```

## 5. 비용 시나리오별 비교

### MVP 단계 ($50~$150/월)

| 시나리오 | DB | Redis | 컴퓨팅 | 합계 |
|---------|-----|-------|--------|------|
| **최소 ($50)** | Atlas M0 (무료) | ElastiCache t4g.micro ($12) | Fargate 최소 x3 ($27) | ~$50 |
| **기본 ($100)** | Atlas Serverless (~$30) | ElastiCache t4g.micro ($12) | Fargate x3 ($45) | ~$100 |
| **권장 ($150)** | Atlas M10 ($57) | ElastiCache t4g.micro ($12) | Fargate x3 ($45) + ALB ($18) + 기타 ($15) | ~$147 |

### 성장 단계 (MAU 1만, $300~500/월)

| 항목 | 사양 변경 | 추가 비용 |
|------|----------|----------|
| API 서버 | 0.5 vCPU → 1 vCPU, 태스크 2개 | +$50 |
| MongoDB | Atlas M20 (4GB) | +$100 |
| Redis | t4g.small | +$20 |
| CloudFront | 트래픽 증가 | +$30 |
| 모니터링 | Sentry (무료), CloudWatch 확장 | +$10 |

## 6. 모니터링 전략 (MVP)

| 계층 | 도구 | 비용 |
|------|------|------|
| **에러 트래킹** | Sentry (무료 티어: 5K 이벤트/월) | $0 |
| **로그** | CloudWatch Logs (ECS 기본) | ~$3 |
| **메트릭** | CloudWatch Metrics (기본) | $0 |
| **APM** | NestJS Logger + 수동 계측 | $0 |
| **업타임** | UptimeRobot (무료: 50 모니터) | $0 |
| **알림** | CloudWatch Alarms → Slack Webhook | $1 |

MVP에서는 유료 APM(Datadog, New Relic) 없이 CloudWatch + Sentry 조합으로 시작하고, 트래픽 증가 시 도입을 검토한다.
