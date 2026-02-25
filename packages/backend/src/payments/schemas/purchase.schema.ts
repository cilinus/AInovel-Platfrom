import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types } from 'mongoose';

export type PurchaseDocument = HydratedDocument<Purchase>;

@Schema({ timestamps: true, collection: 'purchases' })
export class Purchase {
  @Prop({ type: Types.ObjectId, ref: 'User', required: true })
  userId: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'Episode', required: true })
  episodeId: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'Work', required: true })
  workId: Types.ObjectId;

  @Prop({ required: true })
  tokenAmount: number;

  @Prop()
  expiresAt?: Date;
}

export const PurchaseSchema = SchemaFactory.createForClass(Purchase);

PurchaseSchema.index({ userId: 1, episodeId: 1 }, { unique: true });
PurchaseSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0, sparse: true });
