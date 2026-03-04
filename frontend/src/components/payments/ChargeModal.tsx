'use client';

import React, { useState } from 'react';
import styled from 'styled-components';
import Modal from '@/src/components/common/Modal';
import Button from '@/src/components/common/Button';
import { usePayments } from '@/src/hooks/usePayments';

interface ChargeModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (balance: number) => void;
}

const PACKAGES = [
  { id: '10000', price: 10000, baseTokens: 10000, bonusPercent: 10, totalTokens: 11000 },
  { id: '50000', price: 50000, baseTokens: 50000, bonusPercent: 20, totalTokens: 60000 },
  { id: '100000', price: 100000, baseTokens: 100000, bonusPercent: 30, totalTokens: 130000 },
];

const PackageGrid = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
  margin-bottom: 1.25rem;
`;

const PackageCard = styled.button<{ $selected: boolean }>`
  display: flex;
  flex-direction: column;
  gap: 0.375rem;
  padding: 1rem;
  border: 2px solid ${({ $selected, theme }) =>
    $selected ? theme.colors.primary : theme.colors.border};
  border-radius: ${({ theme }) => theme.radius.md};
  background-color: ${({ $selected, theme }) =>
    $selected ? `${theme.colors.primary}08` : theme.colors.card};
  cursor: pointer;
  text-align: left;
  transition: border-color 0.15s, background-color 0.15s;

  &:hover {
    border-color: ${({ theme }) => theme.colors.primary};
  }
`;

const PackagePrice = styled.span`
  font-size: 1.125rem;
  font-weight: 700;
  color: ${({ theme }) => theme.colors.foreground};
`;

const PackageDetail = styled.span`
  font-size: 0.8125rem;
  color: ${({ theme }) => theme.colors.mutedForeground};
`;

const PackageTotal = styled.span`
  font-size: 0.9375rem;
  font-weight: 600;
  color: ${({ theme }) => theme.colors.accent};
`;

const ErrorText = styled.p`
  font-size: 0.8125rem;
  color: ${({ theme }) => theme.colors.destructive};
  margin: 0 0 0.75rem;
`;

export default function ChargeModal({ isOpen, onClose, onSuccess }: ChargeModalProps) {
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const { chargeTokens, loading, error } = usePayments();

  const handleCharge = async () => {
    if (!selectedId) return;
    try {
      const result = await chargeTokens(selectedId);
      onSuccess(result.balance);
      onClose();
    } catch {
      // error is set in hook
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="토큰 충전">
      <PackageGrid>
        {PACKAGES.map((pkg) => (
          <PackageCard
            key={pkg.id}
            type="button"
            $selected={selectedId === pkg.id}
            onClick={() => setSelectedId(pkg.id)}
          >
            <PackagePrice>{pkg.price.toLocaleString()}원</PackagePrice>
            <PackageDetail>
              기본 {pkg.baseTokens.toLocaleString()} + 보너스 {pkg.bonusPercent}%
            </PackageDetail>
            <PackageTotal>
              총 {pkg.totalTokens.toLocaleString()} 토큰
            </PackageTotal>
          </PackageCard>
        ))}
      </PackageGrid>

      {error && <ErrorText>{error.message}</ErrorText>}

      <Button
        variant="primary"
        size="md"
        onClick={handleCharge}
        disabled={!selectedId || loading}
        style={{ width: '100%' }}
      >
        {loading ? '처리 중...' : '충전하기'}
      </Button>
    </Modal>
  );
}