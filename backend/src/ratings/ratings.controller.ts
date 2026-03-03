import { Controller, Get, Post, Param, Body } from '@nestjs/common';
import {
  ApiTags,
  ApiBearerAuth,
  ApiOperation,
  ApiParam,
  ApiResponse,
} from '@nestjs/swagger';
import { RatingsService } from './ratings.service';
import { CreateRatingDto } from './dto/create-rating.dto';
import { CreateEpisodeRatingDto } from './dto/create-episode-rating.dto';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { Public } from '../common/decorators/public.decorator';
import { LoggerService } from '../logger/logger.service';

@ApiTags('Ratings')
@Controller()
export class RatingsController {
  constructor(
    private readonly ratingsService: RatingsService,
    private readonly logger: LoggerService,
  ) {}

  // ---------------------------------------------------------------------------
  // Work Ratings
  // ---------------------------------------------------------------------------

  @Public()
  @Get('works/:workId/ratings')
  @ApiOperation({ summary: '작품 평점 통계 조회' })
  @ApiParam({ name: 'workId', description: '작품 ID' })
  @ApiResponse({ status: 200, description: '평점 통계 반환' })
  async getRatingStats(
    @Param('workId') workId: string,
    @CurrentUser('userId') userId?: string,
  ) {
    this.logger.log(
      `GET /works/${workId}/ratings - userId: ${userId ?? 'anonymous'}`,
      'RatingsController',
    );
    try {
      const result = await this.ratingsService.getRatingStats(workId, userId);
      this.logger.log(
        `GET /works/${workId}/ratings - 성공`,
        'RatingsController',
      );
      return result;
    } catch (error) {
      this.logger.error(
        `GET /works/${workId}/ratings - 실패: ${error.message}`,
        error.stack,
        'RatingsController',
      );
      throw error;
    }
  }

  @ApiBearerAuth()
  @Post('works/:workId/ratings')
  @ApiOperation({ summary: '작품 평점 등록/수정' })
  @ApiParam({ name: 'workId', description: '작품 ID' })
  @ApiResponse({ status: 201, description: '평점 등록 성공, 업데이트된 통계 반환' })
  @ApiResponse({ status: 401, description: '인증 필요' })
  @ApiResponse({ status: 404, description: '작품을 찾을 수 없음' })
  async submitRating(
    @Param('workId') workId: string,
    @CurrentUser('userId') userId: string,
    @Body() createRatingDto: CreateRatingDto,
  ) {
    this.logger.log(
      `POST /works/${workId}/ratings - userId: ${userId}, score: ${createRatingDto.score}`,
      'RatingsController',
    );
    try {
      const result = await this.ratingsService.submitRating(
        workId,
        userId,
        createRatingDto.score,
      );
      this.logger.log(
        `POST /works/${workId}/ratings - 성공`,
        'RatingsController',
      );
      return result;
    } catch (error) {
      this.logger.error(
        `POST /works/${workId}/ratings - 실패: ${error.message}`,
        error.stack,
        'RatingsController',
      );
      throw error;
    }
  }

  // ---------------------------------------------------------------------------
  // Episode Ratings
  // ---------------------------------------------------------------------------

  @Public()
  @Get('works/:workId/episodes/:episodeId/ratings')
  @ApiOperation({ summary: '에피소드 평점 통계 조회' })
  @ApiParam({ name: 'workId', description: '작품 ID' })
  @ApiParam({ name: 'episodeId', description: '에피소드 ID' })
  @ApiResponse({ status: 200, description: '에피소드 평점 통계 반환' })
  async getEpisodeRatingStats(
    @Param('workId') workId: string,
    @Param('episodeId') episodeId: string,
    @CurrentUser('userId') userId?: string,
  ) {
    this.logger.log(
      `GET /works/${workId}/episodes/${episodeId}/ratings - userId: ${userId ?? 'anonymous'}`,
      'RatingsController',
    );
    try {
      const result = await this.ratingsService.getEpisodeRatingStats(workId, episodeId, userId);
      this.logger.log(
        `GET /works/${workId}/episodes/${episodeId}/ratings - 성공`,
        'RatingsController',
      );
      return result;
    } catch (error) {
      this.logger.error(
        `GET /works/${workId}/episodes/${episodeId}/ratings - 실패: ${error.message}`,
        error.stack,
        'RatingsController',
      );
      throw error;
    }
  }

  @ApiBearerAuth()
  @Post('works/:workId/episodes/:episodeId/ratings')
  @ApiOperation({ summary: '에피소드 평점 등록/수정' })
  @ApiParam({ name: 'workId', description: '작품 ID' })
  @ApiParam({ name: 'episodeId', description: '에피소드 ID' })
  @ApiResponse({ status: 201, description: '에피소드 평점 등록 성공' })
  @ApiResponse({ status: 401, description: '인증 필요' })
  @ApiResponse({ status: 404, description: '에피소드를 찾을 수 없음' })
  async submitEpisodeRating(
    @Param('workId') workId: string,
    @Param('episodeId') episodeId: string,
    @CurrentUser('userId') userId: string,
    @Body() dto: CreateEpisodeRatingDto,
  ) {
    this.logger.log(
      `POST /works/${workId}/episodes/${episodeId}/ratings - userId: ${userId}, score: ${dto.score}`,
      'RatingsController',
    );
    try {
      const result = await this.ratingsService.submitEpisodeRating(
        workId,
        episodeId,
        userId,
        dto.score,
      );
      this.logger.log(
        `POST /works/${workId}/episodes/${episodeId}/ratings - 성공`,
        'RatingsController',
      );
      return result;
    } catch (error) {
      this.logger.error(
        `POST /works/${workId}/episodes/${episodeId}/ratings - 실패: ${error.message}`,
        error.stack,
        'RatingsController',
      );
      throw error;
    }
  }
}
