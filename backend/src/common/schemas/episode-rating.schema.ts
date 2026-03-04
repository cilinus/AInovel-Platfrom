import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Schema as MongooseSchema, Types } from 'mongoose';

export type EpisodeRatingDocument = HydratedDocument<EpisodeRating>;

@Schema({ timestamps: true, collection: 'episode_ratings' })
export class EpisodeRating {
  @Prop({ type: MongooseSchema.Types.ObjectId, ref: 'Episode', required: true })
  episodeId: Types.ObjectId;

  @Prop({ type: MongooseSchema.Types.ObjectId, ref: 'Work', required: true })
  workId: Types.ObjectId;

  @Prop({ type: MongooseSchema.Types.ObjectId, ref: 'User', required: true })
  userId: Types.ObjectId;

  @Prop({ required: true, min: 1, max: 5 })
  score: number;
}

export const EpisodeRatingSchema = SchemaFactory.createForClass(EpisodeRating);

EpisodeRatingSchema.index({ episodeId: 1, userId: 1 }, { unique: true });
EpisodeRatingSchema.index({ episodeId: 1 });
