import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { WorksController } from './works.controller';
import { WorksService } from './works.service';
import { Work, WorkSchema } from '../common/schemas/work.schema';

@Module({
  imports: [
    MongooseModule.forFeature([{ name: Work.name, schema: WorkSchema }]),
  ],
  controllers: [WorksController],
  providers: [WorksService],
  exports: [WorksService],
})
export class WorksModule {}
