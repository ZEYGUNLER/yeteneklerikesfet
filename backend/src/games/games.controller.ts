import { Controller, Get } from '@nestjs/common';

@Controller('games')
export class GamesController {
  @Get()
  getGames() {
    return [
      {
        id: 'game_1',
        name: 'Memory Match',
        category: 'memory',
        difficulty: 'easy',
      },
      {
        id: 'game_2',
        name: 'Math Sprint',
        category: 'math',
        difficulty: 'medium',
      },
    ];
  }
}