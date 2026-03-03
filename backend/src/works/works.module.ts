import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { WorksController } from './works.controller';
import { WorksService } from './works.service';
import { Work, WorkSchema } from '../common/schemas/work.schema';
import { WorkLike, WorkLikeSchema } from '../common/schemas/work-like.schema';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Work.name, schema: WorkSchema },
      { name: WorkLike.name, schema: WorkLikeSchema },
    ]),
  ],
  controllers: [WorksController],
  providers: [WorksService],
  exports: [WorksService],
})
export class WorksModule {}
