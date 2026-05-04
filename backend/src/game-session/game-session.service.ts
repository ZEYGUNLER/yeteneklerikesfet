import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class GameSessionService {
  constructor(private readonly prisma: PrismaService) {}

  async start(childId: string, gameId: string) {
    const session = await this.prisma.gameSession.create({
      data: { childId, gameId },
      select: { id: true },
    });
    return { sessionId: session.id };
  }

  async end(sessionId: string) {
    const existing = await this.prisma.gameSession.findUnique({
      where: { id: sessionId },
    });
    if (!existing) {
      throw new NotFoundException('Session not found');
    }
    await this.prisma.gameSession.update({
      where: { id: sessionId },
      data: {
        status: 'COMPLETED',
        endTime: new Date(),
      },
    });
    return { success: true };
  }
}
