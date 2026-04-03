import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';

import { PrismaModule } from './prisma/prisma.module';
import { AuthModule } from './modules/auth/auth.module';
import { ChildModule } from './modules/child/child.module';
import { GamesModule } from './modules/games/games.module';
import { GameSessionModule } from './modules/game-session/game-session.module';
import { AnalyticsModule } from './modules/analytics/analytics.module';
import { NotificationModule } from './modules/notification/notification.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    PrismaModule,
    AuthModule,
    ChildModule,
    GamesModule,
    GameSessionModule,
    AnalyticsModule,
    NotificationModule,
  ],
})
export class AppModule {}