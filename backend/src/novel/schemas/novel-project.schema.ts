import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Schema as MongooseSchema, Types } from 'mongoose';
import { ProjectStatus } from '../types/novel.types';

export type NovelProjectDocument = HydratedDocument<NovelProject>;

@Schema({ _id: false })
export class WritingStyleSchema {
  @Prop({ default: 'formal' })
  tone: string;

  @Prop({ default: 'third_person_limited' })
  perspective: string;
}

const WritingStyleSubSchema = SchemaFactory.createForClass(WritingStyleSchema);

@Schema({ _id: false })
export class MainCharacter {
  @Prop({ required: true })
  name: string;

  @Prop({ required: true })
  description: string;
}

const MainCharacterSchema = SchemaFactory.createForClass(MainCharacter);

@Schema({ _id: false })
export class ProjectSettingsSchema {
  @Prop({ type: [MainCharacterSchema], default: [] })
  mainCharacters: MainCharacter[];

  @Prop({ default: '' })
  worldBuilding: string;
}

const ProjectSettingsSubSchema = SchemaFactory.createForClass(ProjectSettingsSchema);

@Schema({ _id: false })
export class PlotOutlineItem {
  @Prop({ required: true })
  chapterNumber: number;

  @Prop({ required: true })
  goal: string;

  @Prop({ required: true })
  keyEvents: string;

  @Prop()
  notes?: string;
}

const PlotOutlineItemSchema = SchemaFactory.createForClass(PlotOutlineItem);

@Schema({ timestamps: true, collection: 'novel_projects' })
export class NovelProject {
  @Prop({ type: MongooseSchema.Types.ObjectId, ref: 'User', required: true })
  userId: Types.ObjectId;

  @Prop({ required: true, maxlength: 100 })
  title: string;

  @Prop({ required: true })
  genre: string;

  @Prop()
  subGenre?: string;

  @Prop({ required: true, maxlength: 5000 })
  synopsis: string;

  @Prop()
  targetAudience?: string;

  @Prop({ type: WritingStyleSubSchema, default: () => ({}) })
  writingStyle: WritingStyleSchema;

  @Prop({ type: ProjectSettingsSubSchema, default: () => ({}) })
  settings: ProjectSettingsSchema;

  @Prop({ type: String, enum: Object.values(ProjectStatus), default: ProjectStatus.ACTIVE })
  status: ProjectStatus;

  @Prop({ default: 0 })
  totalChapters: number;

  @Prop({ default: 0 })
  totalWordCount: number;

  @Prop({ default: 0 })
  totalTokensSpent: number;

  @Prop({ type: [PlotOutlineItemSchema], default: [] })
  plotOutline: PlotOutlineItem[];
}

export const NovelProjectSchema = SchemaFactory.createForClass(NovelProject);

NovelProjectSchema.index({ userId: 1, createdAt: -1 });
NovelProjectSchema.index({ genre: 1, status: 1 });
