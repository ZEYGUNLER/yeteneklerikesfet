import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { PrismaModule } from './prisma/prisma.module';
import { AuthModule } from './auth/auth.module';
import { ChildModule } from './child/child.module';
import { GamesModule } from './games/games.module';
import { GameSessionModule } from './game-session/game-session.module';
import { AnalyticsModule } from './modules/analytics/analytics.module';

@Module({
  imports: [
    PrismaModule,
    AuthModule,
    ChildModule,
    GamesModule,
    GameSessionModule,
    AnalyticsModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
