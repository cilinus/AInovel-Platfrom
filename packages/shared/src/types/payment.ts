export enum TransactionType {
  CHARGE = 'CHARGE',
  PURCHASE = 'PURCHASE',
  BONUS = 'BONUS',
  REFUND = 'REFUND',
  SETTLEMENT = 'SETTLEMENT',
  EXPIRED = 'EXPIRED',
}

export interface TokenTransaction {
  id: string;
  userId: string;
  amount: number;
  type: TransactionType;
  balanceAfter: number;
  description?: string;
  relatedEpisodeId?: string;
  paymentInfo?: {
    pgProvider: string;
    paymentKey: string;
    orderId: string;
    amount: number;
    method: string;
  };
  createdAt: string;
}

export interface ChargeTokenRequest {
  amount: number; // 충전할 토큰 수
  paymentKey: string; // 토스페이먼츠 결제키
  orderId: string;
}

export interface PurchaseEpisodeRequest {
  episodeId: string;
}

export const TOKEN_PACKAGES = [
  { tokens: 10, price: 1000, label: '10 토큰' },
  { tokens: 50, price: 4500, label: '50 토큰', discount: '10%' },
  { tokens: 100, price: 8000, label: '100 토큰', discount: '20%' },
  { tokens: 300, price: 21000, label: '300 토큰', discount: '30%' },
] as const;

export const SUBSCRIPTION_TIERS = [
  { id: 'basic', name: '베이직', price: 5900, monthlyTokens: 70, description: '매월 70 토큰 지급' },
  { id: 'standard', name: '스탠다드', price: 9900, monthlyTokens: 130, description: '매월 130 토큰 + 구독자 선공개' },
  { id: 'premium', name: '프리미엄', price: 14900, monthlyTokens: 250, description: '매월 250 토큰 + 전 작품 무료 열람' },
] as const;
