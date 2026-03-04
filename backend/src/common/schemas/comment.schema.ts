import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Schema as MongooseSchema, Types } from 'mongoose';

export type CommentDocument = HydratedDocument<Comment>;

@Schema({ timestamps: true, collection: 'comments' })
export class Comment {
  @Prop({ type: MongooseSchema.Types.ObjectId, ref: 'Work', required: true })
  workId: Types.ObjectId;

  @Prop({ type: MongooseSchema.Types.ObjectId, ref: 'Episode', required: true })
  episodeId: Types.ObjectId;

  @Prop({ type: MongooseSchema.Types.ObjectId, ref: 'User', required: true })
  userId: Types.ObjectId;

  @Prop({ required: true, maxlength: 500 })
  content: string;

  @Prop({ default: 0 })
  likeCount: number;

  @Prop({ type: [MongooseSchema.Types.ObjectId], ref: 'User', default: [] })
  likedBy: Types.ObjectId[];

  @Prop({ default: 0 })
  dislikeCount: number;

  @Prop({ type: [MongooseSchema.Types.ObjectId], ref: 'User', default: [] })
  dislikedBy: Types.ObjectId[];

  @Prop({ type: MongooseSchema.Types.ObjectId, ref: 'Comment', default: null })
  parentId: Types.ObjectId | null;

  @Prop({ default: false })
  isDeleted: boolean;
}

export const CommentSchema = SchemaFactory.createForClass(Comment);

CommentSchema.index({ episodeId: 1, createdAt: -1 });
CommentSchema.index({ workId: 1 });
CommentSchema.index({ userId: 1 });
CommentSchema.index({ parentId: 1, createdAt: -1 });
CommentSchema.index({ episodeId: 1, likeCount: -1 });
