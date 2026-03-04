import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Schema as MongooseSchema, Types } from 'mongoose';
import { ChapterStatus } from '../types/novel.types';

export type NovelChapterDocument = HydratedDocument<NovelChapter>;

@Schema({ _id: false })
export class ChapterAIMetadata {
  @Prop()
  model?: string;

  @Prop()
  promptTokens?: number;

  @Prop()
  completionTokens?: number;

  @Prop()
  generationTimeMs?: number;

  @Prop()
  tokenCost?: number;
}

const ChapterAIMetadataSchema = SchemaFactory.createForClass(ChapterAIMetadata);

@Schema({ timestamps: true, collection: 'novel_chapters' })
export class NovelChapter {
  @Prop({ type: MongooseSchema.Types.ObjectId, ref: 'NovelProject', required: true })
  projectId: Types.ObjectId;

  @Prop({ required: true })
  chapterNumber: number;

  @Prop({ maxlength: 200 })
  title?: string;

  @Prop({ type: String, enum: Object.values(ChapterStatus), default: ChapterStatus.DRAFT })
  status: ChapterStatus;

  @Prop({ default: '' })
  content: string;

  @Prop({ default: 0 })
  wordCount: number;

  @Prop({ type: ChapterAIMetadataSchema })
  aiMetadata?: ChapterAIMetadata;

  @Prop()
  reviewScore?: number;

  @Prop({ default: '' })
  summary: string;
}

export const NovelChapterSchema = SchemaFactory.createForClass(NovelChapter);

NovelChapterSchema.index({ projectId: 1, chapterNumber: 1 }, { unique: true });
NovelChapterSchema.index({ projectId: 1, status: 1 });
