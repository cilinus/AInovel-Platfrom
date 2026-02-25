import { Controller, Get, Post, Param, Body, Query } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { EpisodesService } from './episodes.service';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { Public } from '../common/decorators/public.decorator';

@ApiTags('Episodes')
@Controller('works/:workId/episodes')
export class EpisodesController {
  constructor(private readonly episodesService: EpisodesService) {}

  @Public()
  @Get()
  @ApiOperation({ summary: '회차 목록 조회' })
  async list(
    @Param('workId') workId: string,
    @Query('page') page?: number,
    @Query('limit') limit?: number,
  ) {
    return this.episodesService.listByWork(workId, page, limit);
  }

  @Get(':episodeId')
  @ApiBearerAuth()
  @ApiOperation({ summary: '회차 내용 조회 (구매 필요)' })
  async getContent(@Param('episodeId') episodeId: string) {
    return this.episodesService.getContent(episodeId);
  }

  @Post()
  @ApiBearerAuth()
  @ApiOperation({ summary: '회차 생성' })
  async create(
    @Param('workId') workId: string,
    @CurrentUser('userId') userId: string,
    @Body() body: { title: string; content: string; isFree?: boolean },
  ) {
    return this.episodesService.create(workId, userId, body);
  }
}
