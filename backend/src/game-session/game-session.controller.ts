import { Body, Controller, Post } from '@nestjs/common';
import { EndSessionDto } from './dto/end-session.dto';
import { StartSessionDto } from './dto/start-session.dto';
import { GameSessionService } from './game-session.service';

@Controller('game-sessions')
export class GameSessionController {
  constructor(private readonly gameSessions: GameSessionService) {}

  @Post('start')
  start(@Body() dto: StartSessionDto) {
    return this.gameSessions.start(dto.childId, dto.gameId);
  }

  @Post('end')
  end(@Body() dto: EndSessionDto) {
    return this.gameSessions.end(dto.sessionId);
  }
}
