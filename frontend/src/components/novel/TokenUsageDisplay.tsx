'use client';

import styled from 'styled-components';
import { useAuthStore } from '@/src/stores/authStore';
import { DRAFT_COST } from '@/src/types/novel';

const DisplayWrapper = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  padding: 0.75rem 1rem;
  background-color: ${({ theme }) => theme.colors.muted};
  border-radius: ${({ theme }) => theme.radius.md};
`;

const Row = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-size: 0.8125rem;
`;

const Label = styled.span`
  color: ${({ theme }) => theme.colors.mutedForeground};
`;

const Value = styled.span<{ $warning?: boolean }>`
  font-weight: 600;
  color: ${({ $warning, theme }) =>
    $warning ? theme.colors.destructive : theme.colors.foreground};
`;

const WarningText = styled.p`
  font-size: 0.75rem;
  color: ${({ theme }) => theme.colors.destructive};
  margin: 0;
`;

export default function TokenUsageDisplay() {
  const tokenBalance = useAuthStore((s) => s.user?.tokenBalance ?? 0);
  const isInsufficient = tokenBalance < DRAFT_COST;

  return (
    <DisplayWrapper>
      <Row>
        <Label>1회 생성 비용</Label>
        <Value>{DRAFT_COST} 토큰</Value>
      </Row>
      <Row>
        <Label>보유 토큰</Label>
        <Value $warning={isInsufficient}>{tokenBalance.toLocaleString()} 토큰</Value>
      </Row>
      {isInsufficient && (
        <WarningText>
          토큰이 부족합니다. 충전 후 이용해주세요.
        </WarningText>
      )}
    </DisplayWrapper>
  );
}