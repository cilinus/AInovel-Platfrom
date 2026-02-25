import {
  Controller,
  Get,
  Post,
  Patch,
  Param,
  Body,
  Query,
} from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { WorksService } from './works.service';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { Public } from '../common/decorators/public.decorator';
import { WorkStatus } from '../common/schemas/work.schema';

@ApiTags('Works')
@Controller('works')
export class WorksController {
  constructor(private readonly worksService: WorksService) {}

  @Public()
  @Get()
  @ApiOperation({ summary: '작품 목록 조회' })
  async list(
    @Query('genre') genre?: string,
    @Query('status') status?: WorkStatus,
    @Query('sort') sort?: string,
    @Query('page') page?: number,
    @Query('limit') limit?: number,
  ) {
    return this.worksService.list({ genre, status, sort, page, limit });
  }

  @Public()
  @Get('search')
  @ApiOperation({ summary: '작품 검색' })
  async search(
    @Query('q') query: string,
    @Query('page') page?: number,
    @Query('limit') limit?: number,
  ) {
    return this.worksService.search(query, page, limit);
  }

  @Public()
  @Get(':id')
  @ApiOperation({ summary: '작품 상세 조회' })
  async findOne(@Param('id') id: string) {
    const work = await this.worksService.findById(id);
    await this.worksService.incrementView(id);
    return work;
  }

  @ApiBearerAuth()
  @Post()
  @ApiOperation({ summary: '작품 생성' })
  async create(
    @CurrentUser('userId') userId: string,
    @Body() body: Partial<Record<string, any>>,
  ) {
    return this.worksService.create(userId, body);
  }
}
