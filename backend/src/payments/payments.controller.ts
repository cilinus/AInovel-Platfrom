import { Controller, Post, Get, Body, Query } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { PaymentsService } from './payments.service';
import { CurrentUser } from '../common/decorators/current-user.decorator';

@ApiTags('Payments')
@ApiBearerAuth()
@Controller('payments')
export class PaymentsController {
  constructor(private readonly paymentsService: PaymentsService) {}

  @Post('charge')
  @ApiOperation({ summary: '토큰 충전 (결제 확인 후)' })
  async charge(
    @CurrentUser('userId') userId: string,
    @Body()
    body: { amount: number; paymentKey: string; idempotencyKey: string },
  ) {
    return this.paymentsService.chargeTokens(
      userId,
      body.amount,
      body.paymentKey,
      body.idempotencyKey,
    );
  }

  @Post('purchase')
  @ApiOperation({ summary: '에피소드 구매' })
  async purchase(
    @CurrentUser('userId') userId: string,
    @Body() body: { episodeId: string; workId: string; price: number },
  ) {
    return this.paymentsService.purchaseEpisode(
      userId,
      body.episodeId,
      body.workId,
      body.price,
    );
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
