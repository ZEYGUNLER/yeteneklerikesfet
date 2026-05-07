import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { AnalyticsService, SessionMetrics } from '../modules/analytics/analytics.service';

@Injectable()
export class GameSessionService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly analytics: AnalyticsService,
  ) {}

  async start(childId: string, gameId: string) {
    const session = await this.prisma.gameSession.create({
      data: { childId, gameId },
      select: { id: true },
    });
    return { sessionId: session.id };
  }

  async end(sessionId: string, metrics?: SessionMetrics) {
    const existing = await this.prisma.gameSession.findUnique({
      where: { id: sessionId },
    });
    if (!existing) {
      throw new NotFoundException('Session not found');
    }
    if (existing.status === 'COMPLETED') {
      return { success: true };
    }

    const scoreRaw = metrics?.score ?? 0;
    const durationRaw = metrics?.duration ?? 0;
    const accuracyRaw = metrics?.accuracy ?? 0;

    const score = Number(scoreRaw);
    const duration = Number(durationRaw);
    const accuracy = Number(accuracyRaw);

    if (!Number.isFinite(score) || score < 0) {
      throw new BadRequestException('Invalid score');
    }
    if (!Number.isFinite(duration) || duration < 0) {
      throw new BadRequestException('Invalid duration');
    }
    if (!Number.isFinite(accuracy) || accuracy < 0 || accuracy > 1) {
      throw new BadRequestException('Invalid accuracy');
    }

    await this.prisma.gameSession.update({
      where: { id: sessionId },
      data: {
        status: 'COMPLETED',
        endTime: new Date(),
        score,
        duration,
        accuracy,
      },
    });

    await this.analytics.updateSkills(existing.childId, {
      score,
      duration,
      accuracy,
    });

    await this.analytics.createProgressReport(existing.childId, {
      score,
      duration,
      accuracy,
    });
    return { success: true };
  }
}
