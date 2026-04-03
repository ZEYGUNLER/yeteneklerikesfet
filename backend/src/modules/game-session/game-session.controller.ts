import { Body, Controller, Post } from '@nestjs/common';
import { GameSessionService } from './game-session.service';
import { StartSessionDto } from './dto/start-session.dto';
import { EndSessionDto } from './dto/end-session.dto';

@Controller('game-sessions')
export class GameSessionController {
  constructor(private readonly gameSessionService: GameSessionService) {}

  @Post('start')
  start(@Body() dto: StartSessionDto) {
    return this.gameSessionService.startSession(dto);
  }

  @Post('end')
  end(@Body() dto: EndSessionDto) {
    return this.gameSessionService.endSession(dto);
  }
}