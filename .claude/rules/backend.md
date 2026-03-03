# Backend Rules - NestJS Architecture

Backend-specific rules and architecture guidelines for the AiNovel Platform.

## Technology Stack

- **Framework**: NestJS 11.0+ REST API (Express adapter) + WebSocket Gateway
- **Runtime**: Node.js with TypeScript, SWC builder
- **Database**: MongoDB (Mongoose ODM)
- **Queue**: Redis + Bull (classic) for AI job processing
- **Authentication**: JWT + Passport.js
- **Real-time**: Socket.IO WebSocket Implementation
- **Logging**: Winston + DailyRotateFile

## Core Design Patterns

### Modular Monolith
- Domain-driven module separation with clear boundaries
- Each module has its own controller, service, and repository
- Cross-module communication through dependency injection

### BaseRepository Pattern
- Mongoose Model-based CRUD operations (`backend/src/common/repositories/base.repository.ts`)
- All database operations go through repository layer with query logging
- Each domain inherits from BaseRepository

### Service Layer
- Business logic separation with dependency injection
- Services are stateless and testable
- One service per domain responsibility

### DTO Validation
- Class-validator + class-transformer for request/response validation
- All API inputs must be validated through DTOs
- Response DTOs for consistent API output

### Event-Driven
- WebSocket gateway for real-time AI generation progress
- Bull queue for async AI job processing
- Socket.IO namespace: `/ws`

## Module Structure

```
src/
  main.ts                    # Express adapter + Winston logger setup
  app.module.ts              # Bull, Mongoose, Throttler, Logger, WebSocket
  auth/                      # JWT + Passport.js (bcrypt, refresh tokens)
  users/                     # User CRUD, profile, token balance
  works/                     # Novel works management
  episodes/                  # Episode CRUD, content delivery
  payments/                  # Token charge, episode purchase (transactions)
  ai/                        # Bull queue -> Python AI service bridge
  admin/                     # Admin dashboard
  common/
    types/                   # Shared types (UserRole, WorkStatus, etc.)
    constants/               # Error codes, genres
    schemas/                 # Mongoose schemas (User, Work, Episode)
    filters/                 # HttpExceptionFilter (Express Response)
    interceptors/            # Logging, ErrorHandler, Transform
    decorators/              # @Public, @Roles, @CurrentUser
    repositories/            # BaseRepository<T>
  logger/                    # Winston + DailyRotateFile (Global module)
  websocket/                 # Socket.IO gateway (Global module)
```

## Performance Features

| Feature | Configuration |
|---------|--------------|
| Rate Limiting | Throttle guard, 60 requests/minute |
| Request Validation | Class-validator with DTO pattern |
| Error Handling | HttpExceptionFilter + ErrorHandlerInterceptor |
| HTTP Logging | LoggingInterceptor (method, url, duration) |
| Queue | Bull with Redis, 3 retries, exponential backoff |
| Build | SWC compiler for fast builds |

## Security Features

- bcrypt password hashing (salt rounds: 12)
- JWT access + refresh token with httpOnly cookie
- CORS configuration for cross-origin
- Input sanitization in all DTOs
- cookie-parser middleware for Express

## Error Logging Policy (Golden Rule)

All backend errors MUST be logged as ERROR level via LoggerService. No exception.

| Component | Behavior |
|-----------|----------|
| HttpExceptionFilter | Logs ALL errors (4xx and 5xx) as ERROR level with method, URL, status, code, message |
| ErrorHandlerInterceptor | Logs ALL errors as ERROR level with errorId UUID for tracing |
| 5xx errors | Include full stack trace in log |
| 4xx errors | Log without stack trace but include request details |
| NestJS built-in Logger | NEVER use for error logging; always use injected LoggerService |

## Do's

- Use dependency injection for all services
- Log all database queries with parameters via BaseRepository
- Log ALL errors as ERROR level via LoggerService (including 4xx validation errors)
- Use DTOs for all API request/response
- Use transactions for multi-document operations
- Use Winston logger (injected LoggerService) instead of console.log
- Inject LoggerService in exception filters (not NestJS built-in Logger)
- API 에러 발생 시 원인을 정확히 진단할 것 (오타/경로 오류 vs 미구현 엔드포인트). 미구현이면 백엔드에 구현, 프론트에서 차단/회피 금지

## Don'ts

- Don't skip DTO validation for any endpoint
- Don't hardcode configuration values (use ConfigService)
- Don't create circular dependencies between modules
- Don't use synchronous file operations
- Don't expose internal error details to clients
- Don't use NestJS built-in Logger for error logging (use LoggerService)
- Don't log HttpException as WARN level (always ERROR)
