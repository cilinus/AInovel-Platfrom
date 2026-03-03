import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { AdminController } from './admin.controller';
import { User, UserSchema } from '../common/schemas/user.schema';
import { Work, WorkSchema } from '../common/schemas/work.schema';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: User.name, schema: UserSchema },
      { name: Work.name, schema: WorkSchema },
    ]),
  ],
  controllers: [AdminController],
})
export class AdminModule {}
