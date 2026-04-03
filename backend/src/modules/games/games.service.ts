import { Injectable } from '@nestjs/common';

@Injectable()
export class GamesService {
  async findAll() {
    return [
      {
        id: 'ext-game-1',
        title: 'Memory Match',
        gameUrl: 'https://example.com/games/memory-match',
        category: 'memory',
      },
      {
        id: 'ext-game-2',
        title: 'Shape Logic',
        gameUrl: 'https://example.com/games/shape-logic',
        category: 'logic',
      },
    ];
  }
}