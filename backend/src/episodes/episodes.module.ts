import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { EpisodesController } from './episodes.controller';
import { EpisodesService } from './episodes.service';
import { Episode, EpisodeSchema } from '../common/schemas/episode.schema';
import { Work, WorkSchema } from '../common/schemas/work.schema';
import { Purchase, PurchaseSchema } from '../payments/schemas/purchase.schema';
import {
  ReadingHistory,
  ReadingHistorySchema,
} from '../common/schemas/reading-history.schema';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Episode.name, schema: EpisodeSchema },
      { name: Work.name, schema: WorkSchema },
      { name: Purchase.name, schema: PurchaseSchema },
      { name: ReadingHistory.name, schema: ReadingHistorySchema },
    ]),
  ],
  controllers: [EpisodesController],
  providers: [EpisodesService],
  exports: [EpisodesService],
})
export class EpisodesModule {}
