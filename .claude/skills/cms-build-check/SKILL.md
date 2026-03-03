---
name: cms-build-check
description: 빌드 검증 및 자동 수정 스킬. 백엔드와 프론트엔드 빌드를 실행하고, 오류 발견 시 분석-수정-재검증 루프를 반복하여 빌드 성공까지 진행한다.
allowed-tools: Read, Edit, Bash, Grep, Glob
---

# CMS Build Check

코드 변경 후 빌드를 검증하고, 실패 시 자동으로 오류를 분석하여 수정하는 행동 스킬.

**원칙:** 빌드가 통과하지 않은 코드는 완료된 작업이 아니다.

## 1. 빌드 대상 판별

**변경된 파일 위치에 따라 빌드 대상을 결정한다.**

판별 규칙:
- `backend/` 하위 파일 변경 -> Backend 빌드 필요
- `frontend/` 하위 파일 변경 -> Frontend 빌드 필요
- 양쪽 모두 변경 -> 양쪽 모두 빌드
- 판별 불가 시 -> 양쪽 모두 빌드

판별 방법:
```bash
git diff --name-only HEAD  # 변경된 파일 목록 확인
```

## 2. 빌드 실행

**각 대상에 대해 빌드를 실행한다.**

```bash
# Backend 빌드
cd backend && npm run build

# Frontend 빌드
cd frontend && npm run build
```

빌드 실행 시 주의사항:
- 서버가 실행 중이면 빌드만 수행한다. 서버를 시작하지 않는다.
- 타임아웃은 충분히 설정한다 (프론트엔드 빌드는 시간이 걸릴 수 있음).
- 빌드 출력의 마지막 부분에서 성공/실패를 판단한다.

## 3. 오류 분석

**빌드 실패 시 오류를 체계적으로 분석한다.**

분석 순서:
1. 오류 메시지에서 파일 경로와 라인 번호를 추출한다.
2. 오류 유형을 분류한다:

| 오류 유형 | 패턴 | 대응 |
|-----------|------|------|
| Type Error | `TS2xxx` | 타입 정의 수정 |
| Import Error | `Cannot find module` | 경로/파일명 확인 |
| Syntax Error | `Unexpected token` | 구문 수정 |
| Missing Property | `Property does not exist` | 인터페이스/타입 확인 |
| Unused Variable | `is declared but never used` | 변수 제거 또는 사용 |
| ESLint Error | `eslint` | 린트 규칙에 맞게 수정 |

3. 해당 파일을 읽어서 문맥을 파악한다.
4. 오류의 근본 원인을 파악한다 (증상이 아닌 원인을 수정).

## 4. 수정 및 재검증

**오류를 수정하고 다시 빌드한다. 성공할 때까지 반복한다.**

```
1. [오류 분석] -> 파일:라인 식별
2. [코드 수정] -> 최소한의 수정만 적용
3. [빌드 재실행] -> verify: 빌드 성공 여부
4. [실패 시] -> 1번으로 반복 (최대 5회)
5. [5회 초과] -> 사용자에게 상황 보고 및 판단 요청
```

수정 원칙:
- 빌드 오류를 고치기 위해 기존 로직을 변경하지 않는다.
- 타입 오류는 `any`로 회피하지 않고 올바른 타입을 사용한다.
- 수정이 다른 오류를 유발할 수 있으므로, 수정 후 전체 빌드를 다시 실행한다.

## 5. 결과 보고

**빌드 결과를 명확하게 보고한다.**

성공 시:
```
Build Result:
  Backend:  PASS
  Frontend: PASS
```

실패 시:
```
Build Result:
  Backend:  FAIL - [오류 요약]
  Frontend: PASS
  Attempts: 3/5
  Remaining Issues: [미해결 오류 목록]
```

보고 내용은 work_process 문서에 그대로 사용할 수 있는 형식으로 출력한다.
