import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types } from 'mongoose';

export type EpisodeDocument = HydratedDocument<Episode>;

@Schema({ _id: false })
export class AIMetadata {
  @Prop()
  model?: string;

  @Prop()
  promptTokens?: number;

  @Prop()
  completionTokens?: number;

  @Prop()
  generationTime?: number;
}

const AIMetadataSchema = SchemaFactory.createForClass(AIMetadata);

@Schema({ timestamps: true, collection: 'episodes' })
export class Episode {
  @Prop({ type: Types.ObjectId, ref: 'Work', required: true })
  workId: Types.ObjectId;

  @Prop({ required: true })
  episodeNumber: number;

  @Prop({ required: true, maxlength: 100 })
  title: string;

  @Prop({ required: true })
  content: string;

  @Prop({ default: 0 })
  wordCount: number;

  @Prop({ default: false })
  isFree: boolean;

  @Prop({ default: 0 })
  price: number;

  @Prop()
  authorNote?: string;

  @Prop({ default: false })
  isPublished: boolean;

  @Prop()
  publishedAt?: Date;

  @Prop()
  scheduledAt?: Date;

  @Prop({ type: AIMetadataSchema })
  aiMetadata?: AIMetadata;
}

export const EpisodeSchema = SchemaFactory.createForClass(Episode);

EpisodeSchema.index({ workId: 1, episodeNumber: 1 }, { unique: true });
EpisodeSchema.index({ workId: 1, isPublished: 1, publishedAt: -1 });
