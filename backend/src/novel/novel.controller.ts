import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Param,
  Body,
  Query,
  Res,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { Response } from 'express';
import { NovelService } from './novel.service';
import { PipelineService } from './services/pipeline.service';
import { CreateProjectDto, UpdateProjectDto } from './dto/create-project.dto';
import { GenerateChapterDto } from './dto/generate-chapter.dto';
import { UpdateChapterDto } from './dto/update-chapter.dto';
import { UpdateOutlineDto, GenerateOutlineDto } from './dto/update-outline.dto';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { Roles } from '../common/decorators/roles.decorator';
import { UserRole } from '../common/types/user';
import { LoggerService } from '../logger/logger.service';

@ApiTags('Novel')
@ApiBearerAuth()
@Controller('novel')
@Roles(UserRole.AUTHOR, UserRole.ADMIN)
export class NovelController {
  constructor(
    private readonly novelService: NovelService,
    private readonly pipelineService: PipelineService,
    private readonly logger: LoggerService,
  ) {}

  // -----------------------------------------------------------------------
  // Project CRUD
  // -----------------------------------------------------------------------

  @Post('projects')
  @ApiOperation({ summary: 'AI 소설 프로젝트 생성' })
  async createProject(
    @CurrentUser('userId') userId: string,
    @Body() dto: CreateProjectDto,
  ) {
    this.logger.log(
      `POST /novel/projects - userId: ${userId}, title: ${dto.title}`,
      'NovelController',
    );
    try {
      const result = await this.novelService.createProject(userId, dto);
      this.logger.log(
        `POST /novel/projects - success: ${result._id}`,
        'NovelController',
      );
      return result;
    } catch (error) {
      this.logger.error(
        `POST /novel/projects - failed: ${(error as Error).message}`,
        (error as Error).stack,
        'NovelController',
      );
      throw error;
    }
  }

  @Get('projects')
  @ApiOperation({ summary: '내 AI 소설 프로젝트 목록 조회' })
  async getProjects(
    @CurrentUser('userId') userId: string,
    @Query('page') page?: number,
    @Query('limit') limit?: number,
  ) {
    return this.novelService.getProjects(userId, page, limit);
  }

  @Get('projects/:projectId')
  @ApiOperation({ summary: 'AI 소설 프로젝트 상세 조회' })
  async getProject(
    @Param('projectId') projectId: string,
    @CurrentUser('userId') userId: string,
  ) {
    return this.novelService.getProject(projectId, userId);
  }

  @Patch('projects/:projectId')
  @ApiOperation({ summary: 'AI 소설 프로젝트 수정' })
  async updateProject(
    @Param('projectId') projectId: string,
    @CurrentUser('userId') userId: string,
    @Body() dto: UpdateProjectDto,
  ) {
    this.logger.log(
      `PATCH /novel/projects/${projectId} - userId: ${userId}`,
      'NovelController',
    );
    try {
      const result = await this.novelService.updateProject(projectId, userId, dto);
      this.logger.log(
        `PATCH /novel/projects/${projectId} - success`,
        'NovelController',
      );
      return result;
    } catch (error) {
      this.logger.error(
        `PATCH /novel/projects/${projectId} - failed: ${(error as Error).message}`,
        (error as Error).stack,
        'NovelController',
      );
      throw error;
    }
  }

  @Delete('projects/:projectId')
  @ApiOperation({ summary: 'AI 소설 프로젝트 보관 (archive)' })
  async archiveProject(
    @Param('projectId') projectId: string,
    @CurrentUser('userId') userId: string,
  ) {
    return this.novelService.archiveProject(projectId, userId);
  }

  // -----------------------------------------------------------------------
  // Plot Outline
  // -----------------------------------------------------------------------

  @Get('projects/:projectId/outline')
  @ApiOperation({ summary: '플롯 아웃라인 조회' })
  async getOutline(
    @Param('projectId') projectId: string,
    @CurrentUser('userId') userId: string,
  ) {
    this.logger.log(
      `GET /novel/projects/${projectId}/outline - userId: ${userId}`,
      'NovelController',
    );
    try {
      const result = await this.novelService.getOutline(projectId, userId);
      return result;
    } catch (error) {
      this.logger.error(
        `GET /novel/projects/${projectId}/outline - failed: ${(error as Error).message}`,
        (error as Error).stack,
        'NovelController',
      );
      throw error;
    }
  }

  @Patch('projects/:projectId/outline')
  @ApiOperation({ summary: '플롯 아웃라인 수동 수정' })
  async updateOutline(
    @Param('projectId') projectId: string,
    @CurrentUser('userId') userId: string,
    @Body() dto: UpdateOutlineDto,
  ) {
    this.logger.log(
      `PATCH /novel/projects/${projectId}/outline - userId: ${userId}`,
      'NovelController',
    );
    try {
      const result = await this.novelService.updateOutline(projectId, userId, dto);
      this.logger.log(
        `PATCH /novel/projects/${projectId}/outline - success`,
        'NovelController',
      );
      return result;
    } catch (error) {
      this.logger.error(
        `PATCH /novel/projects/${projectId}/outline - failed: ${(error as Error).message}`,
        (error as Error).stack,
        'NovelController',
      );
      throw error;
    }
  }

  @Post('projects/:projectId/outline/generate')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'AI 플롯 아웃라인 자동 생성' })
  async generateOutline(
    @Param('projectId') projectId: string,
    @CurrentUser('userId') userId: string,
    @Body() dto: GenerateOutlineDto,
  ) {
    this.logger.log(
      `POST /novel/projects/${projectId}/outline/generate - userId: ${userId}, totalChapters: ${dto.totalChapters}`,
      'NovelController',
    );
    try {
      const result = await this.novelService.generateOutline(
        projectId,
        userId,
        dto.totalChapters,
      );
      this.logger.log(
        `POST /novel/projects/${projectId}/outline/generate - success: ${result.length} chapters`,
        'NovelController',
      );
      return result;
    } catch (error) {
      this.logger.error(
        `POST /novel/projects/${projectId}/outline/generate - failed: ${(error as Error).message}`,
        (error as Error).stack,
        'NovelController',
      );
      throw error;
    }
  }

  // -----------------------------------------------------------------------
  // Chapter CRUD
  // -----------------------------------------------------------------------

  @Get('projects/:projectId/chapters')
  @ApiOperation({ summary: '챕터 목록 조회' })
  async getChapters(
    @Param('projectId') projectId: string,
    @CurrentUser('userId') userId: string,
  ) {
    return this.novelService.getChapters(projectId, userId);
  }

  @Get('projects/:projectId/chapters/:chapterNumber')
  @ApiOperation({ summary: '챕터 상세 조회' })
  async getChapter(
    @Param('projectId') projectId: string,
    @Param('chapterNumber') chapterNumber: number,
    @CurrentUser('userId') userId: string,
  ) {
    return this.novelService.getChapter(projectId, +chapterNumber, userId);
  }

  @Patch('projects/:projectId/chapters/:chapterNumber')
  @ApiOperation({ summary: '챕터 내용 수정' })
  async updateChapter(
    @Param('projectId') projectId: string,
    @Param('chapterNumber') chapterNumber: number,
    @CurrentUser('userId') userId: string,
    @Body() dto: UpdateChapterDto,
  ) {
    const result = await this.novelService.updateChapterContent(
      projectId,
      +chapterNumber,
      userId,
      dto.content,
    );
    if (dto.title) {
      return this.novelService.updateChapterTitle(
        projectId,
        +chapterNumber,
        userId,
        dto.title,
      );
    }
    return result;
  }

  @Get('projects/:projectId/chapters/:chapterNumber/download')
  @ApiOperation({ summary: '챕터 마크다운 다운로드' })
  async downloadChapter(
    @Param('projectId') projectId: string,
    @Param('chapterNumber') chapterNumber: number,
    @CurrentUser('userId') userId: string,
    @Res() res: Response,
  ) {
    this.logger.log(
      `GET /novel/projects/${projectId}/chapters/${chapterNumber}/download - userId: ${userId}`,
      'NovelController',
    );

    try {
      const { markdown, title } = await this.novelService.downloadChapter(
        projectId,
        +chapterNumber,
        userId,
      );

      const filename = encodeURIComponent(`${title}.md`);
      res.setHeader('Content-Type', 'text/markdown; charset=utf-8');
      res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
      res.send(markdown);
    } catch (error) {
      this.logger.error(
        `GET /novel/projects/${projectId}/chapters/${chapterNumber}/download - failed: ${(error as Error).message}`,
        (error as Error).stack,
        'NovelController',
      );
      throw error;
    }
  }

  @Delete('projects/:projectId/chapters/:chapterNumber')
  @ApiOperation({ summary: '챕터 삭제' })
  async deleteChapter(
    @Param('projectId') projectId: string,
    @Param('chapterNumber') chapterNumber: number,
    @CurrentUser('userId') userId: string,
  ) {
    return this.novelService.deleteChapter(projectId, +chapterNumber, userId);
  }

  // -----------------------------------------------------------------------
  // AI Generation (SSE)
  // -----------------------------------------------------------------------

  @Post('projects/:projectId/chapters/generate')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'AI 챕터 생성 (SSE 스트리밍)' })
  async generateChapter(
    @Param('projectId') projectId: string,
    @CurrentUser('userId') userId: string,
    @Body() dto: GenerateChapterDto,
    @Res() res: Response,
  ) {
    this.logger.log(
      `POST /novel/projects/${projectId}/chapters/generate - userId: ${userId}, chapter: ${dto.chapterNumber}`,
      'NovelController',
    );

    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');
    res.setHeader('X-Accel-Buffering', 'no');
    res.flushHeaders();

    try {
      const pipeline = this.pipelineService.generateChapter(
        projectId,
        dto.chapterNumber,
        dto.userGuidance,
        userId,
      );

      for await (const event of pipeline) {
        res.write(`event: ${event.type}\ndata: ${JSON.stringify(event.data)}\n\n`);
      }
    } catch (error) {
      this.logger.error(
        `POST /novel/projects/${projectId}/chapters/generate - failed: ${(error as Error).message}`,
        (error as Error).stack,
        'NovelController',
      );

      res.write(`event: error\ndata: ${JSON.stringify({
        message: (error as Error).message,
        status: (error as any).status ?? 500,
      })}\n\n`);
    } finally {
      res.end();
    }
  }
}
