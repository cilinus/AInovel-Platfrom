# AI Novel Platform (AI 소설 플랫폼)

AI 기반 한국어 웹소설 생성 및 소비 플랫폼

## Tech Stack

| Layer | Stack |
|-------|-------|
| **Frontend** | Next.js 16, React 19.2, Tailwind CSS v4, Zustand, Jotai, TanStack Query |
| **Backend** | NestJS 11 + Fastify, Mongoose, BullMQ |
| **Database** | MongoDB 8.0, Redis 7 |
| **AI** | FastAPI, Claude Sonnet (primary), GPT-4o (fallback) |
| **Infra** | Turborepo + pnpm, Docker Compose, GitHub Actions |

## Quick Start

### Prerequisites

- Node.js 20+
- pnpm 9+
- Docker & Docker Compose
- Python 3.12+ (AI service)

### Setup

```bash
# 1. Install dependencies
pnpm install

# 2. Start infrastructure (MongoDB + Redis + MinIO)
cd infra/docker && docker compose up -d && cd ../..

# 3. Copy env files
cp packages/web/.env.example packages/web/.env.local
cp packages/backend/.env.example packages/backend/.env
cp services/ai-service/.env.example services/ai-service/.env

# 4. Run all dev servers
pnpm dev
```

### Individual Services

```bash
pnpm dev:web      # Next.js → http://localhost:3000
pnpm dev:api      # NestJS  → http://localhost:3001
pnpm dev:ai       # FastAPI → http://localhost:8000
```

## Project Structure

```
AInovel-Platform/
├── docs/               # Design documents
│   ├── planning/       # Service planning (10 docs)
│   ├── architecture/   # System architecture + ADR
│   ├── frontend/       # Frontend design (5 docs)
│   ├── backend/        # Backend design (5 docs)
│   ├── database/       # DB schema + cache strategy
│   └── ai/             # AI pipeline + prompts
├── packages/
│   ├── web/            # Next.js 16 webapp
│   ├── backend/        # NestJS + Fastify API
│   └── shared/         # Shared types & constants
├── services/
│   └── ai-service/     # FastAPI AI generation
└── infra/
    ├── docker/         # Docker Compose + Dockerfiles
    └── .github/        # CI/CD workflows
```

## Documentation

| Area | Documents |
|------|-----------|
| **Planning** | Service overview, features, screens, tech stack, business model, roadmap |
| **Architecture** | System overview, infrastructure, ADR (MongoDB, Fastify, Monorepo) |
| **Frontend** | Web architecture, PWA, design system, reader, state management |
| **Backend** | API architecture, endpoints (68), authentication, payment, service modules |
| **Database** | MongoDB schema, indexes, Redis cache strategy |
| **AI** | Generation pipeline, prompt engineering, model strategy |

## API Documentation

NestJS Swagger UI: `http://localhost:3001/docs` (development only)

## Scripts

| Command | Description |
|---------|-------------|
| `pnpm dev` | Start all dev servers |
| `pnpm build` | Build all packages |
| `pnpm lint` | Lint all packages |
| `pnpm typecheck` | Type check all packages |
| `pnpm test` | Run all tests |
| `pnpm infra:up` | Start Docker services |
| `pnpm infra:down` | Stop Docker services |

## Reference Platforms

| Platform | Focus |
|----------|-------|
| Munpia | Male-oriented web novels |
| Novelpia | Male-oriented web novels |
| KakaoPage | Female-oriented, strong IP |
| Naver Series | Comprehensive content |
| Ridi | Female-oriented, e-books |
