export enum TransactionType {
  CHARGE = 'charge',
  PURCHASE = 'purchase',
  REVENUE = 'revenue',
  REFUND = 'refund',
  REWARD = 'reward',
  SETTLEMENT = 'settlement',
  AI_GENERATION = 'ai_generation',
}

export interface TokenPackage {
  id: string;
  price: number;
  baseTokens: number;
  bonusPercent: number;
  totalTokens: number;
  label: string;
}

export const TOKEN_PACKAGES: readonly TokenPackage[] = [
  { id: '10000', price: 10000, baseTokens: 10000, bonusPercent: 10, totalTokens: 11000, label: '10,000원' },
  { id: '50000', price: 50000, baseTokens: 50000, bonusPercent: 20, totalTokens: 60000, label: '50,000원' },
  { id: '100000', price: 100000, baseTokens: 100000, bonusPercent: 30, totalTokens: 130000, label: '100,000원' },
] as const;

export const AUTHOR_REVENUE_PERCENT = 80;
export const PLATFORM_FEE_PERCENT = 20;
export const WITHDRAWAL_RATE = 0.9;
export const MIN_WITHDRAWAL_TOKENS = 1000;

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
  packageId: string;
  idempotencyKey: string;
}

export interface PurchaseEpisodeRequest {
  episodeId: string;
}

export interface WithdrawTokensRequest {
  amount: number;
  idempotencyKey: string;
}

export const SUBSCRIPTION_TIERS = [
  { id: 'basic', name: '베이직', price: 5900, monthlyTokens: 70, description: '매월 70 토큰 지급' },
  { id: 'standard', name: '스탠다드', price: 9900, monthlyTokens: 130, description: '매월 130 토큰 + 구독자 선공개' },
  { id: 'premium', name: '프리미엄', price: 14900, monthlyTokens: 250, description: '매월 250 토큰 + 전 작품 무료 열람' },
] as const;
