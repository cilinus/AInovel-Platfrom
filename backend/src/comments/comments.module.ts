import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { CommentsController } from './comments.controller';
import { CommentsService } from './comments.service';
import { Comment, CommentSchema } from '../common/schemas/comment.schema';
import { Work, WorkSchema } from '../common/schemas/work.schema';
import { Episode, EpisodeSchema } from '../common/schemas/episode.schema';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Comment.name, schema: CommentSchema },
      { name: Work.name, schema: WorkSchema },
      { name: Episode.name, schema: EpisodeSchema },
    ]),
  ],
  controllers: [CommentsController],
  providers: [CommentsService],
  exports: [CommentsService],
})
export class CommentsModule {}
