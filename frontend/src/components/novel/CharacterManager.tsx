'use client';

import { useState } from 'react';
import styled from 'styled-components';
import Button from '@/src/components/common/Button';

const Wrapper = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
`;

const SectionLabel = styled.h3`
  font-size: 0.9375rem;
  font-weight: 600;
  color: ${({ theme }) => theme.colors.foreground};
  margin: 0;
`;

const CharacterList = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
`;

const CharacterCard = styled.div`
  display: inline-flex;
  align-items: center;
  gap: 0.375rem;
  padding: 0.375rem 0.625rem;
  border: 1px solid ${({ theme }) => theme.colors.border};
  border-radius: ${({ theme }) => theme.radius.md};
  background-color: ${({ theme }) => theme.colors.card};
  font-size: 0.8125rem;
  color: ${({ theme }) => theme.colors.foreground};
`;

const RemoveButton = styled.button`
  background: none;
  border: none;
  font-size: 0.875rem;
  color: ${({ theme }) => theme.colors.mutedForeground};
  cursor: pointer;
  padding: 0;
  line-height: 1;

  &:hover {
    color: ${({ theme }) => theme.colors.destructive};
  }
`;

const AddRow = styled.div`
  display: flex;
  gap: 0.5rem;
`;

const AddInput = styled.input`
  flex: 1;
  padding: 0.375rem 0.625rem;
  font-size: 0.8125rem;
  border: 1px solid ${({ theme }) => theme.colors.border};
  border-radius: ${({ theme }) => theme.radius.md};
  background-color: ${({ theme }) => theme.colors.background};
  color: ${({ theme }) => theme.colors.foreground};
  outline: none;

  &:focus {
    border-color: ${({ theme }) => theme.colors.primary};
  }
`;

const EmptyText = styled.p`
  font-size: 0.8125rem;
  color: ${({ theme }) => theme.colors.mutedForeground};
  margin: 0;
`;

interface CharacterManagerProps {
  characters: string[];
  onUpdate: (characters: string[]) => void;
}

export default function CharacterManager({ characters, onUpdate }: CharacterManagerProps) {
  const [inputValue, setInputValue] = useState('');

  const handleAdd = () => {
    const name = inputValue.trim();
    if (!name || characters.includes(name)) return;
    onUpdate([...characters, name]);
    setInputValue('');
  };

  const handleRemove = (index: number) => {
    onUpdate(characters.filter((_, i) => i !== index));
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleAdd();
    }
  };

  return (
    <Wrapper>
      <SectionLabel>등장인물</SectionLabel>

      {characters.length === 0 ? (
        <EmptyText>등록된 등장인물이 없습니다.</EmptyText>
      ) : (
        <CharacterList>
          {characters.map((name, idx) => (
            <CharacterCard key={idx}>
              <span>{name}</span>
              <RemoveButton
                type="button"
                onClick={() => handleRemove(idx)}
                aria-label={`${name} 삭제`}
              >
                &times;
              </RemoveButton>
            </CharacterCard>
          ))}
        </CharacterList>
      )}

      <AddRow>
        <AddInput
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="인물 이름 입력"
        />
        <Button
          variant="outline"
          size="sm"
          onClick={handleAdd}
          disabled={!inputValue.trim()}
        >
          추가
        </Button>
      </AddRow>
    </Wrapper>
  );
}