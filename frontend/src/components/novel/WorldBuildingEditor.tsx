'use client';

import styled from 'styled-components';

const Wrapper = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
`;

const SectionLabel = styled.h3`
  font-size: 0.9375rem;
  font-weight: 600;
  color: ${({ theme }) => theme.colors.foreground};
  margin: 0;
`;

const StyledTextarea = styled.textarea`
  width: 100%;
  min-height: 150px;
  padding: 0.75rem;
  font-size: 0.875rem;
  line-height: 1.6;
  border: 1px solid ${({ theme }) => theme.colors.border};
  border-radius: ${({ theme }) => theme.radius.md};
  background-color: ${({ theme }) => theme.colors.background};
  color: ${({ theme }) => theme.colors.foreground};
  resize: vertical;
  outline: none;
  font-family: inherit;
  box-sizing: border-box;

  &:focus {
    border-color: ${({ theme }) => theme.colors.primary};
    box-shadow: 0 0 0 3px ${({ theme }) => theme.colors.primary}20;
  }
`;

interface WorldBuildingEditorProps {
  worldBuilding: string;
  onUpdate: (worldBuilding: string) => void;
}

export default function WorldBuildingEditor({ worldBuilding, onUpdate }: WorldBuildingEditorProps) {
  return (
    <Wrapper>
      <SectionLabel>세계관 설정</SectionLabel>
      <StyledTextarea
        value={worldBuilding}
        onChange={(e) => onUpdate(e.target.value)}
        placeholder="소설의 세계관을 설명해주세요. (시대 배경, 마법 체계, 사회 구조 등)"
      />
    </Wrapper>
  );
}