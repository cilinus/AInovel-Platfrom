import { Controller, Get, Patch, Body } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { UsersService } from './users.service';
import { CurrentUser } from '../common/decorators/current-user.decorator';

@ApiTags('Users')
@ApiBearerAuth()
@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

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
}
