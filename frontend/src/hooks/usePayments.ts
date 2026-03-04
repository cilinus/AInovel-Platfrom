'use client';

import { useState, useCallback } from 'react';
import { apiClient } from '../lib/api';

interface TokenPackage {
  id: string;
  price: number;
  baseTokens: number;
  bonusPercent: number;
  totalTokens: number;
  label: string;
}

interface ChargeResult {
  balance: number;
  charged: number;
}

interface PurchaseResult {
  balance: number;
}

interface WithdrawResult {
  balance: number;
  krwBalance: number;
  withdrawn: number;
  cashAmountKRW: number;
}

export interface EarningsSummaryItem {
  period: string;
  totalAmount: number;
  count: number;
}

interface AuthorEarnings {
  totalEarned: number;
  totalWithdrawn: number;
  todayEarned: number;
  yesterdayEarned: number;
  todayWithdrawnTokens: number;
  yesterdayWithdrawnTokens: number;
  tokenBalance: number;
  krwBalance: number;
  withdrawalRate: number;
  recentTransactions: Array<{
    _id: string;
    type: string;
    amount: number;
    balanceAfter: number;
    description?: string;
    createdAt: string;
  }>;
}

function generateUUID(): string {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID();
  }
  // Fallback for environments without crypto.randomUUID
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

export function usePayments() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const chargeTokens = useCallback(async (packageId: string): Promise<ChargeResult> => {
    setLoading(true);
    setError(null);
    try {
      const result = await apiClient.post<ChargeResult>('/payments/charge', {
        packageId,
        idempotencyKey: generateUUID(),
      });
      return result;
    } catch (e) {
      setError(e as Error);
      throw e;
    } finally {
      setLoading(false);
    }
  }, []);

  const purchaseEpisode = useCallback(async (episodeId: string): Promise<PurchaseResult> => {
    setLoading(true);
    setError(null);
    try {
      const result = await apiClient.post<PurchaseResult>('/payments/purchase', { episodeId });
      return result;
    } catch (e) {
      setError(e as Error);
      throw e;
    } finally {
      setLoading(false);
    }
  }, []);

  const withdrawTokens = useCallback(async (amount: number): Promise<WithdrawResult> => {
    setLoading(true);
    setError(null);
    try {
      const result = await apiClient.post<WithdrawResult>('/payments/withdraw', {
        amount,
        idempotencyKey: generateUUID(),
      });
      return result;
    } catch (e) {
      setError(e as Error);
      throw e;
    } finally {
      setLoading(false);
    }
  }, []);

  const getPackages = useCallback(async (): Promise<TokenPackage[]> => {
    return apiClient.get<TokenPackage[]>('/payments/packages');
  }, []);

  const getAuthorEarnings = useCallback(async (): Promise<AuthorEarnings> => {
    return apiClient.get<AuthorEarnings>('/payments/author/earnings');
  }, []);

  const getEarningsSummary = useCallback(
    async (
      groupBy: 'daily' | 'hourly',
      startDate?: string,
      endDate?: string,
    ): Promise<EarningsSummaryItem[]> => {
      const params: Record<string, string> = { groupBy };
      if (startDate) params.startDate = startDate;
      if (endDate) params.endDate = endDate;
      return apiClient.get<EarningsSummaryItem[]>(
        '/payments/author/earnings-summary',
        params,
      );
    },
    [],
  );

  const checkPurchase = useCallback(async (episodeId: string): Promise<boolean> => {
    const result = await apiClient.get<{ purchased: boolean }>(`/payments/check-purchase/${episodeId}`);
    return result.purchased;
  }, []);

  const getPurchasedEpisodeIds = useCallback(async (workId: string): Promise<string[]> => {
    const result = await apiClient.get<{ episodeIds: string[] }>('/payments/purchased-episodes', { workId });
    return result.episodeIds;
  }, []);

  return {
    loading,
    error,
    chargeTokens,
    purchaseEpisode,
    withdrawTokens,
    getPackages,
    getAuthorEarnings,
    getEarningsSummary,
    checkPurchase,
    getPurchasedEpisodeIds,
  };
}