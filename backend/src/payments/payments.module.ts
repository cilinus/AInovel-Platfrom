import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { PaymentsController } from './payments.controller';
import { PaymentsService } from './payments.service';
import {
  TokenTransaction,
  TokenTransactionSchema,
} from './schemas/token-transaction.schema';
import { Purchase, PurchaseSchema } from './schemas/purchase.schema';
import { User, UserSchema } from '../common/schemas/user.schema';
import { Episode, EpisodeSchema } from '../common/schemas/episode.schema';
import { Work, WorkSchema } from '../common/schemas/work.schema';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: TokenTransaction.name, schema: TokenTransactionSchema },
      { name: Purchase.name, schema: PurchaseSchema },
      { name: User.name, schema: UserSchema },
      { name: Episode.name, schema: EpisodeSchema },
      { name: Work.name, schema: WorkSchema },
    ]),
  ],
  controllers: [PaymentsController],
  providers: [PaymentsService],
  exports: [PaymentsService],
})
export class PaymentsModule {}
