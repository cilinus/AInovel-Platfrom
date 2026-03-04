import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Schema as MongooseSchema, Types } from 'mongoose';

export type TokenTransactionDocument = HydratedDocument<TokenTransaction>;

export enum TransactionType {
  CHARGE = 'charge',
  PURCHASE = 'purchase',
  REVENUE = 'revenue',
  REFUND = 'refund',
  REWARD = 'reward',
  SETTLEMENT = 'settlement',
  AI_GENERATION = 'ai_generation',
}

@Schema({ timestamps: true, collection: 'token_transactions' })
export class TokenTransaction {
  @Prop({ type: MongooseSchema.Types.ObjectId, ref: 'User', required: true })
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

  @Prop({ type: MongooseSchema.Types.ObjectId, ref: 'Episode' })
  relatedEpisodeId?: Types.ObjectId;

  @Prop({ type: MongooseSchema.Types.ObjectId, ref: 'NovelProject' })
  relatedProjectId?: Types.ObjectId;

  @Prop()
  paymentKey?: string;
}

export const TokenTransactionSchema = SchemaFactory.createForClass(TokenTransaction);

TokenTransactionSchema.index({ userId: 1, createdAt: -1 });
