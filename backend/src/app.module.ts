import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { MongooseModule } from '@nestjs/mongoose';
import { ThrottlerModule } from '@nestjs/throttler';
import { BullModule } from '@nestjs/bull';

import { AuthModule } from './auth/auth.module';
import { UsersModule } from './users/users.module';
import { WorksModule } from './works/works.module';
import { EpisodesModule } from './episodes/episodes.module';
import { PaymentsModule } from './payments/payments.module';
import { AIModule } from './ai/ai.module';
import { AdminModule } from './admin/admin.module';
import { CommentsModule } from './comments/comments.module';
import { RatingsModule } from './ratings/ratings.module';
import { BookmarksModule } from './bookmarks/bookmarks.module';
import { CommonModule } from './common/common.module';
import { LoggerModule } from './logger/logger.module';
import { WebSocketModule } from './websocket/websocket.module';

@Module({
  imports: [
    // Config
    ConfigModule.forRoot({ isGlobal: true }),

    // MongoDB
    MongooseModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        uri: config.get<string>('MONGODB_URI'),
      }),
    }),

    // Rate limiting
    ThrottlerModule.forRoot([{ ttl: 60_000, limit: 60 }]),

    // Bull (Redis queue)
    BullModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        redis: {
          host: config.get('REDIS_HOST', 'localhost'),
          port: config.get<number>('REDIS_PORT', 6379),
        },
      }),
    }),

    // Infrastructure modules
    LoggerModule,
    WebSocketModule,

    // Feature modules
    CommonModule,
    AuthModule,
    UsersModule,
    WorksModule,
    EpisodesModule,
    PaymentsModule,
    AIModule,
    AdminModule,
    CommentsModule,
    RatingsModule,
    BookmarksModule,
  ],
})
export class AppModule {}
