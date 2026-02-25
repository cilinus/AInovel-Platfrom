# CLAUDE.md - AI Novel Platform

## Project Overview

AI 기반 한국어 웹소설 생성/소비 플랫폼. Turborepo 모노레포 구조.

## Architecture

- **packages/web**: Next.js 16 + React 19.2 + Tailwind v4
- **packages/backend**: NestJS 11 + Fastify adapter + Mongoose (MongoDB)
- **packages/shared**: Shared TypeScript types/constants
- **services/ai-service**: FastAPI (Python 3.12)
- **infra/docker**: Docker Compose (MongoDB, Redis, MinIO)

## Commands

```bash
pnpm install              # Install all deps
pnpm dev                  # All dev servers
pnpm dev:web              # Next.js only (port 3000)
pnpm dev:api              # NestJS only (port 3001)
pnpm build                # Build all
pnpm lint                 # ESLint
pnpm typecheck            # tsc --noEmit
pnpm test                 # Jest/Vitest
pnpm infra:up             # Docker services up
```

## Coding Conventions

### General
- **Language**: TypeScript (strict mode), Python 3.12
- **Package manager**: pnpm (never npm/yarn)
- **Commits**: Conventional Commits (`feat:`, `fix:`, `docs:`, `chore:`)
- **Branches**: `feature/*`, `fix/*`, `docs/*`

### Import Order
1. Node built-ins
2. External packages
3. Internal modules (`@/`)
4. Types (type-only imports)

### Frontend (packages/web)
- App Router with route groups: `(auth)`, `(main)`
- State: Zustand (global/persisted) + Jotai (reader/local) + TanStack Query (server)
- Styling: Tailwind v4 `@theme` directive, `cn()` utility for conditional classes
- Components: `components/ui/` (shadcn), `components/features/`, `components/layout/`
- Path alias: `@/*` → `src/*`

### Backend (packages/backend)
- NestJS modules: auth, users, works, episodes, payments, ai, admin
- Fastify adapter (NOT Express)
- MongoDB with `@nestjs/mongoose` schemas in `common/schemas/`
- Global guards: ThrottlerGuard, JwtAuthGuard, RolesGuard
- Global interceptor: TransformInterceptor (`{ success, data, timestamp }`)
- Global filter: HttpExceptionFilter (unified error format)
- Decorators: `@Public()`, `@Roles()`, `@CurrentUser()`
- DTOs: class-validator + class-transformer

### Database
- MongoDB 8.0 with replica set (required for transactions)
- Mongoose schemas with indexes defined in schema files
- Redis for cache (DB0), sessions (DB1), BullMQ (DB2), rate-limit (DB3)

### AI Service (services/ai-service)
- FastAPI with async endpoints
- 3-tier model: Claude Sonnet → GPT-4o → Ollama (local)
- BullMQ integration via NestJS backend proxy

## Key Files

- `packages/backend/src/main.ts` - Fastify bootstrap
- `packages/backend/src/app.module.ts` - Root module
- `packages/web/app/layout.tsx` - Root layout
- `packages/web/lib/api-client.ts` - API client with token refresh
- `packages/shared/src/types/` - Shared type definitions
- `infra/docker/docker-compose.yml` - Local dev services

## Testing

- Backend: Jest (`pnpm test --filter=@ainovel/backend`)
- Frontend: Vitest (to be configured)
- AI: pytest (`cd services/ai-service && pytest`)

## Environment Variables

See `.env.example` in each package/service for required variables.
Critical secrets: JWT_ACCESS_SECRET, JWT_REFRESH_SECRET, ANTHROPIC_API_KEY
