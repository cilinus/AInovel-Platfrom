import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types } from 'mongoose';

export type WorkDocument = HydratedDocument<Work>;

export enum WorkStatus {
  DRAFT = 'draft',
  ONGOING = 'ongoing',
  COMPLETED = 'completed',
  HIATUS = 'hiatus',
}

@Schema({ _id: false })
export class WorkStats {
  @Prop({ default: 0 })
  viewCount: number;

  @Prop({ default: 0 })
  likeCount: number;

  @Prop({ default: 0 })
  bookmarkCount: number;

  @Prop({ default: 0 })
  commentCount: number;

  @Prop({ default: 0 })
  ratingSum: number;

  @Prop({ default: 0 })
  ratingCount: number;
}

const WorkStatsSchema = SchemaFactory.createForClass(WorkStats);

@Schema({ timestamps: true, collection: 'works' })
export class Work {
  @Prop({ type: Types.ObjectId, ref: 'User', required: true })
  authorId: Types.ObjectId;

  @Prop({ required: true, maxlength: 100 })
  title: string;

  @Prop({ required: true, maxlength: 500 })
  description: string;

  @Prop()
  coverImage?: string;

  @Prop({ required: true })
  genre: string;

  @Prop({ type: [String], default: [] })
  tags: string[];

  @Prop({ enum: WorkStatus, default: WorkStatus.DRAFT })
  status: WorkStatus;

  @Prop({ default: false })
  isAIGenerated: boolean;

  @Prop({ default: 0 })
  episodeCount: number;

  @Prop({ default: 2 })
  tokenPrice: number;

  @Prop({ type: WorkStatsSchema, default: () => ({}) })
  stats: WorkStats;
}

export const WorkSchema = SchemaFactory.createForClass(Work);

WorkSchema.index({ genre: 1, status: 1, createdAt: -1 });
WorkSchema.index({ 'stats.viewCount': -1 });
WorkSchema.index({ tags: 1 });
WorkSchema.index(
  { title: 'text', description: 'text', tags: 'text' },
  { weights: { title: 10, tags: 5, description: 1 } },
);
