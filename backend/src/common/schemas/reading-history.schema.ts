import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types } from 'mongoose';

export type ReadingHistoryDocument = HydratedDocument<ReadingHistory>;

@Schema({ timestamps: true, collection: 'reading_histories' })
export class ReadingHistory {
  @Prop({ type: Types.ObjectId, ref: 'User', required: true })
  userId: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'Work', required: true })
  workId: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'Episode', required: true })
  lastEpisodeId: Types.ObjectId;

  @Prop({ required: true })
  lastEpisodeNumber: number;

  @Prop({ required: true, default: 0, min: 0, max: 100 })
  progress: number;

  @Prop({ required: true, default: () => new Date() })
  lastReadAt: Date;
}

export const ReadingHistorySchema =
  SchemaFactory.createForClass(ReadingHistory);

ReadingHistorySchema.index({ userId: 1, workId: 1 }, { unique: true });
ReadingHistorySchema.index({ userId: 1, lastReadAt: -1 });
