import { Body, Controller, Post, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { CurrentUser, type CurrentUserPayload } from '../common/decorators/current-user.decorator';
import { EndSessionDto } from './dto/end-session.dto';
import { StartSessionDto } from './dto/start-session.dto';
import { GameSessionService } from './game-session.service';

@UseGuards(JwtAuthGuard)
@Controller('game-sessions')
export class GameSessionController {
  constructor(private readonly gameSessions: GameSessionService) {}

  @Post('start')
  start(@CurrentUser() user: CurrentUserPayload, @Body() dto: StartSessionDto) {
    return this.gameSessions.start(user.sub, dto.childId, dto.gameId);
  }

  @Post('end')
  end(@CurrentUser() user: CurrentUserPayload, @Body() dto: EndSessionDto) {
    return this.gameSessions.end(user.sub, dto.sessionId, {
      score: dto.score ?? 0,
      duration: dto.duration ?? 0,
      accuracy: dto.accuracy ?? 0,
      metadata: dto.metadata,
    });
  }
}
