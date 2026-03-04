import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Schema as MongooseSchema, Types } from 'mongoose';

export type WorkLikeDocument = HydratedDocument<WorkLike>;

@Schema({ timestamps: true, collection: 'work_likes' })
export class WorkLike {
  @Prop({ type: MongooseSchema.Types.ObjectId, ref: 'Work', required: true })
  workId: Types.ObjectId;

  @Prop({ type: MongooseSchema.Types.ObjectId, ref: 'User', required: true })
  userId: Types.ObjectId;
}

export const WorkLikeSchema = SchemaFactory.createForClass(WorkLike);

WorkLikeSchema.index({ workId: 1, userId: 1 }, { unique: true });
WorkLikeSchema.index({ workId: 1 });
