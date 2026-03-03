---
name: cms-tdd
description: TDD 사이클 실행기 및 TDD 워크플로우 가이드. 기능 구현 또는 버그 수정 시 Red->Green->Refactor 사이클을 단계별로 강제 실행한다. NestJS 백엔드와 Next.js 프론트엔드 모두에 대응한다. 테스트, TDD, 단위테스트, unit test 관련 작업 시 자동 활성화.
allowed-tools: Read, Write, Edit, Bash, Grep, Glob
---

# CMS TDD Cycle Enforcer

기능 구현 또는 버그 수정 시 TDD 사이클을 단계별로 강제 실행하는 행동 스킬.

**원칙:** 테스트 없는 코드는 완성이 아니다. 실패하지 않는 테스트는 신뢰할 수 없다.

## 테스트 파일 구조

### Backend (NestJS)
```
backend/src/
├── module-name/
│   ├── module-name.module.ts
│   ├── module-name.controller.ts
│   ├── module-name.controller.spec.ts  # 컨트롤러 테스트
│   ├── module-name.service.ts
│   ├── module-name.service.spec.ts     # 서비스 테스트
│   └── module-name.repository.ts
├── dto/
│   └── module-name.dto.ts             # DTO (중앙 집중)
```

### Frontend (Next.js)
```
frontend/src/
├── components/
│   ├── ComponentName/
│   │   ├── ComponentName.tsx
│   │   ├── ComponentName.test.tsx      # 컴포넌트 테스트
│   │   └── ComponentName.styles.ts
├── hooks/
│   ├── useHookName.ts
│   └── useHookName.test.ts             # 훅 테스트
```

## 1. RED - 실패하는 테스트 작성

**구현보다 테스트가 먼저다. 테스트가 실패해야 올바른 시작이다.**

작업 시작 시:
- 구현하려는 기능/수정하려는 버그에 대한 테스트를 먼저 작성한다.
- 테스트를 실행하여 실패(RED)를 확인한다.
- 실패 이유가 "아직 구현되지 않음"이어야 한다 (구문 오류가 아닌).

### Backend 테스트 템플릿 (NestJS + Jest)

```typescript
import { Test, TestingModule } from '@nestjs/testing';
import { [ServiceName] } from './[service-name].service';
import { [RepositoryName] } from './[service-name].repository';

describe('[ServiceName]', () => {
  let service: [ServiceName];
  let repository: [RepositoryName];

  const mockRepository = {
    // 필요한 메서드만 모킹
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        [ServiceName],
        { provide: [RepositoryName], useValue: mockRepository },
      ],
    }).compile();

    service = module.get<[ServiceName]>([ServiceName]);
    repository = module.get<[RepositoryName]>([RepositoryName]);
    jest.clearAllMocks();
  });

  describe('[methodName]', () => {
    it('should [expected behavior]', async () => {
      // Arrange
      mockRepository.[method].mockResolvedValue([mockData]);

      // Act
      const result = await service.[methodName]([params]);

      // Assert
      expect(result).toEqual([expectedResult]);
    });

    it('should throw [Exception] when [condition]', async () => {
      // Arrange
      mockRepository.[method].mockResolvedValue(null);

      // Act & Assert
      await expect(service.[methodName]([params]))
        .rejects.toThrow([ExpectedException]);
    });
  });
});
```

### Frontend 테스트 템플릿 (React Testing Library + Jest)

```typescript
import { render, screen, fireEvent } from '@testing-library/react';
import { [ComponentName] } from './[ComponentName]';

describe('[ComponentName]', () => {
  const defaultProps = {
    // 필수 props만 정의
  };

  it('should render [expected element]', () => {
    render(<[ComponentName] {...defaultProps} />);
    expect(screen.getByText('[expected text]')).toBeInTheDocument();
  });

  it('should [expected behavior] when [user action]', async () => {
    const mockHandler = jest.fn();
    render(<[ComponentName] {...defaultProps} onAction={mockHandler} />);

    fireEvent.click(screen.getByRole('button', { name: '[button text]' }));

    expect(mockHandler).toHaveBeenCalledWith([expectedArgs]);
  });
});
```

## 2. GREEN - 최소 구현

**테스트를 통과시키는 최소한의 코드만 작성한다.**

- 테스트를 통과시키기 위한 가장 단순한 구현을 작성한다.
- "나중에 필요할 것 같은" 코드를 미리 넣지 않는다.
- 하드코딩으로 통과시킬 수 있다면, 그것도 유효한 첫 번째 GREEN이다.
- 테스트를 실행하여 통과(GREEN)를 확인한다.

검증 체크리스트:
```
1. [테스트 실행] -> verify: 모든 테스트 GREEN
2. [기존 테스트] -> verify: 기존 테스트가 깨지지 않음
3. [빌드 확인] -> verify: npm run build 성공
```

## 3. REFACTOR - 개선

**동작을 변경하지 않고 구조를 개선한다.**

리팩토링 시:
- 테스트가 계속 통과하는 상태를 유지한다.
- 중복을 제거한다.
- 의도를 명확하게 하는 이름으로 변경한다.
- 불필요한 복잡성을 제거한다.

금지 사항:
- 리팩토링 중에 새 기능을 추가하지 않는다.
- 리팩토링 중에 새 테스트를 추가하지 않는다.
- 리팩토링 커밋과 기능 커밋을 혼합하지 않는다.

## 4. 반복

**다음 기능으로 이동하여 1번부터 반복한다.**

전체 사이클:
```
1. [테스트 작성] -> verify: RED (실패 확인)
2. [최소 구현] -> verify: GREEN (통과 확인)
3. [리팩토링] -> verify: GREEN 유지
4. [다음 기능] -> 1번으로
```

## 실행 규칙

- 한 번에 하나의 테스트만 작성한다. 한 번에 여러 테스트를 작성하지 않는다.
- 모킹은 직접 의존성만 한다. 간접 의존성은 모킹하지 않는다.
- 테스트 없이 코드 작성 금지. 테스트가 통과하지 않으면 커밋 금지.

## 테스트 네이밍 컨벤션

### 패턴
```
should + [expected behavior] + when + [condition]
```

### 예시
```typescript
it('should return empty array when no data exists', () => { });
it('should throw ValidationError when email is invalid', () => { });
it('should update user name when valid input provided', () => { });
it('should disable button when form is submitting', () => { });
```

## 테스트 실행 명령어

### Backend
```bash
# 특정 파일 테스트 (기본)
cd backend && npx jest [파일명] --verbose

# 모든 테스트 실행
cd backend && npm run test

# 워치 모드
npm run test:watch

# 커버리지 리포트
npm run test:cov

# E2E 테스트
npm run test:e2e
```

### Frontend
```bash
# 특정 파일 테스트 (기본)
cd frontend && npx jest [파일명] --verbose

# 모든 테스트 실행
cd frontend && npm run test

# 워치 모드
npm run test -- --watch
```

## 커밋 규칙

구조적 변경과 행동적 변경을 동일한 커밋에 혼합하지 않는다.

### 구조적 변경 커밋
```
refactor: [모듈명] 코드 구조 개선

- 메서드 추출: methodA -> methodA, helperMethod
- 변수명 변경: data -> userData
- 파일 분리: large.ts -> small1.ts, small2.ts
```

### 행동적 변경 커밋
```
feat: [모듈명] 새 기능 추가

- 사용자 검증 로직 추가
- 에러 핸들링 개선
```
