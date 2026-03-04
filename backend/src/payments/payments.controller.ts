import { Controller, Post, Get, Body, Query, Param } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation, ApiParam, ApiResponse } from '@nestjs/swagger';
import { PaymentsService } from './payments.service';
import { ChargeTokensDto } from './dto/charge-tokens.dto';
import { PurchaseEpisodeDto } from './dto/purchase-episode.dto';
import { WithdrawTokensDto } from './dto/withdraw-tokens.dto';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { Public } from '../common/decorators/public.decorator';
import { Roles } from '../common/decorators/roles.decorator';
import { TOKEN_PACKAGES } from '../common/types/payment';
import { UserRole } from '../common/schemas/user.schema';

@ApiTags('Payments')
@ApiBearerAuth()
@Controller('payments')
export class PaymentsController {
  constructor(private readonly paymentsService: PaymentsService) {}

  @Public()
  @Get('packages')
  @ApiOperation({ summary: '토큰 패키지 목록 조회' })
  getPackages() {
    return TOKEN_PACKAGES;
  }

  @Post('charge')
  @ApiOperation({ summary: '토큰 충전' })
  async charge(
    @CurrentUser('userId') userId: string,
    @Body() dto: ChargeTokensDto,
  ) {
    return this.paymentsService.chargeTokens(userId, dto.packageId, dto.idempotencyKey);
  }

  @Post('purchase')
  @ApiOperation({ summary: '에피소드 구매' })
  async purchase(
    @CurrentUser('userId') userId: string,
    @Body() dto: PurchaseEpisodeDto,
  ) {
    return this.paymentsService.purchaseEpisode(userId, dto.episodeId);
  }

  @Get('check-purchase/:episodeId')
  @ApiOperation({ summary: '에피소드 구매 여부 확인' })
  @ApiParam({ name: 'episodeId', description: '에피소드 ID' })
  async checkPurchase(
    @CurrentUser('userId') userId: string,
    @Param('episodeId') episodeId: string,
  ) {
    const purchased = await this.paymentsService.checkPurchase(userId, episodeId);
    return { purchased };
  }

  @Get('purchased-episodes')
  @ApiOperation({ summary: '작품별 구매한 에피소드 ID 목록' })
  async purchasedEpisodes(
    @CurrentUser('userId') userId: string,
    @Query('workId') workId: string,
  ) {
    const episodeIds = await this.paymentsService.getPurchasedEpisodeIds(userId, workId);
    return { episodeIds };
  }

  @Post('withdraw')
  @Roles(UserRole.AUTHOR)
  @ApiOperation({ summary: '작가 토큰 출금' })
  async withdraw(
    @CurrentUser('userId') userId: string,
    @Body() dto: WithdrawTokensDto,
  ) {
    return this.paymentsService.withdrawTokens(userId, dto.amount, dto.idempotencyKey);
  }

  @Get('author/earnings')
  @Roles(UserRole.AUTHOR)
  @ApiOperation({ summary: '작가 수익 조회' })
  async authorEarnings(@CurrentUser('userId') userId: string) {
    return this.paymentsService.getAuthorEarnings(userId);
  }

  @Get('author/earnings-summary')
  @Roles(UserRole.AUTHOR)
  @ApiOperation({ summary: '작가 수익 집계 (일자별/시간별)' })
  async earningsSummary(
    @CurrentUser('userId') userId: string,
    @Query('groupBy') groupBy?: string,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
  ) {
    const mode = groupBy === 'hourly' ? 'hourly' : 'daily';
    return this.paymentsService.getEarningsSummary(userId, mode, startDate, endDate);
  }

  @Get('transactions')
  @ApiOperation({ summary: '거래 내역 조회' })
  async transactions(
    @CurrentUser('userId') userId: string,
    @Query('page') page?: number,
    @Query('limit') limit?: number,
  ) {
    return this.paymentsService.getTransactionHistory(userId, page, limit);
  }
}
