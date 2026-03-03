import { Controller, Get, Post, Param, Query } from '@nestjs/common';
import {
  ApiTags,
  ApiBearerAuth,
  ApiOperation,
  ApiParam,
  ApiResponse,
} from '@nestjs/swagger';
import { BookmarksService } from './bookmarks.service';
import { CurrentUser } from '../common/decorators/current-user.decorator';

@ApiTags('Bookmarks')
@ApiBearerAuth()
@Controller('users/me/bookmarks')
export class BookmarksController {
  constructor(private readonly bookmarksService: BookmarksService) {}

  @Post(':workId')
  @ApiOperation({ summary: '북마크 토글 (추가/삭제)' })
  @ApiParam({ name: 'workId', description: '작품 ID' })
  @ApiResponse({ status: 200, description: '북마크 상태 반환' })
  async toggle(
    @CurrentUser('userId') userId: string,
    @Param('workId') workId: string,
  ) {
    return this.bookmarksService.toggle(userId, workId);
  }

  @Get()
  @ApiOperation({ summary: '북마크 목록 조회' })
  @ApiResponse({ status: 200, description: '북마크 목록 반환' })
  async list(
    @CurrentUser('userId') userId: string,
    @Query('page') page?: number,
    @Query('limit') limit?: number,
  ) {
    return this.bookmarksService.list(userId, page, limit);
  }

  @Get(':workId/status')
  @ApiOperation({ summary: '북마크 여부 확인' })
  @ApiParam({ name: 'workId', description: '작품 ID' })
  @ApiResponse({ status: 200, description: '북마크 여부 반환' })
  async status(
    @CurrentUser('userId') userId: string,
    @Param('workId') workId: string,
  ) {
    return this.bookmarksService.isBookmarked(userId, workId);
  }
}
