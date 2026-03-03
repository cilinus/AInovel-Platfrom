---
name: cms-react-component
description: React 컴포넌트, 훅, 스토어 생성을 지원합니다. 프론트엔드 컴포넌트 개발, UI 구현에 사용합니다. component, React, 컴포넌트, UI, hook, store, Zustand 관련 작업 시 자동 활성화됩니다.
allowed-tools: Read, Write, Edit, Bash, Grep, Glob
---

# CMS-UI React 컴포넌트 생성 Skill

## 개요
Next.js/React 프론트엔드 컴포넌트 생성을 위한 템플릿과 가이드입니다.

## 컴포넌트 구조
```
frontend/src/components/
├── ComponentName/
│   ├── index.ts              # 공개 API (export)
│   ├── ComponentName.tsx     # 메인 컴포넌트
│   ├── ComponentName.styles.ts  # styled-components
│   ├── ComponentName.test.tsx   # 테스트
│   └── ComponentName.types.ts   # 타입 정의
```

## 컴포넌트 템플릿

### 1. 메인 컴포넌트
```typescript
// ComponentName.tsx
'use client';

import React, { useState, useCallback, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import * as S from './ComponentName.styles';
import { ComponentNameProps } from './ComponentName.types';

/**
 * ComponentName 컴포넌트
 * @description 컴포넌트 설명
 * @param {ComponentNameProps} props - 컴포넌트 속성
 */
export const ComponentName: React.FC<ComponentNameProps> = ({
  title,
  data,
  onAction,
  isLoading = false,
  className,
}) => {
  const { t } = useTranslation('common');

  // 상태 관리
  const [isOpen, setIsOpen] = useState(false);

  // 메모이제이션된 값
  const processedData = useMemo(() => {
    return data?.filter(item => item.active) ?? [];
  }, [data]);

  // 이벤트 핸들러
  const handleClick = useCallback(() => {
    setIsOpen(prev => !prev);
    onAction?.();
  }, [onAction]);

  // 로딩 상태 처리
  if (isLoading) {
    return (
      <S.Container className={className}>
        <S.LoadingSpinner />
      </S.Container>
    );
  }

  return (
    <S.Container className={className}>
      <S.Header>
        <S.Title>{title}</S.Title>
        <S.ActionButton onClick={handleClick}>
          {t('buttons.action')}
        </S.ActionButton>
      </S.Header>

      <S.Content isOpen={isOpen}>
        {processedData.length > 0 ? (
          processedData.map(item => (
            <S.Item key={item.id}>
              {item.name}
            </S.Item>
          ))
        ) : (
          <S.EmptyMessage>{t('messages.noData')}</S.EmptyMessage>
        )}
      </S.Content>
    </S.Container>
  );
};

export default ComponentName;
```

### 2. 스타일 파일
```typescript
// ComponentName.styles.ts
import styled, { css, keyframes } from 'styled-components';

// 애니메이션 정의
const fadeIn = keyframes`
  from { opacity: 0; transform: translateY(-10px); }
  to { opacity: 1; transform: translateY(0); }
`;

const spin = keyframes`
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
`;

// 컨테이너
export const Container = styled.div`
  display: flex;
  flex-direction: column;
  padding: 16px;
  background-color: #ffffff;
  border-radius: 8px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
`;

// 헤더
export const Header = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
`;

// 제목
export const Title = styled.h2`
  font-size: 18px;
  font-weight: 600;
  color: #333333;
  margin: 0;
`;

// 액션 버튼
export const ActionButton = styled.button`
  padding: 8px 16px;
  background-color: #0066cc;
  color: #ffffff;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-size: 14px;
  transition: background-color 0.2s;

  &:hover {
    background-color: #0052a3;
  }

  &:disabled {
    background-color: #cccccc;
    cursor: not-allowed;
  }
`;

// 콘텐츠 영역
interface ContentProps {
  isOpen: boolean;
}

export const Content = styled.div<ContentProps>`
  display: ${({ isOpen }) => (isOpen ? 'block' : 'none')};
  animation: ${fadeIn} 0.3s ease-in-out;
`;

// 항목
export const Item = styled.div`
  padding: 12px;
  border-bottom: 1px solid #eeeeee;

  &:last-child {
    border-bottom: none;
  }

  &:hover {
    background-color: #f5f5f5;
  }
`;

// 빈 상태 메시지
export const EmptyMessage = styled.p`
  text-align: center;
  color: #999999;
  padding: 24px;
`;

// 로딩 스피너
export const LoadingSpinner = styled.div`
  width: 40px;
  height: 40px;
  border: 3px solid #eeeeee;
  border-top-color: #0066cc;
  border-radius: 50%;
  margin: 24px auto;
  animation: ${spin} 0.8s linear infinite;
`;
```

### 3. 타입 정의
```typescript
// ComponentName.types.ts

export interface DataItem {
  id: number;
  name: string;
  active: boolean;
}

export interface ComponentNameProps {
  /** 컴포넌트 제목 */
  title: string;
  /** 표시할 데이터 배열 */
  data?: DataItem[];
  /** 액션 버튼 클릭 핸들러 */
  onAction?: () => void;
  /** 로딩 상태 */
  isLoading?: boolean;
  /** 추가 CSS 클래스 */
  className?: string;
}
```

### 4. Index 파일
```typescript
// index.ts
export { ComponentName, default } from './ComponentName';
export type { ComponentNameProps, DataItem } from './ComponentName.types';
```

## Custom Hook 템플릿

```typescript
// hooks/useModuleName.ts
import { useState, useEffect, useCallback } from 'react';
import axios from 'axios';

interface UseModuleNameOptions {
  initialData?: DataType[];
  autoFetch?: boolean;
}

interface UseModuleNameReturn {
  data: DataType[];
  isLoading: boolean;
  error: Error | null;
  refetch: () => Promise<void>;
  create: (input: CreateInput) => Promise<void>;
  update: (id: number, input: UpdateInput) => Promise<void>;
  remove: (id: number) => Promise<void>;
}

export const useModuleName = (
  options: UseModuleNameOptions = {}
): UseModuleNameReturn => {
  const { initialData = [], autoFetch = true } = options;

  const [data, setData] = useState<DataType[]>(initialData);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  // 데이터 조회
  const refetch = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await axios.get('/api/module-name');
      setData(response.data);
    } catch (err) {
      setError(err as Error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // 생성
  const create = useCallback(async (input: CreateInput) => {
    setIsLoading(true);
    try {
      await axios.post('/api/module-name', input);
      await refetch();
    } catch (err) {
      setError(err as Error);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, [refetch]);

  // 수정
  const update = useCallback(async (id: number, input: UpdateInput) => {
    setIsLoading(true);
    try {
      await axios.put(`/api/module-name/${id}`, input);
      await refetch();
    } catch (err) {
      setError(err as Error);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, [refetch]);

  // 삭제
  const remove = useCallback(async (id: number) => {
    setIsLoading(true);
    try {
      await axios.delete(`/api/module-name/${id}`);
      await refetch();
    } catch (err) {
      setError(err as Error);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, [refetch]);

  // 자동 fetch
  useEffect(() => {
    if (autoFetch) {
      refetch();
    }
  }, [autoFetch, refetch]);

  return {
    data,
    isLoading,
    error,
    refetch,
    create,
    update,
    remove,
  };
};
```

## Zustand Store 템플릿

```typescript
// stores/moduleNameStore.ts
import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import axios from 'axios';

interface DataType {
  id: number;
  name: string;
}

interface ModuleNameState {
  // 상태
  data: DataType[];
  selectedItem: DataType | null;
  isLoading: boolean;
  error: string | null;

  // 액션
  fetchData: () => Promise<void>;
  selectItem: (item: DataType | null) => void;
  createItem: (input: Partial<DataType>) => Promise<void>;
  updateItem: (id: number, input: Partial<DataType>) => Promise<void>;
  deleteItem: (id: number) => Promise<void>;
  reset: () => void;
}

const initialState = {
  data: [],
  selectedItem: null,
  isLoading: false,
  error: null,
};

export const useModuleNameStore = create<ModuleNameState>()(
  persist(
    (set, get) => ({
      ...initialState,

      fetchData: async () => {
        set({ isLoading: true, error: null });
        try {
          const response = await axios.get('/api/module-name');
          set({ data: response.data, isLoading: false });
        } catch (error) {
          set({
            error: error instanceof Error ? error.message : '데이터 조회 실패',
            isLoading: false
          });
        }
      },

      selectItem: (item) => {
        set({ selectedItem: item });
      },

      createItem: async (input) => {
        set({ isLoading: true, error: null });
        try {
          await axios.post('/api/module-name', input);
          await get().fetchData();
        } catch (error) {
          set({
            error: error instanceof Error ? error.message : '생성 실패',
            isLoading: false
          });
          throw error;
        }
      },

      updateItem: async (id, input) => {
        set({ isLoading: true, error: null });
        try {
          await axios.put(`/api/module-name/${id}`, input);
          await get().fetchData();
        } catch (error) {
          set({
            error: error instanceof Error ? error.message : '수정 실패',
            isLoading: false
          });
          throw error;
        }
      },

      deleteItem: async (id) => {
        set({ isLoading: true, error: null });
        try {
          await axios.delete(`/api/module-name/${id}`);
          await get().fetchData();
        } catch (error) {
          set({
            error: error instanceof Error ? error.message : '삭제 실패',
            isLoading: false
          });
          throw error;
        }
      },

      reset: () => {
        set(initialState);
      },
    }),
    {
      name: 'module-name-storage',
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({
        selectedItem: state.selectedItem,
      }),
    }
  )
);
```

## 체크리스트

### 컴포넌트 생성 시
- [ ] 컴포넌트 폴더 생성
- [ ] index.ts (export) 작성
- [ ] ComponentName.tsx 작성
- [ ] ComponentName.styles.ts 작성
- [ ] ComponentName.types.ts 작성
- [ ] ComponentName.test.tsx 작성
- [ ] 'use client' 지시문 추가 (필요시)
- [ ] useTranslation 훅 사용 (다국어)
- [ ] 접근성 속성 추가 (aria-*)
- [ ] 반응형 스타일 적용

### Hook 생성 시
- [ ] 타입 정의
- [ ] 상태 관리 (useState)
- [ ] 사이드 이펙트 처리 (useEffect)
- [ ] 메모이제이션 (useCallback, useMemo)
- [ ] 에러 핸들링
- [ ] 로딩 상태 관리
