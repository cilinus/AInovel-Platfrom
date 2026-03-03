import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { User, UserDocument } from '../common/schemas/user.schema';
import {
  ReadingHistory,
  ReadingHistoryDocument,
} from '../common/schemas/reading-history.schema';
import { Purchase, PurchaseDocument } from '../payments/schemas/purchase.schema';
import { LoggerService } from '../logger/logger.service';

@Injectable()
export class UsersService {
  constructor(
    @InjectModel(User.name) private userModel: Model<UserDocument>,
    @InjectModel(ReadingHistory.name)
    private readingHistoryModel: Model<ReadingHistoryDocument>,
    @InjectModel(Purchase.name) private purchaseModel: Model<PurchaseDocument>,
    private readonly logger: LoggerService,
  ) {}

  async findById(id: string): Promise<UserDocument> {
    const user = await this.userModel.findById(id);
    if (!user) throw new NotFoundException('User not found');
    return user;
  }

  async updateProfile(
    userId: string,
    data: { nickname?: string; profileImage?: string },
  ): Promise<UserDocument> {
    const user = await this.userModel.findByIdAndUpdate(userId, data, {
      new: true,
    });
    if (!user) throw new NotFoundException('User not found');
    return user;
  }

  async getTokenBalance(userId: string): Promise<number> {
    const user = await this.findById(userId);
    return user.tokenBalance;
  }

  async getReadingHistory(userId: string) {
    this.logger.debug(
      `users.getReadingHistory - userId: ${userId}`,
      'UsersService',
    );

    const items = await this.readingHistoryModel
      .find({ userId })
      .sort({ lastReadAt: -1 })
      .limit(20)
      .lean();

    this.logger.debug(
      `users.getReadingHistory - found: ${items.length}`,
      'UsersService',
    );

    return items.map((item) => ({
      workId: item.workId.toString(),
      lastEpisodeId: item.lastEpisodeId.toString(),
      lastEpisodeNumber: item.lastEpisodeNumber,
      progress: item.progress,
      lastReadAt: item.lastReadAt.toISOString(),
    }));
  }

  async upsertReadingHistory(
    userId: string,
    workId: string,
    episodeId: string,
    episodeNumber: number,
    totalEpisodes: number,
  ) {
    this.logger.debug(
      `users.upsertReadingHistory - userId: ${userId}, workId: ${workId}, episodeNumber: ${episodeNumber}`,
      'UsersService',
    );

    const progress =
      totalEpisodes > 0
        ? Math.round((episodeNumber / totalEpisodes) * 100)
        : 0;

    await this.readingHistoryModel.findOneAndUpdate(
      { userId, workId },
      {
        $set: {
          lastEpisodeId: episodeId,
          lastEpisodeNumber: episodeNumber,
          progress,
          lastReadAt: new Date(),
        },
      },
      { upsert: true },
    );
  }

  async getUserPurchases(userId: string, page = 1, limit = 20) {
    this.logger.debug(
      `users.getUserPurchases - userId: ${userId}, page: ${page}, limit: ${limit}`,
      'UsersService',
    );

    const filter = { userId };
    const [rawItems, total] = await Promise.all([
      this.purchaseModel
        .find(filter)
        .sort({ createdAt: -1 })
        .skip((page - 1) * limit)
        .limit(limit)
        .populate('workId', 'title')
        .populate('episodeId', 'title')
        .lean(),
      this.purchaseModel.countDocuments(filter),
    ]);

    this.logger.debug(
      `users.getUserPurchases - found: ${rawItems.length}, total: ${total}`,
      'UsersService',
    );

    const items = rawItems.map((p: any) => ({
      id: p._id.toString(),
      workId: p.workId?._id?.toString() ?? p.workId?.toString() ?? '',
      workTitle: p.workId?.title ?? '',
      episodeId: p.episodeId?._id?.toString() ?? p.episodeId?.toString() ?? '',
      episodeTitle: p.episodeId?.title ?? '',
      price: p.tokenAmount,
      purchasedAt: p.createdAt?.toISOString() ?? '',
    }));

    return { items, total, page, limit };
  }
}
