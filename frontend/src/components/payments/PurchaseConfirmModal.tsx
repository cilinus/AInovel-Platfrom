'use client';

import React, { useState } from 'react';
import styled from 'styled-components';
import Modal from '@/src/components/common/Modal';
import Button from '@/src/components/common/Button';
import ChargeModal from './ChargeModal';
import { usePayments } from '@/src/hooks/usePayments';

interface PurchaseConfirmModalProps {
  isOpen: boolean;
  onClose: () => void;
  episodeTitle: string;
  episodeNumber: number;
  episodePrice: number;
  episodeId: string;
  currentBalance: number;
  onPurchaseSuccess: (balance: number) => void;
}

const InfoSection = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  margin-bottom: 1.25rem;
  padding: 1rem;
  background-color: ${({ theme }) => theme.colors.muted};
  border-radius: ${({ theme }) => theme.radius.md};
`;

const InfoRow = styled.div`
  display: flex;
  justify-content: space-between;
  font-size: 0.875rem;
`;

const InfoLabel = styled.span`
  color: ${({ theme }) => theme.colors.mutedForeground};
`;

const InfoValue = styled.span`
  font-weight: 600;
  color: ${({ theme }) => theme.colors.foreground};
`;

const BalanceRow = styled.div`
  display: flex;
  justify-content: space-between;
  font-size: 0.875rem;
  margin-bottom: 1rem;
`;

const BalanceLabel = styled.span`
  color: ${({ theme }) => theme.colors.mutedForeground};
`;

const BalanceValue = styled.span<{ $insufficient: boolean }>`
  font-weight: 600;
  color: ${({ $insufficient, theme }) =>
    $insufficient ? theme.colors.destructive : theme.colors.accent};
`;

const WarningText = styled.p`
  font-size: 0.8125rem;
  color: ${({ theme }) => theme.colors.destructive};
  margin: 0 0 0.75rem;
  text-align: center;
`;

const ErrorText = styled.p`
  font-size: 0.8125rem;
  color: ${({ theme }) => theme.colors.destructive};
  margin: 0 0 0.75rem;
`;

const ButtonGroup = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
`;

export default function PurchaseConfirmModal({
  isOpen,
  onClose,
  episodeTitle,
  episodeNumber,
  episodePrice,
  episodeId,
  currentBalance,
  onPurchaseSuccess,
}: PurchaseConfirmModalProps) {
  const { purchaseEpisode, loading, error } = usePayments();
  const [chargeOpen, setChargeOpen] = useState(false);
  const [balance, setBalance] = useState(currentBalance);

  const insufficient = balance < episodePrice;

  const handlePurchase = async () => {
    if (insufficient) return;
    try {
      const result = await purchaseEpisode(episodeId);
      onPurchaseSuccess(result.balance);
      onClose();
    } catch {
      // error is set in hook
    }
  };

  const handleChargeSuccess = (newBalance: number) => {
    setBalance(newBalance);
  };

  return (
    <>
      <Modal isOpen={isOpen} onClose={onClose} title="에피소드 구매">
        <InfoSection>
          <InfoRow>
            <InfoLabel>에피소드</InfoLabel>
            <InfoValue>{episodeNumber}화: {episodeTitle}</InfoValue>
          </InfoRow>
          <InfoRow>
            <InfoLabel>가격</InfoLabel>
            <InfoValue>{episodePrice} 토큰</InfoValue>
          </InfoRow>
        </InfoSection>

        <BalanceRow>
          <BalanceLabel>현재 잔액</BalanceLabel>
          <BalanceValue $insufficient={insufficient}>
            {balance.toLocaleString()} 토큰
          </BalanceValue>
        </BalanceRow>

        {insufficient && (
          <WarningText>잔액이 부족합니다. 충전 후 다시 시도해주세요.</WarningText>
        )}

        {error && <ErrorText>{error.message}</ErrorText>}

        <ButtonGroup>
          {insufficient ? (
            <Button
              variant="primary"
              size="md"
              onClick={() => setChargeOpen(true)}
              style={{ width: '100%' }}
            >
              충전하기
            </Button>
          ) : (
            <Button
              variant="primary"
              size="md"
              onClick={handlePurchase}
              disabled={loading}
              style={{ width: '100%' }}
            >
              {loading ? '처리 중...' : '구매하기'}
            </Button>
          )}
        </ButtonGroup>
      </Modal>

      <ChargeModal
        isOpen={chargeOpen}
        onClose={() => setChargeOpen(false)}
        onSuccess={handleChargeSuccess}
      />
    </>
  );
}