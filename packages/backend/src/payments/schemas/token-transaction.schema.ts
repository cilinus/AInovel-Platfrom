import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types } from 'mongoose';

export type TokenTransactionDocument = HydratedDocument<TokenTransaction>;

export enum TransactionType {
  CHARGE = 'charge',
  PURCHASE = 'purchase',
  REFUND = 'refund',
  REWARD = 'reward',
  SETTLEMENT = 'settlement',
}

@Schema({ timestamps: true, collection: 'token_transactions' })
export class TokenTransaction {
  @Prop({ type: Types.ObjectId, ref: 'User', required: true })
  userId: Types.ObjectId;

  @Prop({ enum: TransactionType, required: true })
  type: TransactionType;

  @Prop({ required: true })
  amount: number;

  @Prop({ required: true })
  balanceAfter: number;

  @Prop()
  description?: string;

  @Prop({ unique: true, sparse: true })
  idempotencyKey?: string;

  @Prop()
  paymentKey?: string;
}

export const TokenTransactionSchema = SchemaFactory.createForClass(TokenTransaction);

TokenTransactionSchema.index({ userId: 1, createdAt: -1 });
