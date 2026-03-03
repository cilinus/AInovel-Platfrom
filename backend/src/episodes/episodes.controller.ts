import { Controller, Get, Post, Patch, Param, Body, Query } from '@nestjs/common';
import {
  ApiTags,
  ApiBearerAuth,
  ApiOperation,
  ApiParam,
  ApiResponse,
} from '@nestjs/swagger';
import { EpisodesService } from './episodes.service';
import { CreateEpisodeDto } from './dto/create-episode.dto';
import { UpdateEpisodeDto } from './dto/update-episode.dto';
import { ReorderEpisodesDto } from './dto/reorder-episodes.dto';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { Public } from '../common/decorators/public.decorator';
import { LoggerService } from '../logger/logger.service';

@ApiTags('Episodes')
@Controller('works/:workId/episodes')
export class EpisodesController {
  constructor(
    private readonly episodesService: EpisodesService,
    private readonly logger: LoggerService,
  ) {}

  @Public()
  @Get()
  @ApiOperation({ summary: '회차 목록 조회' })
  @ApiParam({ name: 'workId', description: '작품 ID' })
  @ApiResponse({ status: 200, description: '회차 목록 반환' })
  async list(
    @Param('workId') workId: string,
    @Query('page') page?: number,
    @Query('limit') limit?: number,
  ) {
    return this.episodesService.listByWork(workId, page, limit);
  }

  // --- Static routes MUST be declared before :episodeId param routes ---

  @Patch('reorder')
  @ApiBearerAuth()
  @ApiOperation({ summary: '에피소드 순서 변경' })
  @ApiParam({ name: 'workId', description: '작품 ID' })
  @ApiResponse({ status: 200, description: '순서 변경 성공' })
  @ApiResponse({ status: 400, description: '유효하지 않은 순서 데이터' })
  @ApiResponse({ status: 403, description: '작품의 작가가 아닌 경우' })
  async reorder(
    @Param('workId') workId: string,
    @CurrentUser('userId') userId: string,
    @Body() reorderDto: ReorderEpisodesDto,
  ) {
    this.logger.log(
      `PATCH /works/${workId}/episodes/reorder - userId: ${userId}, orders: ${reorderDto.orders.length}`,
      'EpisodesController',
    );
    return this.episodesService.reorder(workId, userId, reorderDto);
  }

  @Get('author')
  @ApiBearerAuth()
  @ApiOperation({ summary: '작가용 전체 에피소드 목록 (비공개 포함)' })
  @ApiParam({ name: 'workId', description: '작품 ID' })
  @ApiResponse({ status: 200, description: '전체 에피소드 목록 반환' })
  @ApiResponse({ status: 403, description: '작품의 작가가 아닌 경우' })
  async listAllByWork(
    @Param('workId') workId: string,
    @CurrentUser('userId') userId: string,
    @Query('page') page?: number,
    @Query('limit') limit?: number,
  ) {
    this.logger.log(
      `GET /works/${workId}/episodes/author - userId: ${userId}`,
      'EpisodesController',
    );
    return this.episodesService.listAllByWork(workId, userId, page, limit);
  }

  // --- Parameterized :episodeId routes ---

  @Public()
  @Get(':episodeId/navigation')
  @ApiOperation({ summary: '이전화/다음화 네비게이션 조회' })
  @ApiParam({ name: 'workId', description: '작품 ID' })
  @ApiParam({ name: 'episodeId', description: '회차 ID' })
  @ApiResponse({ status: 200, description: '이전/다음 에피소드 정보 반환' })
  async getNavigation(
    @Param('workId') workId: string,
    @Param('episodeId') episodeId: string,
  ) {
    return this.episodesService.getNavigation(workId, episodeId);
  }

  @Get(':episodeId')
  @ApiBearerAuth()
  @ApiOperation({ summary: '회차 내용 조회 (구매 필요)' })
  @ApiParam({ name: 'workId', description: '작품 ID' })
  @ApiParam({ name: 'episodeId', description: '회차 ID' })
  @ApiResponse({ status: 200, description: '회차 내용 반환' })
  @ApiResponse({ status: 404, description: '회차를 찾을 수 없음' })
  async getContent(@Param('episodeId') episodeId: string) {
    return this.episodesService.getContent(episodeId);
  }

  @Post()
  @ApiBearerAuth()
  @ApiOperation({ summary: '회차 생성' })
  @ApiParam({ name: 'workId', description: '작품 ID' })
  @ApiResponse({ status: 201, description: '회차 생성 성공' })
  @ApiResponse({ status: 403, description: '작품의 작가가 아닌 경우' })
  @ApiResponse({ status: 404, description: '작품을 찾을 수 없음' })
  async create(
    @Param('workId') workId: string,
    @CurrentUser('userId') userId: string,
    @Body() createEpisodeDto: CreateEpisodeDto,
  ) {
    return this.episodesService.create(workId, userId, createEpisodeDto);
  }

  @Patch(':episodeId')
  @ApiBearerAuth()
  @ApiOperation({ summary: '회차 수정' })
  @ApiParam({ name: 'workId', description: '작품 ID' })
  @ApiParam({ name: 'episodeId', description: '회차 ID' })
  @ApiResponse({ status: 200, description: '회차 수정 성공' })
  @ApiResponse({ status: 403, description: '작품의 작가가 아닌 경우' })
  @ApiResponse({ status: 404, description: '회차를 찾을 수 없음' })
  async update(
    @Param('workId') workId: string,
    @Param('episodeId') episodeId: string,
    @CurrentUser('userId') userId: string,
    @Body() updateEpisodeDto: UpdateEpisodeDto,
  ) {
    this.logger.log(
      `PATCH /works/${workId}/episodes/${episodeId} - userId: ${userId}`,
      'EpisodesController',
    );
    return this.episodesService.update(episodeId, workId, userId, updateEpisodeDto);
  }
}
