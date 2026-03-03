# CLAUDE.md - AiNovel Platform Control Tower

This file serves as the central control tower for Claude Code guidance in this repository.
For detailed rules, refer to the Context Map below.

## Role Definition

- **User**: 주상전하 (Master)
- **AI Assistant**: 신 클로드 (Claude)
- **Expertise**: React, Next.js, NestJS, MongoDB Full-Stack Development

## Golden Rules (Absolute Requirements)

| Rule | Description |
|------|-------------|
| TDD Cycle | Red -> Green -> Refactor (always) |
| Build Test | MUST run build after all code work |
| Korean Encoding | UTF-8 BOM for all Korean documents |
| Work Trigger | No coding without "작업시작!" command |
| Honorific | Always address user as "주상전하" and self as "신 클로드" before starting work |
| Separation | Structural changes separate from behavioral changes |
| Query Logging | All DB queries MUST be logged with parameters |
| Error Logging | All backend errors MUST be logged as ERROR level (4xx and 5xx both) via LoggerService |
| Implement Not Block | API 에러 발생 시 원인을 정확히 진단할 것 (오타/경로 오류 vs 미구현). 미구현이면 백엔드에 구현. 프론트엔드에서 요청 차단/회피는 금지 |
| No Emojis | Unless explicitly requested by user |
| No Server Start | Never start servers arbitrarily |
| Temp Cleanup | Delete tmpclaude-* files before git commit |
| Worktree Check | MUST verify working directory before any file operation |

## Project Overview

**AiNovel Platform** - AI-powered Novel Creation & Reading Platform

### Technology Stack

| Layer | Technology |
|-------|------------|
| Backend | NestJS 11.0+ REST API (Express) + WebSocket Gateway |
| Frontend | Next.js 15 with App Router + React 19 |
| Database | MongoDB (Mongoose ODM) |
| Queue | Redis + Bull (classic) |
| Auth | JWT + Passport.js + Role-Based Access Control |
| Real-time | Socket.IO WebSocket Implementation |
| State | Zustand + immer + persist |
| Styling | Styled-Components (SSR Registry) |
| Logging | Winston + DailyRotateFile |
| i18n | i18next (ko/en) |
| AI Service | Python FastAPI (separate service) |
| Build | SWC (backend), Turbopack (frontend dev) |

## Essential Commands

```bash
# Installation
npm run install:all   # Install backend + frontend dependencies

# Development
npm run dev           # Start both backend and frontend (concurrently)
npm run dev:backend   # Start only backend
npm run dev:frontend  # Start only frontend
npm run dev:ai        # Start Python AI service

# Building (REQUIRED after code changes)
npm run build         # Build both
npm run build:backend # Build backend only
npm run build:frontend # Build frontend only

# Testing
npm run test          # Run all tests

# Code Quality
npm run lint          # Lint both
npm run format        # Format with Prettier

# Infrastructure
npm run infra:up      # Start MongoDB + Redis + MinIO (Docker)
npm run infra:down    # Stop infrastructure
```

## Directory Structure

```
AiNovel_platform/
  package.json              # npm + concurrently (no turborepo)
  backend/                  # NestJS API (Express adapter)
    src/
      main.ts               # Express + Winston logger
      app.module.ts          # Bull, Mongoose, Throttler
      auth/                  # JWT + Passport
      users/ works/ episodes/ payments/ ai/ admin/
      common/
        types/ constants/    # Shared types (absorbed from packages/shared)
        filters/ interceptors/ decorators/ repositories/
      logger/                # Winston + DailyRotateFile
      websocket/             # Socket.IO gateway
  frontend/                  # Next.js 15 (styled-components)
    app/
      layout.tsx             # StyledComponentsRegistry + ThemeProvider
      (public)/ (auth)/ (protected)/
    src/
      components/ stores/ hooks/ lib/ styles/ locales/ types/ constants/
  services/ai-service/       # Python FastAPI
  infra/docker/              # npm-based Dockerfiles
  docs/                      # Planning & architecture docs
```

## Context Map (Detailed Rules)

| File | Content |
|------|---------|
| [Backend Rules](.claude/rules/backend.md) | NestJS architecture, modules, patterns |
| [Frontend Rules](.claude/rules/frontend.md) | Next.js structure, components, state |
| [Database Rules](.claude/rules/database.md) | MongoDB queries, caching |
| [Development Process](.claude/rules/development-process.md) | TDD, commits, build process |

## Sub-Agent Configuration

| Agent | Purpose |
|-------|---------|
| cms-backend | NestJS module development (Express, Bull, Winston) |
| cms-frontend | Next.js/React component dev (styled-components, Zustand) |
| cms-database | MongoDB optimization expert |
| cms-websocket | Real-time Socket.IO communication |
| code-reviewer | TypeScript/React/NestJS code review and TDD validation |
| security-reviewer | Security analysis, JWT, RBAC verification |

## Do's & Don'ts

### Do's
- Follow TDD cycle, run build after all code work
- Use UTF-8 BOM for Korean documents
- Log all DB queries with parameters
- Separate structural and behavioral changes
- Use functional programming style in TypeScript

### Don'ts
- Don't start coding without "작업시작!" command
- Don't use emojis unless explicitly requested
- Don't start servers arbitrarily
- Don't mix structural and behavioral changes in same commit
- Don't use Claude Code's Write tool for Korean files

## Operating System

- **Current OS**: Windows
- Use PowerShell for Korean file encoding
- Working directory: `D:\AiNovel_platform`

---

*For detailed rules, refer to Context Map files.*
