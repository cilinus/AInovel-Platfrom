import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { RatingsController } from './ratings.controller';
import { RatingsService } from './ratings.service';
import { Rating, RatingSchema } from '../common/schemas/rating.schema';
import { EpisodeRating, EpisodeRatingSchema } from '../common/schemas/episode-rating.schema';
import { Work, WorkSchema } from '../common/schemas/work.schema';
import { Episode, EpisodeSchema } from '../common/schemas/episode.schema';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Rating.name, schema: RatingSchema },
      { name: EpisodeRating.name, schema: EpisodeRatingSchema },
      { name: Work.name, schema: WorkSchema },
      { name: Episode.name, schema: EpisodeSchema },
    ]),
  ],
  controllers: [RatingsController],
  providers: [RatingsService],
  exports: [RatingsService],
})
export class RatingsModule {}
