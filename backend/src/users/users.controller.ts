import { Controller, Get, Patch, Body, Query } from '@nestjs/common';
import {
  ApiTags,
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
} from '@nestjs/swagger';
import { UsersService } from './users.service';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { LoggerService } from '../logger/logger.service';

@ApiTags('Users')
@ApiBearerAuth()
@Controller('users')
export class UsersController {
  constructor(
    private readonly usersService: UsersService,
    private readonly logger: LoggerService,
  ) {}

  @Get('me')
  @ApiOperation({ summary: '내 정보 조회' })
  async getMe(@CurrentUser('userId') userId: string) {
    return this.usersService.findById(userId);
  }

  @Patch('me')
  @ApiOperation({ summary: '프로필 수정' })
  async updateMe(
    @CurrentUser('userId') userId: string,
    @Body() body: { nickname?: string; profileImage?: string },
  ) {
    return this.usersService.updateProfile(userId, body);
  }

  @Get('me/tokens')
  @ApiOperation({ summary: '토큰 잔액 조회' })
  async getTokenBalance(@CurrentUser('userId') userId: string) {
    return { balance: await this.usersService.getTokenBalance(userId) };
  }

  @Get('me/reading-history')
  @ApiOperation({ summary: '읽기 기록 조회' })
  @ApiResponse({ status: 200, description: '읽기 기록 배열 반환' })
  async getReadingHistory(@CurrentUser('userId') userId: string) {
    this.logger.log(
      `GET /users/me/reading-history - userId: ${userId}`,
      'UsersController',
    );
    return this.usersService.getReadingHistory(userId);
  }

  @Get('me/purchases')
  @ApiOperation({ summary: '구매 내역 조회' })
  @ApiResponse({ status: 200, description: '구매 내역 목록 반환' })
  async getPurchases(
    @CurrentUser('userId') userId: string,
    @Query('page') page?: number,
    @Query('limit') limit?: number,
  ) {
    this.logger.log(
      `GET /users/me/purchases - userId: ${userId}`,
      'UsersController',
    );
    return this.usersService.getUserPurchases(userId, page, limit);
  }
}
