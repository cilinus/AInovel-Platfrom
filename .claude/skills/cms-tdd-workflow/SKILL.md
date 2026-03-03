---
name: cms-tdd-workflow
description: TDD(Test-Driven Development) 워크플로우를 지원합니다. Red-Green-Refactor 사이클, 테스트 작성, Clean First 접근법에 사용합니다. 테스트, TDD, 단위테스트, unit test 관련 작업 시 자동 활성화됩니다.
allowed-tools: Read, Write, Edit, Bash, Grep, Glob
---

# CMS-UI TDD 워크플로우 Skill

## 개요
Test-Driven Development 방법론을 따르는 개발 워크플로우 가이드입니다.

## TDD 핵심 원칙

### Red-Green-Refactor 사이클
```
1. 🔴 RED: 실패하는 테스트 작성
2. 🟢 GREEN: 테스트를 통과하는 최소 코드 작성
3. 🔵 REFACTOR: 코드 개선 (테스트 통과 유지)
```

### Clean First 접근법
- **구조적 변경**: 동작을 변경하지 않고 코드 재배열
- **행동적 변경**: 실제 기능 추가 또는 수정
- ⚠️ **중요**: 동일한 커밋에서 구조적/행동적 변경 혼합 금지

## 테스트 파일 구조

### Backend (NestJS)
```
backend/src/
├── module-name/
│   ├── module-name.controller.ts
│   ├── module-name.controller.spec.ts  # 컨트롤러 테스트
│   ├── module-name.service.ts
│   ├── module-name.service.spec.ts     # 서비스 테스트
│   └── dto/
│       ├── create-module-name.dto.ts
│       └── create-module-name.dto.spec.ts
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

## 테스트 작성 템플릿

### NestJS Service 테스트
```typescript
import { Test, TestingModule } from '@nestjs/testing';
import { ModuleNameService } from './module-name.service';

describe('ModuleNameService', () => {
  let service: ModuleNameService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [ModuleNameService],
    }).compile();

    service = module.get<ModuleNameService>(ModuleNameService);
  });

  describe('methodName', () => {
    it('should do something when condition is met', () => {
      // Arrange (준비)
      const input = { /* 테스트 데이터 */ };
      const expected = { /* 기대 결과 */ };

      // Act (실행)
      const result = service.methodName(input);

      // Assert (검증)
      expect(result).toEqual(expected);
    });

    it('should throw error when invalid input', () => {
      // Arrange
      const invalidInput = null;

      // Act & Assert
      expect(() => service.methodName(invalidInput))
        .toThrow('Expected error message');
    });
  });
});
```

### React Component 테스트
```typescript
import { render, screen, fireEvent } from '@testing-library/react';
import { ComponentName } from './ComponentName';

describe('ComponentName', () => {
  it('should render correctly', () => {
    // Arrange & Act
    render(<ComponentName />);

    // Assert
    expect(screen.getByRole('button')).toBeInTheDocument();
  });

  it('should handle click event', () => {
    // Arrange
    const handleClick = jest.fn();
    render(<ComponentName onClick={handleClick} />);

    // Act
    fireEvent.click(screen.getByRole('button'));

    // Assert
    expect(handleClick).toHaveBeenCalledTimes(1);
  });

  it('should display error state', () => {
    // Arrange & Act
    render(<ComponentName error="Error message" />);

    // Assert
    expect(screen.getByText('Error message')).toBeInTheDocument();
  });
});
```

## 테스트 실행 명령어

### Backend
```bash
# 모든 테스트 실행
cd backend && npm run test

# 특정 파일 테스트
npm run test -- module-name.service.spec.ts

# 워치 모드
npm run test:watch

# 커버리지 리포트
npm run test:cov

# E2E 테스트
npm run test:e2e
```

### Frontend
```bash
# 모든 테스트 실행
cd frontend && npm run test

# 특정 파일 테스트
npm run test -- ComponentName.test.tsx

# 워치 모드
npm run test -- --watch
```

## TDD 워크플로우 체크리스트

### 새 기능 개발 시
- [ ] 기능의 가장 작은 단위 정의
- [ ] 실패하는 테스트 작성 (RED)
- [ ] 테스트 실행하여 실패 확인
- [ ] 최소 코드로 테스트 통과 (GREEN)
- [ ] 테스트 실행하여 통과 확인
- [ ] 코드 리팩토링 (REFACTOR)
- [ ] 테스트 실행하여 여전히 통과 확인
- [ ] 다음 작은 단위로 반복

### 버그 수정 시
- [ ] 버그를 재현하는 테스트 작성
- [ ] 테스트 실패 확인
- [ ] 버그 수정
- [ ] 테스트 통과 확인
- [ ] 회귀 테스트 추가 고려

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

## 커밋 규칙

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

## 주의사항

1. **테스트 없이 코드 작성 금지**
2. **실패하는 테스트 없이 코드 수정 금지**
3. **테스트가 통과하지 않으면 커밋 금지**
4. **구조적/행동적 변경 혼합 금지**
5. **한 번에 하나의 테스트만 작성**
