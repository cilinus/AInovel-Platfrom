'use client';

import React, { useState } from 'react';
import styled from 'styled-components';
import Modal from '@/src/components/common/Modal';
import Button from '@/src/components/common/Button';
import { useAuthStore } from '@/src/stores/authStore';
import { usePayments } from '@/src/hooks/usePayments';

interface CashoutModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (balance: number) => void;
}

const FormGroup = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  margin-bottom: 1rem;
`;

const Label = styled.label`
  font-size: 0.875rem;
  font-weight: 500;
  color: ${({ theme }) => theme.colors.foreground};
`;

const AmountInput = styled.input`
  width: 100%;
  padding: 0.625rem 0.75rem;
  border: 1px solid ${({ theme }) => theme.colors.border};
  border-radius: ${({ theme }) => theme.radius.md};
  background-color: ${({ theme }) => theme.colors.background};
  color: ${({ theme }) => theme.colors.foreground};
  font-size: 1rem;
  box-sizing: border-box;

  &:focus {
    outline: none;
    border-color: ${({ theme }) => theme.colors.primary};
  }
`;

const InfoRow = styled.div`
  display: flex;
  justify-content: space-between;
  font-size: 0.875rem;
  color: ${({ theme }) => theme.colors.mutedForeground};
  margin-bottom: 0.5rem;
`;

const InfoValue = styled.span`
  font-weight: 600;
  color: ${({ theme }) => theme.colors.foreground};
`;

const CalcRow = styled.div`
  display: flex;
  justify-content: space-between;
  font-size: 0.9375rem;
  font-weight: 600;
  color: ${({ theme }) => theme.colors.accent};
  padding: 0.75rem;
  background-color: ${({ theme }) => theme.colors.muted};
  border-radius: ${({ theme }) => theme.radius.md};
  margin-bottom: 1rem;
`;

const ErrorText = styled.p`
  font-size: 0.8125rem;
  color: ${({ theme }) => theme.colors.destructive};
  margin: 0 0 0.75rem;
`;

const SuccessText = styled.p`
  font-size: 0.875rem;
  color: ${({ theme }) => theme.colors.success};
  text-align: center;
  padding: 1rem 0;
`;

export default function CashoutModal({ isOpen, onClose, onSuccess }: CashoutModalProps) {
  const user = useAuthStore((s) => s.user);
  const { withdrawTokens, loading, error } = usePayments();
  const [amount, setAmount] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  const numAmount = parseInt(amount, 10) || 0;
  const cashAmount = Math.floor(numAmount * 0.9);
  const balance = user?.tokenBalance ?? 0;
  const isValid = numAmount >= 1000 && numAmount <= balance;

  const handleWithdraw = async () => {
    if (!isValid) return;
    try {
      const result = await withdrawTokens(numAmount);
      setSuccessMsg(
        `${result.withdrawn.toLocaleString()} 토큰 출금 완료 (${result.cashAmountKRW.toLocaleString()}원)`,
      );
      onSuccess(result.balance);
      setAmount('');
    } catch {
      // error is set in hook
    }
  };

  const handleClose = () => {
    setSuccessMsg('');
    setAmount('');
    onClose();
  };

  return (
    <Modal isOpen={isOpen} onClose={handleClose} title="정산 신청">
      <InfoRow>
        <span>보유 토큰</span>
        <InfoValue>{balance.toLocaleString()} 토큰</InfoValue>
      </InfoRow>

      <FormGroup>
        <Label htmlFor="cashout-amount">출금 수량 (최소 1,000 토큰)</Label>
        <AmountInput
          id="cashout-amount"
          type="number"
          min={1000}
          max={balance}
          value={amount}
          onChange={(e) => {
            setSuccessMsg('');
            setAmount(e.target.value);
          }}
          placeholder="출금할 토큰 수량 입력"
        />
      </FormGroup>

      {numAmount > 0 && (
        <CalcRow>
          <span>예상 정산 금액</span>
          <span>{numAmount.toLocaleString()} x 0.9 = {cashAmount.toLocaleString()}원</span>
        </CalcRow>
      )}

      {error && <ErrorText>{error.message}</ErrorText>}
      {successMsg && <SuccessText>{successMsg}</SuccessText>}

      <Button
        variant="primary"
        size="md"
        onClick={handleWithdraw}
        disabled={!isValid || loading}
        style={{ width: '100%' }}
      >
        {loading ? '처리 중...' : '출금 신청'}
      </Button>
    </Modal>
  );
}