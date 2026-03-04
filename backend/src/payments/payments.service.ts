import {
  Injectable,
  BadRequestException,
  ConflictException,
  NotFoundException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { User, UserDocument } from '../common/schemas/user.schema';
import { Episode, EpisodeDocument } from '../common/schemas/episode.schema';
import { Work, WorkDocument } from '../common/schemas/work.schema';
import {
  TokenTransaction,
  TokenTransactionDocument,
  TransactionType,
} from './schemas/token-transaction.schema';
import {
  Purchase,
  PurchaseDocument,
} from './schemas/purchase.schema';
import {
  TOKEN_PACKAGES,
  AUTHOR_REVENUE_PERCENT,
  WITHDRAWAL_RATE,
  MIN_WITHDRAWAL_TOKENS,
} from '../common/types/payment';
import { LoggerService } from '../logger/logger.service';

@Injectable()
export class PaymentsService {
  constructor(
    @InjectModel(User.name) private userModel: Model<UserDocument>,
    @InjectModel(TokenTransaction.name)
    private txModel: Model<TokenTransactionDocument>,
    @InjectModel(Purchase.name) private purchaseModel: Model<PurchaseDocument>,
    @InjectModel(Episode.name) private episodeModel: Model<EpisodeDocument>,
    @InjectModel(Work.name) private workModel: Model<WorkDocument>,
    private readonly logger: LoggerService,
  ) {}

  async chargeTokens(userId: string, packageId: string, idempotencyKey: string) {
    this.logger.debug(`payments.chargeTokens - userId: ${userId}, packageId: ${packageId}`, 'PaymentsService');

    const pkg = TOKEN_PACKAGES.find(p => p.id === packageId);
    if (!pkg) {
      this.logger.error(`payments.chargeTokens - invalid package: ${packageId}`, undefined, 'PaymentsService');
      throw new BadRequestException('Invalid package');
    }

    const user = await this.userModel.findByIdAndUpdate(
      userId,
      { $inc: { tokenBalance: pkg.totalTokens } },
      { new: true },
    );
    if (!user) {
      this.logger.error(`payments.chargeTokens - user not found: ${userId}`, undefined, 'PaymentsService');
      throw new BadRequestException('User not found');
    }

    await this.txModel.create({
      userId: new Types.ObjectId(userId),
      type: TransactionType.CHARGE,
      amount: pkg.totalTokens,
      balanceAfter: user.tokenBalance,
      idempotencyKey,
      description: `토큰 충전: ${pkg.label} (보너스 ${pkg.bonusPercent}% 포함)`,
    });

    this.logger.log(`payments.chargeTokens - success: userId=${userId}, charged=${pkg.totalTokens}, balance=${user.tokenBalance}`, 'PaymentsService');
    return { balance: user.tokenBalance, charged: pkg.totalTokens };
  }

  async purchaseEpisode(userId: string, episodeId: string) {
    this.logger.debug(`payments.purchaseEpisode - userId: ${userId}, episodeId: ${episodeId}`, 'PaymentsService');

    const episode = await this.episodeModel.findById(episodeId);
    if (!episode) {
      this.logger.error(`payments.purchaseEpisode - episode not found: ${episodeId}`, undefined, 'PaymentsService');
      throw new NotFoundException('Episode not found');
    }

    // Free episodes: create purchase record with zero amounts
    if (episode.isFree || episode.price === 0) {
      this.logger.debug(`payments.purchaseEpisode - free episode, creating record`, 'PaymentsService');
      const existing = await this.purchaseModel.findOne({ userId, episodeId });
      if (existing) {
        return { balance: 0, free: true };
      }
      await this.purchaseModel.create({
        userId,
        episodeId,
        workId: episode.workId,
        tokenAmount: 0,
        authorRevenue: 0,
        platformFee: 0,
      });
      return { balance: 0, free: true };
    }

    const work = await this.workModel.findById(episode.workId);
    if (!work) {
      this.logger.error(`payments.purchaseEpisode - work not found: ${episode.workId}`, undefined, 'PaymentsService');
      throw new NotFoundException('Work not found');
    }

    if (work.authorId.toString() === userId) {
      this.logger.error(`payments.purchaseEpisode - self-purchase attempt: userId=${userId}`, undefined, 'PaymentsService');
      throw new BadRequestException('본인 작품은 구매할 수 없습니다');
    }

    const existing = await this.purchaseModel.findOne({ userId, episodeId });
    if (existing) {
      this.logger.error(`payments.purchaseEpisode - duplicate purchase: userId=${userId}, episodeId=${episodeId}`, undefined, 'PaymentsService');
      throw new ConflictException('Already purchased');
    }

    const authorRevenue = Math.floor(episode.price * AUTHOR_REVENUE_PERCENT / 100);
    const platformFee = episode.price - authorRevenue;

    // Deduct from buyer (atomic balance check)
    const buyer = await this.userModel.findOneAndUpdate(
      { _id: userId, tokenBalance: { $gte: episode.price } },
      { $inc: { tokenBalance: -episode.price } },
      { new: true },
    );
    if (!buyer) {
      this.logger.error(`payments.purchaseEpisode - insufficient balance: userId=${userId}`, undefined, 'PaymentsService');
      throw new BadRequestException('잔액이 부족합니다');
    }

    // Credit to author
    const author = await this.userModel.findByIdAndUpdate(
      work.authorId,
      { $inc: { tokenBalance: authorRevenue } },
      { new: true },
    );

    // Create purchase record
    await this.purchaseModel.create({
      userId,
      episodeId,
      workId: episode.workId,
      tokenAmount: episode.price,
      authorRevenue,
      platformFee,
    });

    // Buyer PURCHASE transaction
    await this.txModel.create({
      userId: new Types.ObjectId(userId),
      type: TransactionType.PURCHASE,
      amount: -episode.price,
      balanceAfter: buyer.tokenBalance,
      relatedEpisodeId: new Types.ObjectId(episodeId),
      description: '에피소드 구매',
    });

    // Author REVENUE transaction
    await this.txModel.create({
      userId: new Types.ObjectId(work.authorId.toString()),
      type: TransactionType.REVENUE,
      amount: authorRevenue,
      balanceAfter: author.tokenBalance,
      relatedEpisodeId: new Types.ObjectId(episodeId),
      description: '에피소드 수익',
    });

    this.logger.log(
      `payments.purchaseEpisode - success: buyer=${userId}, author=${work.authorId}, price=${episode.price}, authorRevenue=${authorRevenue}`,
      'PaymentsService',
    );
    return { balance: buyer.tokenBalance };
  }

  async withdrawTokens(userId: string, amount: number, idempotencyKey: string) {
    this.logger.debug(`payments.withdrawTokens - userId: ${userId}, amount: ${amount}`, 'PaymentsService');

    if (amount < MIN_WITHDRAWAL_TOKENS) {
      throw new BadRequestException(`최소 ${MIN_WITHDRAWAL_TOKENS} 토큰부터 출금 가능합니다`);
    }

    const cashAmountKRW = Math.floor(amount * WITHDRAWAL_RATE);

    // Atomic balance check and deduct tokens, add KRW
    const user = await this.userModel.findOneAndUpdate(
      { _id: userId, tokenBalance: { $gte: amount } },
      { $inc: { tokenBalance: -amount, krwBalance: cashAmountKRW } },
      { new: true },
    );
    if (!user) {
      this.logger.error(`payments.withdrawTokens - insufficient balance: userId=${userId}`, undefined, 'PaymentsService');
      throw new BadRequestException('잔액이 부족합니다');
    }

    await this.txModel.create({
      userId: new Types.ObjectId(userId),
      type: TransactionType.SETTLEMENT,
      amount: -amount,
      balanceAfter: user.tokenBalance,
      idempotencyKey,
      description: `토큰 출금: ${amount} 토큰 → ${cashAmountKRW.toLocaleString()}원`,
    });

    this.logger.log(`payments.withdrawTokens - success: userId=${userId}, withdrawn=${amount}, cashKRW=${cashAmountKRW}`, 'PaymentsService');
    return { balance: user.tokenBalance, krwBalance: user.krwBalance, withdrawn: amount, cashAmountKRW };
  }

  async getAuthorEarnings(userId: string) {
    this.logger.debug(`payments.getAuthorEarnings - userId: ${userId}`, 'PaymentsService');

    const userIdMatch = { $in: [userId, new Types.ObjectId(userId)] };

    const now = new Date();
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const yesterdayStart = new Date(todayStart);
    yesterdayStart.setDate(yesterdayStart.getDate() - 1);

    const [
      revenueResult, settlementResult,
      todayRevenueResult, yesterdayRevenueResult,
      todaySettlementResult, yesterdaySettlementResult,
    ] = await Promise.all([
      this.txModel.aggregate([
        { $match: { userId: userIdMatch, type: TransactionType.REVENUE } },
        { $group: { _id: null, total: { $sum: '$amount' } } },
      ]),
      this.txModel.aggregate([
        { $match: { userId: userIdMatch, type: TransactionType.SETTLEMENT } },
        { $group: { _id: null, total: { $sum: { $abs: '$amount' } } } },
      ]),
      this.txModel.aggregate([
        { $match: { userId: userIdMatch, type: TransactionType.REVENUE, createdAt: { $gte: todayStart } } },
        { $group: { _id: null, total: { $sum: '$amount' } } },
      ]),
      this.txModel.aggregate([
        { $match: { userId: userIdMatch, type: TransactionType.REVENUE, createdAt: { $gte: yesterdayStart, $lt: todayStart } } },
        { $group: { _id: null, total: { $sum: '$amount' } } },
      ]),
      this.txModel.aggregate([
        { $match: { userId: userIdMatch, type: TransactionType.SETTLEMENT, createdAt: { $gte: todayStart } } },
        { $group: { _id: null, total: { $sum: { $abs: '$amount' } } } },
      ]),
      this.txModel.aggregate([
        { $match: { userId: userIdMatch, type: TransactionType.SETTLEMENT, createdAt: { $gte: yesterdayStart, $lt: todayStart } } },
        { $group: { _id: null, total: { $sum: { $abs: '$amount' } } } },
      ]),
    ]);

    const totalEarned = revenueResult[0]?.total ?? 0;
    const totalWithdrawn = settlementResult[0]?.total ?? 0;
    const todayEarned = todayRevenueResult[0]?.total ?? 0;
    const yesterdayEarned = yesterdayRevenueResult[0]?.total ?? 0;
    const todayWithdrawnTokens = todaySettlementResult[0]?.total ?? 0;
    const yesterdayWithdrawnTokens = yesterdaySettlementResult[0]?.total ?? 0;

    const user = await this.userModel.findById(userId).select('tokenBalance krwBalance').lean();
    const tokenBalance = user?.tokenBalance ?? 0;
    const krwBalance = user?.krwBalance ?? 0;

    const recentTransactions = await this.txModel
      .find({ userId: { $in: [userId, new Types.ObjectId(userId)] }, type: { $in: [TransactionType.REVENUE, TransactionType.SETTLEMENT] } })
      .sort({ createdAt: -1 })
      .limit(20)
      .lean();

    this.logger.debug(
      `payments.getAuthorEarnings - totalEarned=${totalEarned}, todayEarned=${todayEarned}, todayWithdrawn=${todayWithdrawnTokens}`,
      'PaymentsService',
    );
    return {
      totalEarned,
      totalWithdrawn,
      todayEarned,
      yesterdayEarned,
      todayWithdrawnTokens,
      yesterdayWithdrawnTokens,
      tokenBalance,
      krwBalance,
      withdrawalRate: WITHDRAWAL_RATE,
      recentTransactions,
    };
  }

  async getEarningsSummary(
    userId: string,
    groupBy: 'daily' | 'hourly',
    startDate?: string,
    endDate?: string,
  ) {
    this.logger.debug(
      `payments.getEarningsSummary - userId: ${userId}, groupBy: ${groupBy}, start: ${startDate}, end: ${endDate}`,
      'PaymentsService',
    );

    const matchFilter: Record<string, unknown> = {
      userId: { $in: [userId, new Types.ObjectId(userId)] },
      type: TransactionType.REVENUE,
    };

    if (startDate || endDate) {
      const dateFilter: Record<string, Date> = {};
      if (startDate) dateFilter.$gte = new Date(startDate);
      if (endDate) {
        const end = new Date(endDate);
        end.setDate(end.getDate() + 1);
        dateFilter.$lt = end;
      }
      matchFilter.createdAt = dateFilter;
    }

    const dateFormat =
      groupBy === 'hourly'
        ? { $dateToString: { format: '%Y-%m-%d %H:00', date: '$createdAt' } }
        : { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } };

    const results = await this.txModel.aggregate([
      { $match: matchFilter },
      {
        $group: {
          _id: dateFormat,
          totalAmount: { $sum: '$amount' },
          count: { $sum: 1 },
        },
      },
      { $sort: { _id: -1 } },
      { $limit: 200 },
    ]);

    this.logger.debug(
      `payments.getEarningsSummary - results: ${results.length} groups`,
      'PaymentsService',
    );

    return results.map((r) => ({
      period: r._id,
      totalAmount: r.totalAmount,
      count: r.count,
    }));
  }

  async getPurchasedEpisodeIds(userId: string, workId: string): Promise<string[]> {
    this.logger.debug(`payments.getPurchasedEpisodeIds - userId: ${userId}, workId: ${workId}`, 'PaymentsService');

    const purchases = await this.purchaseModel
      .find({ userId, workId })
      .select('episodeId')
      .lean();
    return purchases.map(p => p.episodeId.toString());
  }

  async checkPurchase(userId: string, episodeId: string): Promise<boolean> {
    this.logger.debug(`payments.checkPurchase - userId: ${userId}, episodeId: ${episodeId}`, 'PaymentsService');
    const purchase = await this.purchaseModel.findOne({ userId, episodeId });
    return !!purchase;
  }

  async getTransactionHistory(userId: string, page = 1, limit = 20) {
    this.logger.debug(`payments.getTransactionHistory - userId: ${userId}, page=${page}, limit=${limit}`, 'PaymentsService');

    const [items, total] = await Promise.all([
      this.txModel
        .find({ userId })
        .sort({ createdAt: -1 })
        .skip((page - 1) * limit)
        .limit(limit)
        .lean(),
      this.txModel.countDocuments({ userId }),
    ]);
    return { items, total, page, limit };
  }
}
