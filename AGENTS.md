# AGENTS.md

This file provides guidance to WARP (warp.dev) when working with code in this repository.

## Project Overview

**Cilinus CMS** - Digital Signage & Electronic Shelf Label (ESL) Management Platform

This is a full-stack monorepo with separate `backend/` and `frontend/` directories.

## Technology Stack

| Layer | Technology |
|-------|------------|
| Backend | NestJS 11.0+ REST API + WebSocket Gateway |
| Frontend | Next.js 15 with App Router + React 19 |
| Primary DB | MySQL with Connection Pooling |
| Secondary DB | MongoDB for Caching & Analytics |
| Auth | JWT + Role-Based Access Control (RBAC) |
| Real-time | Socket.IO WebSocket |
| State | Zustand with Cross-Storage Persistence |
| Styling | Styled-Components |
| i18n | i18next (ko/en/ja/zh-CN/zh-TW) |

## Essential Commands

```bash
# Installation
npm run install:all   # Install all dependencies (root + backend + frontend)

# Development
npm run dev           # Start both backend and frontend
npm run dev:backend   # Start only backend (port 4000)
npm run dev:frontend  # Start only frontend (port 3000)

# Building (REQUIRED after code changes)
npm run build         # Build both
npm run build:backend # Build backend only
npm run build:frontend # Build frontend only

# Testing
npm run test          # Run all tests
npm run test:backend  # Backend tests only (Jest)
npm run test:frontend # Frontend tests only (Jest + RTL)

# Code Quality
npm run lint          # Lint both
npm run lint:backend  # Backend ESLint
npm run lint:frontend # Frontend ESLint

# Single test file
cd backend && npm run test -- --testPathPattern="auth.service.spec"
cd frontend && npm run test -- --testPathPattern="Button.test"
```

## Architecture Overview

### Backend Structure (`backend/src/`)

**Auth & Access Control:**
- `auth/` - JWT token management with Passport.js
- `users/` - User lifecycle management
- `roles/` - Hierarchical role management
- `permissions/` - 3-tier caching (Memory→MongoDB→MySQL)

**Device Management (ESL/Digital Signage):**
- `devices/` - Device registration and status tracking
- `device_websocket/` - WebSocket gateway (handles 10k+ connections)
- `device-player/` - Content playback control
- `device-status/` - Real-time health monitoring
- `tags/` - Electronic shelf label content
- `tag-templates/` - Reusable display templates

**Content & Scheduling:**
- `product/` - Product catalog with MongoDB integration
- `reservation/` - Content scheduling system
- `scheduled-tasks/` - Batch job management
- `promotion-templates/` - Promotional content templates

**Infrastructure:**
- `database/` - MySQL connection pool + MongoDB integration
- `frontend-websocket/` - Real-time UI updates gateway
- `email/` - NodeMailer notification system
- `organization/` - Multi-tenant management

### Frontend Structure

**App Router (`frontend/app/`):**
- `(with-org-bar)/` - Organization-aware pages with context
  - `dashboard/` - Analytics & monitoring
  - `devices/` - ESL device management
  - `templates/` - Template management
  - `products/` - Product catalog
  - `reservation/` - Content scheduling
  - `organization/` - Multi-tenant management
  - `users/` - User & role management
- `(without-org-bar)/` - Organization-agnostic pages
- `login/` - Authentication

**Source (`frontend/src/`):**
- `components/` - UI components organized by domain
- `store/` + `stores/` - Zustand state management
- `hooks/` - Custom React hooks (useAuth, usePermissions, useDeviceTags)
- `services/` - API service layer
- `contexts/` - React context providers (Organization, etc.)
- `i18n/` + `locales/` - Internationalization

### Key Design Patterns

1. **Repository Pattern** - All DB operations through repository layer
2. **DTO Validation** - class-validator for all API inputs/outputs
3. **3-Tier Caching** - Memory (L1) → MongoDB (L2) → MySQL (L3)
4. **WebSocket Gateways** - Separate gateways for devices and frontend
5. **Zustand Stores** - Domain-specific stores with persistence middleware

## Important Guidelines

### Build Verification
Always run `npm run build` after code changes before considering work complete. Build must succeed.

### Database Queries
All database queries MUST be logged with complete parameters:
```typescript
const completeQuery = mysql.format(query, params);
this.logger.debug(`Executing query: ${completeQuery}`);
```

### Commit Attribution
Include co-author line in all commits:
```
Co-Authored-By: Warp <agent@warp.dev>
```

### Change Separation
Never mix structural changes (refactoring) with behavioral changes (new features) in the same commit.

### Korean Documents
Use UTF-8 BOM encoding for Korean Markdown files:
```powershell
[IO.File]::WriteAllLines('path/file.md', @('# Content'), [Text.Encoding]::UTF8)
```

### Server Management
Never start development servers arbitrarily - always confirm with the user first to avoid port conflicts.

## Docker Development

```bash
# Start full stack with Docker
docker-compose up -d

# Services: frontend(3000), backend(4000), mongodb(27017), redis(6379), nginx(80/443)
```

Environment configuration via `.env.docker` (see `.env.docker.example`).
