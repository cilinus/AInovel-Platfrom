import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  BadRequestException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { LoggerService } from '../../logger/logger.service';
import { WriterAgent } from '../agents/writer.agent';
import { SummarizerAgent } from '../agents/summarizer.agent';
import { NovelProject, NovelProjectDocument } from '../schemas/novel-project.schema';
import { NovelChapter, NovelChapterDocument } from '../schemas/novel-chapter.schema';
import { User, UserDocument } from '../../common/schemas/user.schema';
import {
  TokenTransaction,
  TokenTransactionDocument,
  TransactionType,
} from '../../payments/schemas/token-transaction.schema';
import { CHAPTER_GENERATION_COST } from '../constants/ai-costs';
import { ChapterStatus, GenerationContext, SSEEvent } from '../types/novel.types';

@Injectable()
export class PipelineService {
  constructor(
    @InjectModel(NovelProject.name) private projectModel: Model<NovelProjectDocument>,
    @InjectModel(NovelChapter.name) private chapterModel: Model<NovelChapterDocument>,
    @InjectModel(User.name) private userModel: Model<UserDocument>,
    @InjectModel(TokenTransaction.name) private txModel: Model<TokenTransactionDocument>,
    private readonly writerAgent: WriterAgent,
    private readonly summarizerAgent: SummarizerAgent,
    private readonly logger: LoggerService,
  ) {}

  async *generateChapter(
    projectId: string,
    chapterNumber: number,
    userGuidance: string | undefined,
    userId: string,
  ): AsyncGenerator<SSEEvent> {
    this.logger.log(
      `pipeline.generateChapter - projectId: ${projectId}, chapter: ${chapterNumber}, userId: ${userId}`,
      'PipelineService',
    );

    // 1. Validate project ownership
    const project = await this.projectModel.findById(projectId);
    if (!project) {
      this.logger.error(
        `pipeline.generateChapter - project not found: ${projectId}`,
        undefined,
        'PipelineService',
      );
      throw new NotFoundException('Project not found');
    }
    if (project.userId.toString() !== userId) {
      this.logger.error(
        `pipeline.generateChapter - forbidden: userId=${userId}, ownerId=${project.userId}`,
        undefined,
        'PipelineService',
      );
      throw new ForbiddenException('You are not the owner of this project');
    }

    // 2. Check duplicate chapter
    const existingChapter = await this.chapterModel.findOne({
      projectId: new Types.ObjectId(projectId),
      chapterNumber,
    });
    if (existingChapter) {
      this.logger.error(
        `pipeline.generateChapter - chapter already exists: projectId=${projectId}, chapterNumber=${chapterNumber}`,
        undefined,
        'PipelineService',
      );
      throw new BadRequestException(`Chapter ${chapterNumber} already exists`);
    }

    // 3. Check token balance
    const user = await this.userModel.findById(userId);
    if (!user || user.tokenBalance < CHAPTER_GENERATION_COST) {
      this.logger.error(
        `pipeline.generateChapter - insufficient tokens: userId=${userId}, balance=${user?.tokenBalance ?? 0}, required=${CHAPTER_GENERATION_COST}`,
        undefined,
        'PipelineService',
      );
      throw new BadRequestException('Insufficient tokens for generation');
    }

    // 4. Build generation context - summary 기반 이전 챕터 로드
    const previousChapters = await this.chapterModel
      .find({ projectId: new Types.ObjectId(projectId), status: ChapterStatus.COMPLETED })
      .sort({ chapterNumber: 1 })
      .select('chapterNumber content summary')
      .lean();

    // 4.5. plotOutline에서 해당 챕터 아웃라인 조회
    const outlineItem = project.plotOutline?.find(
      item => item.chapterNumber === chapterNumber,
    );

    const context: GenerationContext = {
      projectId,
      chapterNumber,
      genre: project.genre,
      subGenre: project.subGenre,
      synopsis: project.synopsis,
      writingStyle: {
        tone: (project.writingStyle?.tone as GenerationContext['writingStyle']['tone']) ?? 'formal',
        perspective: (project.writingStyle?.perspective as GenerationContext['writingStyle']['perspective']) ?? 'third_person_limited',
      },
      settings: {
        mainCharacters: project.settings?.mainCharacters ?? [],
        worldBuilding: project.settings?.worldBuilding ?? '',
      },
      userGuidance,
      previousChapters: previousChapters.map(ch => ({
        chapterNumber: ch.chapterNumber,
        summary: ch.summary || ch.content.substring(0, 500),
      })),
      chapterOutline: outlineItem
        ? { goal: outlineItem.goal, keyEvents: outlineItem.keyEvents, notes: outlineItem.notes }
        : undefined,
    };

    // 5. Start draft generation
    yield {
      type: 'stage_start',
      data: { stage: 'draft', chapterNumber, cost: CHAPTER_GENERATION_COST },
    };

    const startTime = Date.now();
    let fullContent = '';
    let promptTokens = 0;
    let completionTokens = 0;

    try {
      for await (const chunk of this.writerAgent.generate(context)) {
        if (chunk.type === 'text_delta' && chunk.text) {
          fullContent += chunk.text;
          yield { type: 'content_delta', data: { text: chunk.text } };
        } else if (chunk.type === 'message_complete' && chunk.usage) {
          promptTokens = chunk.usage.input_tokens;
          completionTokens = chunk.usage.output_tokens;
        }
      }
    } catch (error) {
      this.logger.error(
        `pipeline.generateChapter - generation failed: ${(error as Error).message}`,
        (error as Error).stack,
        'PipelineService',
      );
      yield {
        type: 'error',
        data: { message: 'AI generation failed', detail: (error as Error).message },
      };
      return;
    }

    const generationTimeMs = Date.now() - startTime;

    yield {
      type: 'stage_complete',
      data: { stage: 'draft', generationTimeMs },
    };

    // 6. Extract title from content (first line starting with #)
    const titleMatch = fullContent.match(/^#\s+(.+)/m);
    const chapterTitle = titleMatch ? titleMatch[1].trim() : `${chapterNumber}화`;

    // 7. Calculate word count
    const wordCount = fullContent.replace(/\s/g, '').length;

    // 8. Save chapter
    this.logger.debug(
      `pipeline.generateChapter - saving chapter: projectId=${projectId}, chapterNumber=${chapterNumber}, wordCount=${wordCount}`,
      'PipelineService',
    );

    const chapter = await this.chapterModel.create({
      projectId: new Types.ObjectId(projectId),
      chapterNumber,
      title: chapterTitle,
      status: ChapterStatus.DRAFT,
      content: fullContent,
      wordCount,
      aiMetadata: {
        model: 'claude-sonnet-4-20250514',
        promptTokens,
        completionTokens,
        generationTimeMs,
        tokenCost: CHAPTER_GENERATION_COST,
      },
    });

    // 9. Deduct tokens (atomic)
    const updatedUser = await this.userModel.findOneAndUpdate(
      { _id: userId, tokenBalance: { $gte: CHAPTER_GENERATION_COST } },
      { $inc: { tokenBalance: -CHAPTER_GENERATION_COST } },
      { new: true },
    );
    if (!updatedUser) {
      this.logger.error(
        `pipeline.generateChapter - token deduction failed (race condition): userId=${userId}`,
        undefined,
        'PipelineService',
      );
      throw new BadRequestException('Token deduction failed');
    }

    // 10. Create transaction record
    await this.txModel.create({
      userId: new Types.ObjectId(userId),
      type: TransactionType.AI_GENERATION,
      amount: -CHAPTER_GENERATION_COST,
      balanceAfter: updatedUser.tokenBalance,
      description: `AI 소설 생성: ${project.title} - ${chapterNumber}화`,
      relatedProjectId: new Types.ObjectId(projectId),
    });

    // 11. Update project stats
    await this.projectModel.findByIdAndUpdate(projectId, {
      $inc: {
        totalChapters: 1,
        totalWordCount: wordCount,
        totalTokensSpent: CHAPTER_GENERATION_COST,
      },
    });

    // 11.5. 자동 요약 생성
    try {
      this.logger.debug(
        `pipeline.generateChapter - summarizing chapter: chapterId=${chapter._id}`,
        'PipelineService',
      );
      const summary = await this.summarizerAgent.summarize(fullContent);
      await this.chapterModel.findByIdAndUpdate(chapter._id, { summary });

      this.logger.log(
        `pipeline.generateChapter - summary generated: chapterId=${chapter._id}, summaryLength=${summary.length}`,
        'PipelineService',
      );

      yield {
        type: 'summary_generated',
        data: { summary },
      };
    } catch (error) {
      this.logger.error(
        `pipeline.generateChapter - summary generation failed: ${(error as Error).message}`,
        (error as Error).stack,
        'PipelineService',
      );
      // 요약 실패는 전체 파이프라인을 중단하지 않음
    }

    this.logger.log(
      `pipeline.generateChapter - success: chapterId=${chapter._id}, wordCount=${wordCount}, cost=${CHAPTER_GENERATION_COST}, balance=${updatedUser.tokenBalance}`,
      'PipelineService',
    );

    yield {
      type: 'complete',
      data: {
        chapterId: chapter._id.toString(),
        chapterNumber,
        title: chapterTitle,
        wordCount,
        tokenCost: CHAPTER_GENERATION_COST,
        balanceAfter: updatedUser.tokenBalance,
        generationTimeMs,
      },
    };
  }
}
