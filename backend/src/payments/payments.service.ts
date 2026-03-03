import {
  Injectable,
  BadRequestException,
  ConflictException,
} from '@nestjs/common';
import { InjectModel, InjectConnection } from '@nestjs/mongoose';
import { Model, Connection } from 'mongoose';
import { User, UserDocument } from '../common/schemas/user.schema';
import {
  TokenTransaction,
  TokenTransactionDocument,
  TransactionType,
} from './schemas/token-transaction.schema';
import {
  Purchase,
  PurchaseDocument,
} from './schemas/purchase.schema';

@Injectable()
export class PaymentsService {
  constructor(
    @InjectModel(User.name) private userModel: Model<UserDocument>,
    @InjectModel(TokenTransaction.name)
    private txModel: Model<TokenTransactionDocument>,
    @InjectModel(Purchase.name) private purchaseModel: Model<PurchaseDocument>,
    @InjectConnection() private connection: Connection,
  ) {}

  async chargeTokens(
    userId: string,
    amount: number,
    paymentKey: string,
    idempotencyKey: string,
  ) {
    const session = await this.connection.startSession();
    try {
      session.startTransaction();

      const user = await this.userModel.findByIdAndUpdate(
        userId,
        { $inc: { tokenBalance: amount } },
        { new: true, session },
      );
      if (!user) throw new BadRequestException('User not found');

      await this.txModel.create(
        [
          {
            userId,
            type: TransactionType.CHARGE,
            amount,
            balanceAfter: user.tokenBalance,
            paymentKey,
            idempotencyKey,
          },
        ],
        { session },
      );

      await session.commitTransaction();
      return { balance: user.tokenBalance };
    } catch (error) {
      await session.abortTransaction();
      throw error;
    } finally {
      session.endSession();
    }
  }

  async purchaseEpisode(userId: string, episodeId: string, workId: string, price: number) {
    // Check duplicate
    const existing = await this.purchaseModel.findOne({ userId, episodeId });
    if (existing) throw new ConflictException('Already purchased');

    const session = await this.connection.startSession();
    try {
      session.startTransaction();

      const user = await this.userModel.findOneAndUpdate(
        { _id: userId, tokenBalance: { $gte: price } },
        { $inc: { tokenBalance: -price } },
        { new: true, session },
      );
      if (!user) throw new BadRequestException('Insufficient tokens');

      await this.purchaseModel.create(
        [{ userId, episodeId, workId, tokenAmount: price }],
        { session },
      );

      await this.txModel.create(
        [
          {
            userId,
            type: TransactionType.PURCHASE,
            amount: -price,
            balanceAfter: user.tokenBalance,
            description: `Episode purchase: ${episodeId}`,
          },
        ],
        { session },
      );

      await session.commitTransaction();
      return { balance: user.tokenBalance };
    } catch (error) {
      await session.abortTransaction();
      throw error;
    } finally {
      session.endSession();
    }
  }

  async checkPurchase(userId: string, episodeId: string): Promise<boolean> {
    const purchase = await this.purchaseModel.findOne({ userId, episodeId });
    return !!purchase;
  }

  async getTransactionHistory(userId: string, page = 1, limit = 20) {
    const [items, total] = await Promise.all([
      this.txModel
        .find({ userId })
        .sort({ createdAt: -1 })
        .skip((page - 1) * limit)
        .limit(limit),
      this.txModel.countDocuments({ userId }),
    ]);
    return { items, total, page, limit };
  }
}
