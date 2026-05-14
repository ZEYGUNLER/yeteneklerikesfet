import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { AnalyticsService, SessionMetrics } from '../modules/analytics/analytics.service';

@Injectable()
export class GameSessionService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly analytics: AnalyticsService,
  ) {}

  async start(userId: string, childId: string, gameId: string) {
    const child = await this.prisma.child.findFirst({
      where: { id: childId, userId },
      select: { id: true },
    });
    if (!child) {
      throw new NotFoundException('Child not found');
    }

    const session = await this.prisma.gameSession.create({
      data: { childId, gameId },
      select: { id: true, childId: true, gameId: true, startTime: true },
    });

    return {
      sessionId: session.id,
      childId: session.childId,
      gameId: session.gameId,
      startedAt: session.startTime,
    };
  }

  async end(userId: string, sessionId: string, metrics?: SessionMetrics) {
    const existing = await this.prisma.gameSession.findFirst({
      where: { id: sessionId, child: { userId } },
      select: { id: true, childId: true, status: true },
    });
    if (!existing) {
      throw new NotFoundException('Session not found');
    }
    if (existing.status === 'COMPLETED') {
      return { success: true, sessionId: existing.id };
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
    return { success: true, sessionId: existing.id };
  }
}
