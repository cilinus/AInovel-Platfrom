import {
  Controller,
  Get,
  Post,
  Delete,
  Param,
  Body,
  Query,
} from '@nestjs/common';
import {
  ApiTags,
  ApiBearerAuth,
  ApiOperation,
  ApiParam,
  ApiQuery,
  ApiResponse,
} from '@nestjs/swagger';
import { CommentsService } from './comments.service';
import { CreateCommentDto } from './dto/create-comment.dto';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { Public } from '../common/decorators/public.decorator';
import { LoggerService } from '../logger/logger.service';

@ApiTags('Comments')
@Controller('works/:workId/episodes/:episodeId/comments')
export class CommentsController {
  constructor(
    private readonly commentsService: CommentsService,
    private readonly logger: LoggerService,
  ) {}

  @Public()
  @Get()
  @ApiOperation({ summary: '댓글 목록 조회' })
  @ApiParam({ name: 'workId', description: '작품 ID' })
  @ApiParam({ name: 'episodeId', description: '에피소드 ID' })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiQuery({ name: 'sort', required: false, enum: ['latest', 'best'] })
  @ApiResponse({ status: 200, description: '댓글 목록 반환' })
  async list(
    @Param('episodeId') episodeId: string,
    @Query('page') page?: number,
    @Query('limit') limit?: number,
    @Query('sort') sort?: 'latest' | 'best',
    @CurrentUser('userId') userId?: string,
  ) {
    this.logger.log(
      `GET comments - episodeId: ${episodeId}, page: ${page}, limit: ${limit}, sort: ${sort || 'latest'}`,
      'CommentsController',
    );
    try {
      const result = await this.commentsService.listByEpisode(
        episodeId,
        userId,
        page ? Number(page) : 1,
        limit ? Number(limit) : 20,
        sort || 'latest',
      );
      this.logger.log(
        `GET comments - success: total=${result.total}`,
        'CommentsController',
      );
      return result;
    } catch (error) {
      this.logger.error(
        `GET comments - failed: ${error.message}`,
        error.stack,
        'CommentsController',
      );
      throw error;
    }
  }

  @Post()
  @ApiBearerAuth()
  @ApiOperation({ summary: '댓글 작성' })
  @ApiParam({ name: 'workId', description: '작품 ID' })
  @ApiParam({ name: 'episodeId', description: '에피소드 ID' })
  @ApiResponse({ status: 201, description: '댓글 생성 성공' })
  @ApiResponse({ status: 401, description: '인증 필요' })
  @ApiResponse({ status: 404, description: '에피소드를 찾을 수 없음' })
  async create(
    @Param('workId') workId: string,
    @Param('episodeId') episodeId: string,
    @CurrentUser('userId') userId: string,
    @Body() createCommentDto: CreateCommentDto,
  ) {
    this.logger.log(
      `POST comment - workId: ${workId}, episodeId: ${episodeId}, userId: ${userId}`,
      'CommentsController',
    );
    try {
      const result = await this.commentsService.create(
        workId,
        episodeId,
        userId,
        createCommentDto.content,
        createCommentDto.parentId,
      );
      this.logger.log(
        `POST comment - success: id=${result.id}`,
        'CommentsController',
      );
      return result;
    } catch (error) {
      this.logger.error(
        `POST comment - failed: ${error.message}`,
        error.stack,
        'CommentsController',
      );
      throw error;
    }
  }

  @Post(':commentId/like')
  @ApiBearerAuth()
  @ApiOperation({ summary: '댓글 좋아요 토글' })
  @ApiParam({ name: 'workId', description: '작품 ID' })
  @ApiParam({ name: 'episodeId', description: '에피소드 ID' })
  @ApiParam({ name: 'commentId', description: '댓글 ID' })
  @ApiResponse({ status: 200, description: '좋아요 토글 성공' })
  @ApiResponse({ status: 401, description: '인증 필요' })
  @ApiResponse({ status: 404, description: '댓글을 찾을 수 없음' })
  async toggleLike(
    @Param('commentId') commentId: string,
    @CurrentUser('userId') userId: string,
  ) {
    this.logger.log(
      `POST comment like - commentId: ${commentId}, userId: ${userId}`,
      'CommentsController',
    );
    try {
      const result = await this.commentsService.toggleLike(commentId, userId);
      this.logger.log(
        `POST comment like - success: commentId=${commentId}, isLiked=${result.isLiked}`,
        'CommentsController',
      );
      return result;
    } catch (error) {
      this.logger.error(
        `POST comment like - failed: ${error.message}`,
        error.stack,
        'CommentsController',
      );
      throw error;
    }
  }

  @Post(':commentId/dislike')
  @ApiBearerAuth()
  @ApiOperation({ summary: '댓글 싫어요 토글' })
  @ApiParam({ name: 'workId', description: '작품 ID' })
  @ApiParam({ name: 'episodeId', description: '에피소드 ID' })
  @ApiParam({ name: 'commentId', description: '댓글 ID' })
  @ApiResponse({ status: 200, description: '싫어요 토글 성공' })
  @ApiResponse({ status: 401, description: '인증 필요' })
  @ApiResponse({ status: 404, description: '댓글을 찾을 수 없음' })
  async toggleDislike(
    @Param('commentId') commentId: string,
    @CurrentUser('userId') userId: string,
  ) {
    this.logger.log(
      `POST comment dislike - commentId: ${commentId}, userId: ${userId}`,
      'CommentsController',
    );
    try {
      const result = await this.commentsService.toggleDislike(commentId, userId);
      this.logger.log(
        `POST comment dislike - success: commentId=${commentId}, isDisliked=${result.isDisliked}`,
        'CommentsController',
      );
      return result;
    } catch (error) {
      this.logger.error(
        `POST comment dislike - failed: ${error.message}`,
        error.stack,
        'CommentsController',
      );
      throw error;
    }
  }

  @Delete(':commentId')
  @ApiBearerAuth()
  @ApiOperation({ summary: '댓글 삭제' })
  @ApiParam({ name: 'workId', description: '작품 ID' })
  @ApiParam({ name: 'episodeId', description: '에피소드 ID' })
  @ApiParam({ name: 'commentId', description: '댓글 ID' })
  @ApiResponse({ status: 200, description: '댓글 삭제 성공' })
  @ApiResponse({ status: 401, description: '인증 필요' })
  @ApiResponse({ status: 403, description: '본인의 댓글이 아닌 경우' })
  @ApiResponse({ status: 404, description: '댓글을 찾을 수 없음' })
  async delete(
    @Param('commentId') commentId: string,
    @CurrentUser('userId') userId: string,
  ) {
    this.logger.log(
      `DELETE comment - commentId: ${commentId}, userId: ${userId}`,
      'CommentsController',
    );
    try {
      const result = await this.commentsService.deleteComment(
        commentId,
        userId,
      );
      this.logger.log(
        `DELETE comment - success: commentId=${commentId}`,
        'CommentsController',
      );
      return result;
    } catch (error) {
      this.logger.error(
        `DELETE comment - failed: ${error.message}`,
        error.stack,
        'CommentsController',
      );
      throw error;
    }
  }
}
