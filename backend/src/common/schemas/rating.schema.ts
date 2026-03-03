import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types } from 'mongoose';

export type RatingDocument = HydratedDocument<Rating>;

@Schema({ timestamps: true, collection: 'ratings' })
export class Rating {
  @Prop({ type: Types.ObjectId, ref: 'Work', required: true })
  workId: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'User', required: true })
  userId: Types.ObjectId;

  @Prop({ required: true, min: 1, max: 5 })
  score: number;
}

export const RatingSchema = SchemaFactory.createForClass(Rating);

RatingSchema.index({ workId: 1, userId: 1 }, { unique: true });
RatingSchema.index({ workId: 1 });
