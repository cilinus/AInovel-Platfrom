# 결제 및 토큰 시스템 설계서

## 1. 토큰 이코노미

| 항목 | 값 |
|------|-----|
| 1 토큰 | ₩100 |
| 최소 충전 금액 | ₩1,000 (10 토큰) |
| 최대 충전 금액 | ₩500,000 (5,000 토큰) |
| 충전 단위 | ₩100 단위 (1 토큰 단위) |
| 에피소드 가격 범위 | 0~100 토큰 (무료~₩10,000) |
| 일반 에피소드 가격 | 2~3 토큰 (₩200~₩300) |

### 구독 플랜

| 플랜 | 월 가격 | 포함 토큰 | 추가 혜택 |
|------|---------|-----------|-----------|
| Basic | ₩5,900 | 70 토큰 | 광고 제거 |
| Standard | ₩9,900 | 130 토큰 | 광고 제거 + AI 생성 5회/월 |
| Premium | ₩14,900 | 220 토큰 | 광고 제거 + AI 생성 무제한 + 조기 열람 |

---

## 2. Mongoose 스키마

### Transaction (거래 내역)

```typescript
// src/modules/payment/schemas/transaction.schema.ts
export enum TransactionType {
  CHARGE = 'CHARGE',           // 토큰 충전
  PURCHASE = 'PURCHASE',       // 에피소드 구매
  SUBSCRIPTION = 'SUBSCRIPTION', // 구독 결제
  REFUND = 'REFUND',           // 환불
  BONUS = 'BONUS',             // 보너스 지급
  SETTLEMENT = 'SETTLEMENT',   // 작가 정산
}

export enum TransactionStatus {
  PENDING = 'PENDING',
  COMPLETED = 'COMPLETED',
  FAILED = 'FAILED',
  CANCELLED = 'CANCELLED',
}

@modelOptions({
  schemaOptions: {
    timestamps: true,
    collection: 'transactions',
  },
})
export class Transaction {
  _id: Types.ObjectId;

  @prop({ required: true, ref: () => User, index: true })
  userId: Ref<User>;

  @prop({ required: true, enum: TransactionType })
  type: TransactionType;

  @prop({ required: true, enum: TransactionStatus, default: TransactionStatus.PENDING })
  status: TransactionStatus;

  @prop({ required: true })
  tokenAmount: number;           // 토큰 수량 (충전: +, 구매: -)

  @prop()
  krwAmount?: number;            // 원화 금액 (PG 결제 시)

  @prop()
  orderId?: string;              // 토스페이먼츠 주문 ID

  @prop()
  paymentKey?: string;           // 토스페이먼츠 결제 키

  @prop({ ref: () => Episode })
  episodeId?: Ref<Episode>;      // 에피소드 구매 시

  @prop({ ref: () => Work })
  workId?: Ref<Work>;

  @prop()
  description: string;           // "70 토큰 충전", "작품명 3화 구매"

  @prop()
  failReason?: string;

  @prop()
  refundedAt?: Date;
}
```

### Wallet (지갑 - User 내장)

```typescript
// User 스키마 내 tokenBalance 필드 사용
// 별도 Wallet 컬렉션 대신 User.tokenBalance를 MongoDB 트랜잭션으로 원자적 업데이트

// 구매 기록 (빠른 조회용)
@modelOptions({ schemaOptions: { timestamps: true, collection: 'purchases' } })
export class Purchase {
  @prop({ required: true, ref: () => User, index: true })
  userId: Ref<User>;

  @prop({ required: true, ref: () => Episode, index: true })
  episodeId: Ref<Episode>;

  @prop({ required: true, ref: () => Work })
  workId: Ref<Work>;

  @prop({ required: true })
  tokenPrice: number;

  @prop({ required: true, ref: () => Transaction })
  transactionId: Ref<Transaction>;
}
// 복합 유니크 인덱스: { userId, episodeId } - 중복 구매 방지
```

### Settlement (정산)

```typescript
@modelOptions({ schemaOptions: { timestamps: true, collection: 'settlements' } })
export class Settlement {
  @prop({ required: true, ref: () => User, index: true })
  authorId: Ref<User>;

  @prop({ required: true })
  periodStart: Date;             // 정산 기간 시작

  @prop({ required: true })
  periodEnd: Date;               // 정산 기간 종료

  @prop({ required: true })
  totalSalesTokens: number;      // 기간 내 총 판매 토큰

  @prop({ required: true })
  totalSalesKRW: number;         // 총 판매 금액 (원화)

  @prop({ required: true })
  revenueShareRate: number;      // 0.8 (80%)

  @prop({ required: true })
  grossSettlementKRW: number;    // 세전 정산 금액

  @prop({ required: true })
  withholdingTaxRate: number;    // 0.033 (3.3%)

  @prop({ required: true })
  withholdingTaxKRW: number;     // 원천징수 금액

  @prop({ required: true })
  netSettlementKRW: number;      // 실수령 금액

  @prop({ enum: ['PENDING', 'PROCESSING', 'COMPLETED', 'FAILED'], default: 'PENDING' })
  status: string;

  @prop()
  bankName?: string;

  @prop()
  accountNumber?: string;

  @prop()
  accountHolder?: string;

  @prop()
  paidAt?: Date;
}
```

---

## 3. 토큰 충전 흐름 (토스페이먼츠)

```
┌────────┐      ┌────────┐      ┌──────────────┐
│ Client │      │ Server │      │ 토스페이먼츠   │
└───┬────┘      └───┬────┘      └──────┬───────┘
    │               │                  │
    │ 1. POST /payments/charge         │
    │ { amount: 5000 }                 │
    ├──────────────>│                  │
    │               │ 2. orderId 생성   │
    │               │ Transaction(PENDING)
    │ 3. { orderId, │                  │
    │    amount,    │                  │
    │    clientKey }│                  │
    │<──────────────┤                  │
    │               │                  │
    │ 4. 토스 SDK 결제 위젯              │
    ├──────────────────────────────────>│
    │ 5. paymentKey 응답                │
    │<──────────────────────────────────┤
    │               │                  │
    │ 6. POST /payments/charge/confirm │
    │ { paymentKey, orderId, amount }  │
    ├──────────────>│                  │
    │               │ 7. 승인 요청      │
    │               ├─────────────────>│
    │               │ 8. 승인 응답      │
    │               │<─────────────────┤
    │               │ 9. MongoDB 트랜잭션│
    │               │  - Transaction → COMPLETED
    │               │  - User.tokenBalance += tokens
    │ 10. 200 OK    │                  │
    │ { balance }   │                  │
    │<──────────────┤                  │
```

### 토스페이먼츠 승인 구현

```typescript
// src/modules/payment/payment.service.ts
async confirmCharge(userId: string, dto: ConfirmChargeDto): Promise<ChargeResult> {
  // 1. 주문 검증
  const transaction = await this.transactionModel.findOne({
    orderId: dto.orderId,
    userId,
    status: TransactionStatus.PENDING,
  });
  if (!transaction) throw new NotFoundException('주문을 찾을 수 없습니다.');
  if (transaction.krwAmount !== dto.amount) {
    throw new BadRequestException('결제 금액이 일치하지 않습니다.');
  }

  // 2. 토스페이먼츠 승인 API 호출
  const tossResponse = await this.httpService.axiosRef.post(
    'https://api.tosspayments.com/v1/payments/confirm',
    {
      paymentKey: dto.paymentKey,
      orderId: dto.orderId,
      amount: dto.amount,
    },
    {
      headers: {
        Authorization: `Basic ${Buffer.from(
          this.configService.get('TOSS_SECRET_KEY') + ':',
        ).toString('base64')}`,
        'Content-Type': 'application/json',
      },
    },
  );

  // 3. MongoDB 트랜잭션으로 원자적 업데이트
  const session = await this.connection.startSession();
  try {
    session.startTransaction();

    const tokens = dto.amount / 100;

    await this.transactionModel.findByIdAndUpdate(
      transaction._id,
      {
        status: TransactionStatus.COMPLETED,
        paymentKey: dto.paymentKey,
      },
      { session },
    );

    const updatedUser = await this.userModel.findByIdAndUpdate(
      userId,
      { $inc: { tokenBalance: tokens } },
      { new: true, session },
    );

    await session.commitTransaction();

    return {
      tokenBalance: updatedUser.tokenBalance,
      chargedTokens: tokens,
    };
  } catch (error) {
    await session.abortTransaction();
    // 토스페이먼츠 결제 취소 요청
    await this.cancelTossPayment(dto.paymentKey, '서버 처리 오류');
    throw new InternalServerErrorException('충전 처리 중 오류가 발생했습니다.');
  } finally {
    session.endSession();
  }
}
```

---

## 4. 에피소드 구매 흐름

```typescript
async purchaseEpisode(userId: string, episodeId: string): Promise<PurchaseResult> {
  // 1. 중복 구매 확인
  const existingPurchase = await this.purchaseModel.findOne({ userId, episodeId });
  if (existingPurchase) throw new ConflictException('이미 구매한 에피소드입니다.');

  // 2. 에피소드 정보 조회
  const episode = await this.episodeModel.findById(episodeId).populate('workId');
  if (!episode) throw new NotFoundException('에피소드를 찾을 수 없습니다.');
  if (episode.isFree) throw new BadRequestException('무료 에피소드입니다.');

  // 3. MongoDB 트랜잭션
  const session = await this.connection.startSession();
  try {
    session.startTransaction();

    // 잔액 차감 (findOneAndUpdate로 원자적 확인 + 차감)
    const user = await this.userModel.findOneAndUpdate(
      { _id: userId, tokenBalance: { $gte: episode.tokenPrice } },
      { $inc: { tokenBalance: -episode.tokenPrice } },
      { new: true, session },
    );

    if (!user) {
      throw new PaymentRequiredException('토큰이 부족합니다.');
    }

    // 거래 내역 생성
    const transaction = await this.transactionModel.create(
      [{
        userId,
        type: TransactionType.PURCHASE,
        status: TransactionStatus.COMPLETED,
        tokenAmount: -episode.tokenPrice,
        episodeId,
        workId: episode.workId._id,
        description: `${(episode.workId as Work).title} ${episode.episodeNumber}화 구매`,
      }],
      { session },
    );

    // 구매 기록 생성
    await this.purchaseModel.create(
      [{
        userId,
        episodeId,
        workId: episode.workId._id,
        tokenPrice: episode.tokenPrice,
        transactionId: transaction[0]._id,
      }],
      { session },
    );

    await session.commitTransaction();

    return {
      remainingBalance: user.tokenBalance,
      tokenPrice: episode.tokenPrice,
    };
  } catch (error) {
    await session.abortTransaction();
    if (error instanceof PaymentRequiredException) throw error;
    throw new InternalServerErrorException('구매 처리 중 오류가 발생했습니다.');
  } finally {
    session.endSession();
  }
}
```

---

## 5. 토스페이먼츠 웹훅 처리

```typescript
// POST /payments/webhook (토스페이먼츠 웹훅 수신)
@Post('webhook')
@Public()
async handleWebhook(
  @Body() body: TossWebhookPayload,
  @Headers('Toss-Signature') signature: string,
) {
  // 1. 시그니처 검증
  if (!this.paymentService.verifyWebhookSignature(body, signature)) {
    throw new UnauthorizedException('유효하지 않은 웹훅 서명');
  }

  // 2. 이벤트 처리
  switch (body.eventType) {
    case 'PAYMENT_STATUS_CHANGED':
      await this.paymentService.handlePaymentStatusChange(body.data);
      break;
    case 'PAYOUT_STATUS_CHANGED':
      await this.paymentService.handlePayoutStatusChange(body.data);
      break;
  }

  return { success: true };
}
```

---

## 6. 작가 정산 시스템

### 정산 규칙

| 항목 | 값 |
|------|-----|
| 수익 분배 비율 | 작가 80% : 플랫폼 20% |
| 정산 주기 | 격주 (매월 1일~15일, 16일~말일) |
| 정산 지급일 | 정산 기간 종료 후 5영업일 이내 |
| 최소 정산 금액 | ₩10,000 |
| 원천징수 | 사업소득 3.3% (소득세 3% + 지방소득세 0.3%) |

### 정산 계산 예시

```
정산 기간: 2025-01-01 ~ 2025-01-15
작가 A의 판매 내역:
  - 작품1 에피소드 구매: 500 토큰 (= ₩50,000)
  - 작품2 에피소드 구매: 300 토큰 (= ₩30,000)
  - 총 판매: 800 토큰 (= ₩80,000)

정산 계산:
  총 판매 금액:      ₩80,000
  수익 분배 (80%):   ₩64,000   (= 80,000 * 0.80)
  원천징수 (3.3%):   ₩2,112    (= 64,000 * 0.033)
  실수령 금액:       ₩61,888   (= 64,000 - 2,112)
```

### 정산 배치 처리

```typescript
// src/modules/payment/settlement.service.ts
@Injectable()
export class SettlementService {
  // 정산 실행 (Admin 트리거 또는 스케줄러)
  async executeSettlement(periodStart: Date, periodEnd: Date): Promise<void> {
    // 1. 기간 내 작가별 판매 집계
    const salesByAuthor = await this.transactionModel.aggregate([
      {
        $match: {
          type: TransactionType.PURCHASE,
          status: TransactionStatus.COMPLETED,
          createdAt: { $gte: periodStart, $lt: periodEnd },
        },
      },
      {
        $lookup: {
          from: 'episodes',
          localField: 'episodeId',
          foreignField: '_id',
          as: 'episode',
        },
      },
      { $unwind: '$episode' },
      {
        $lookup: {
          from: 'works',
          localField: 'episode.workId',
          foreignField: '_id',
          as: 'work',
        },
      },
      { $unwind: '$work' },
      {
        $group: {
          _id: '$work.authorId',
          totalTokens: { $sum: { $abs: '$tokenAmount' } },
        },
      },
    ]);

    // 2. 작가별 정산 레코드 생성
    for (const sale of salesByAuthor) {
      const totalKRW = sale.totalTokens * 100;
      const grossSettlement = Math.floor(totalKRW * 0.80);

      if (grossSettlement < 10000) continue; // 최소 정산 금액 미달

      const withholdingTax = Math.floor(grossSettlement * 0.033);
      const netSettlement = grossSettlement - withholdingTax;

      await this.settlementModel.create({
        authorId: sale._id,
        periodStart,
        periodEnd,
        totalSalesTokens: sale.totalTokens,
        totalSalesKRW: totalKRW,
        revenueShareRate: 0.80,
        grossSettlementKRW: grossSettlement,
        withholdingTaxRate: 0.033,
        withholdingTaxKRW: withholdingTax,
        netSettlementKRW: netSettlement,
        status: 'PENDING',
      });
    }
  }
}
```

---

## 7. 환불 정책

| 조건 | 환불 가능 여부 |
|------|---------------|
| 충전 후 미사용 | 전액 환불 (PG 취소) |
| 충전 후 일부 사용 | 미사용 토큰만 환불 |
| 에피소드 구매 (열람 전) | 24시간 이내 환불 |
| 에피소드 구매 (열람 후) | 환불 불가 |
| 구독 (결제 후 7일 이내) | 전액 환불 |
| 구독 (7일 이후) | 일할 계산 환불 |

```typescript
async refundCharge(userId: string, transactionId: string): Promise<void> {
  const transaction = await this.transactionModel.findOne({
    _id: transactionId,
    userId,
    type: TransactionType.CHARGE,
    status: TransactionStatus.COMPLETED,
  });
  if (!transaction) throw new NotFoundException('거래를 찾을 수 없습니다.');

  const user = await this.userModel.findById(userId);
  if (user.tokenBalance < transaction.tokenAmount) {
    throw new BadRequestException('사용된 토큰이 있어 전액 환불이 불가합니다.');
  }

  // 토스페이먼츠 환불 API
  await this.cancelTossPayment(
    transaction.paymentKey,
    '사용자 환불 요청',
    transaction.krwAmount,
  );

  // MongoDB 트랜잭션: 잔액 차감 + 환불 거래 생성
  const session = await this.connection.startSession();
  try {
    session.startTransaction();
    await this.userModel.findByIdAndUpdate(
      userId,
      { $inc: { tokenBalance: -transaction.tokenAmount } },
      { session },
    );
    transaction.status = TransactionStatus.CANCELLED;
    transaction.refundedAt = new Date();
    await transaction.save({ session });
    await session.commitTransaction();
  } catch {
    await session.abortTransaction();
    throw new InternalServerErrorException('환불 처리 중 오류');
  } finally {
    session.endSession();
  }
}
```
