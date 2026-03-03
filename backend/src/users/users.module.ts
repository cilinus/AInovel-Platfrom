import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { UsersController } from './users.controller';
import { UsersService } from './users.service';
import { User, UserSchema } from '../common/schemas/user.schema';
import {
  ReadingHistory,
  ReadingHistorySchema,
} from '../common/schemas/reading-history.schema';
import {
  Purchase,
  PurchaseSchema,
} from '../payments/schemas/purchase.schema';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: User.name, schema: UserSchema },
      { name: ReadingHistory.name, schema: ReadingHistorySchema },
      { name: Purchase.name, schema: PurchaseSchema },
    ]),
  ],
  controllers: [UsersController],
  providers: [UsersService],
  exports: [UsersService],
})
export class UsersModule {}
