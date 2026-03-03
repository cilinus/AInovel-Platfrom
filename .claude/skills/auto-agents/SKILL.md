---
name: auto-agents
description: 서브에이전트, Agent Teams, Serena MCP, Skills를 자동 판단하여 병렬 작업을 실행하는 오케스트레이터. 복잡한 작업을 분석하여 최적의 에이전트/스킬 조합을 결정하고 병렬로 실행한다.
disable-model-invocation: true
argument-hint: [작업 설명]
---

# Auto-Agents Orchestrator

사용자의 작업 요청을 분석하여 최적의 서브에이전트, Skills, MCP 도구 조합을 자동 결정하고 병렬로 실행한다.

## 0. 환경 감지 (매 실행마다 수행)

**현재 워크트리 경로를 감지한다.** `pwd`로 현재 작업 디렉토리를 확인하고, 모든 작업을 해당 경로 내에서만 수행한다. 메인 레포지토리(`C:\Project\CMS\CMS UI`) 파일을 직접 참조하지 않는다.

## 1. 작업 분석 (Think Step-by-Step)

다음 작업 요청을 단계별로 분석한다:

**작업:** $ARGUMENTS

분석 항목:
1. **복잡도 평가**: 단순(1-3 파일), 중간(4-10 파일), 복잡(10+ 파일)
2. **도메인 식별**: 백엔드 / 프론트엔드 / DB / WebSocket / ESL / 복합
3. **의존성 맵**: 독립 작업 vs 순차 작업 분리
4. **병렬화 기회**: 동시 실행 가능한 작업 그룹 식별

## 2. 에이전트 자동 선택

### Sub-Agent 매트릭스

| 키워드/도메인 | subagent_type | 용도 |
|---|---|---|
| 코드 탐색, 검색, 분석 | `Explore` | 코드베이스 탐색 (읽기 전용) |
| 설계, 아키텍처, 계획 | `Plan` | 구현 전략 설계 (읽기 전용) |
| 구현, 수정, 생성, 범용 | `general-purpose` | 파일 수정 포함 전체 기능 |
| 코드 리뷰, 품질 | `code-reviewer` | TypeScript/React/NestJS 리뷰 |
| 보안, 인증, JWT, RBAC | `security-reviewer` | OWASP, 취약점 분석 |
| UI, UX, 접근성 | `ux-reviewer` | 프론트엔드 UX 최적화 |
| 아키텍처, 기술 결정 | `tech-lead` | 아키텍처 의사결정 |
| 리팩토링, 단순화 | `code-simplifier` | 코드 최적화 |
| NestJS, 모듈, 서비스 | `cms-backend` | NestJS 백엔드 전문 |
| React, 컴포넌트, 페이지 | `cms-frontend` | Next.js/React 전문 |
| MySQL, MongoDB, 쿼리 | `cms-database` | DB 최적화 |
| Socket, 실시간, emit | `cms-websocket` | Socket.IO 전문 |
| ESL, 태그, 라벨, 템플릿 | `cms-esl` | ESL 태그 시스템 |

### Skill 자동 활성화

| 키워드 | Skill | 시점 |
|---|---|---|
| API, endpoint, REST | `/cms-api-endpoint` | API 설계/구현 |
| build, 빌드 | `/cms-build-check` | 코드 변경 후 (항상 마지막에) |
| query, DB 조회 | `/cms-db-query` | 쿼리 작성/최적화 |
| i18n, 번역 | `/cms-i18n` | 다국어 키 관리 |
| module, controller, dto | `/cms-nestjs-module` | NestJS 모듈 스캐폴딩 |
| component, hook, store | `/cms-react-component` | React 컴포넌트 생성 |
| TDD, 테스트 | `/cms-tdd-workflow` | 테스트 주도 개발 |
| mysql, DB조회 | `/mysql-connect` | MySQL 직접 쿼리 |
| mongodb, mongo | `/mongodb-connect` | MongoDB 직접 쿼리 |

## 3. Serena MCP 활용

코드 분석/수정 시 Serena 도구를 적극 활용:

- **점진적 탐색**: `get_symbols_overview` -> `find_symbol`(include_body=True) 순서
- **참조 추적**: `find_referencing_symbols`로 심볼 관계 파악
- **심볼 수정**: `replace_symbol_body`, `insert_after_symbol`, `insert_before_symbol`
- **패턴 검색**: `search_for_pattern`으로 코드 패턴 검색
- **부분 수정**: `replace_content`로 정규식 기반 편집

**원칙**: 전체 파일 읽기보다 심볼 단위 점진적 정보 획득 우선.

## 4. 실행 전략 결정

### 전략 A: Sub-Agents (기본 전략)

독립 작업 2-10개, 에이전트 간 소통 불필요 시:

```
[작업 분해] -> [Sub-Agent 병렬 실행 (Task 도구)] -> [결과 통합]
```

- Task 도구로 최대 10개까지 병렬 실행
- 각 Sub-Agent에 현재 워크트리 경로와 명확한 작업 범위 전달
- 독립 작업은 반드시 같은 메시지에서 동시 호출

### 전략 B: Agent Teams (복잡한 협업)

에이전트 간 소통/조율 필요, 크로스 레이어 작업 시:

```
[TeamCreate] -> [TaskCreate x N] -> [Teammate 생성] -> [태스크 할당]
-> [진행 모니터링] -> [결과 종합] -> [Shutdown] -> [TeamDelete]
```

**Teams 사용 조건:**
- 10+ 파일, 여러 도메인에 걸친 복합 작업
- teammate 간 발견 사항 공유 필요
- 병렬 코드 리뷰, 경쟁적 가설 검증 (디버깅)
- 프론트엔드 + 백엔드 + 테스트 동시 구현

**Teams 구성 원칙:**
- teammate 2-5명, 각자 명확한 역할
- teammate별 담당 파일 분리 (충돌 방지)
- 5-6개 태스크/teammate 균형 유지
- worktree isolation 모드로 독립 작업 가능

### 전략 C: 하이브리드

탐색은 Sub-Agent(Explore), 구현은 Agent Teams로 단계 분리.

## 5. 의사결정 플로우

```
[작업 접수] -> [복잡도 평가]
  |
  +-- 단순 (1-3 파일) ---> Sub-Agent 1-2개 + 관련 Skill
  |
  +-- 중간 (4-10 파일) --> Sub-Agent 3-5개 병렬 + Skill + Serena
  |
  +-- 복잡 (10+ 파일) --> [에이전트 간 소통 필요?]
       +-- Yes --> Agent Teams (2-5 teammate)
       +-- No  --> Sub-Agent 5-10개 병렬
  |
  [실행] -> [빌드 검증] -> [결과 보고]
```

## 6. 실행 규칙

- 독립 작업은 **반드시 병렬** 실행 (같은 메시지에서 다중 Tool 호출)
- Sub-Agent 생성 시 **현재 워크트리 경로를 명시적으로 전달**
- 메인 레포지토리 경로 직접 참조 금지
- 코드 변경 후 **빌드 검증 필수** (`/cms-build-check`)
- `작업시작!` 명령 없이는 분석/계획만 수행
