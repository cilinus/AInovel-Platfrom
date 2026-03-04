import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { NovelController } from './novel.controller';
import { NovelService } from './novel.service';
import { ClaudeService } from './services/claude.service';
import { WriterAgent } from './agents/writer.agent';
import { SummarizerAgent } from './agents/summarizer.agent';
import { OutlineGeneratorAgent } from './agents/outline-generator.agent';
import { PipelineService } from './services/pipeline.service';
import { NovelProject, NovelProjectSchema } from './schemas/novel-project.schema';
import { NovelChapter, NovelChapterSchema } from './schemas/novel-chapter.schema';
import { User, UserSchema } from '../common/schemas/user.schema';
import {
  TokenTransaction,
  TokenTransactionSchema,
} from '../payments/schemas/token-transaction.schema';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: NovelProject.name, schema: NovelProjectSchema },
      { name: NovelChapter.name, schema: NovelChapterSchema },
      { name: User.name, schema: UserSchema },
      { name: TokenTransaction.name, schema: TokenTransactionSchema },
    ]),
  ],
  controllers: [NovelController],
  providers: [NovelService, ClaudeService, WriterAgent, SummarizerAgent, OutlineGeneratorAgent, PipelineService],
  exports: [NovelService],
})
export class NovelModule {}
