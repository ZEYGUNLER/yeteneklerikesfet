import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

export type SessionMetrics = {
  score: number;
  duration: number;
  accuracy: number;
  metadata?: Record<string, any>;
};

@Injectable()
export class AnalyticsService {
  constructor(private readonly prisma: PrismaService) {}

  async updateSkills(childId: string, metrics: SessionMetrics) {
    const child = await this.prisma.child.findUnique({ where: { id: childId } });
    if (!child) {
      throw new NotFoundException('Child not found');
    }

    const score = Number(metrics.score ?? 0) || 0;
    const duration = Number(metrics.duration ?? 0) || 0;
    const accuracy = Number(metrics.accuracy ?? 0) || 0;

    const memoryDelta = score * 0.1;
    const attentionDelta = duration * 0.05;
    const logicDelta = accuracy * 10;

    return this.prisma.skillProfile.upsert({
      where: { childId },
      create: {
        childId,
        memory: memoryDelta,
        attention: attentionDelta,
        logic: logicDelta,
      },
      update: {
        memory: { increment: memoryDelta },
        attention: { increment: attentionDelta },
        logic: { increment: logicDelta },
      },
      select: {
        childId: true,
        memory: true,
        attention: true,
        logic: true,
        createdAt: true,
        updatedAt: true,
      },
    });
  }

  async createProgressReport(childId: string, metrics: SessionMetrics) {
    // Safety: if child is missing, behave like other analytics endpoints
    const child = await this.prisma.child.findUnique({ where: { id: childId } });
    if (!child) {
      throw new NotFoundException('Child not found');
    }

    const profile = await this.prisma.skillProfile.findUnique({
      where: { childId },
      select: { memory: true, attention: true, logic: true },
    });

    // Safety: do not crash the session end flow if profile doesn't exist yet
    if (!profile) {
      return null;
    }

    const score = Number(metrics.score ?? 0) || 0;
    const duration = Number(metrics.duration ?? 0) || 0;

    return this.prisma.progressReport.create({
      data: {
        childId,
        memory: profile.memory,
        attention: profile.attention,
        logic: profile.logic,
        score,
        duration,
      },
      select: { id: true, createdAt: true },
    });
  }

  async getProgress(childId: string, opts?: { limit?: number; days?: number }) {
    const child = await this.prisma.child.findUnique({ where: { id: childId } });
    if (!child) {
      throw new NotFoundException('Child not found');
    }

    const limit =
      opts?.limit === undefined ? undefined : Math.max(1, Math.floor(opts.limit));
    const days =
      opts?.days === undefined ? undefined : Math.max(1, Math.floor(opts.days));

    const createdAtGte =
      days === undefined
        ? undefined
        : new Date(Date.now() - days * 24 * 60 * 60 * 1000);

    // If `limit` is used, we must fetch latest N (DESC) then return ASC for frontend.
    const reports = await this.prisma.progressReport.findMany({
      where: {
        childId,
        ...(createdAtGte ? { createdAt: { gte: createdAtGte } } : {}),
      },
      orderBy: { createdAt: limit ? 'desc' : 'asc' },
      take: limit,
      select: {
        createdAt: true,
        memory: true,
        attention: true,
        logic: true,
      },
    });

    const ordered = limit ? reports.reverse() : reports;

    return ordered.map((r) => ({
      date: r.createdAt,
      memory: r.memory,
      attention: r.attention,
      logic: r.logic,
    }));
  }

  async getSkillProfile(childId: string) {
    const child = await this.prisma.child.findUnique({ where: { id: childId } });
    if (!child) {
      throw new NotFoundException('Child not found');
    }

    const profile = await this.prisma.skillProfile.findUnique({
      where: { childId },
      select: { memory: true, attention: true, logic: true },
    });

    return (
      profile ?? {
        memory: 0,
        attention: 0,
        logic: 0,
      }
    );
  }

  async getDashboard(childId: string) {
    const skillProfile = await this.getSkillProfile(childId);

    const entries: Array<[keyof typeof skillProfile, number]> = [
      ['memory', skillProfile.memory],
      ['attention', skillProfile.attention],
      ['logic', skillProfile.logic],
    ];
    const [topSkill] = entries.sort((a, b) => b[1] - a[1])[0] ?? ['memory', 0];

    const message =
      topSkill === 'memory'
        ? 'Hafıza becerisi gelişiyor'
        : topSkill === 'attention'
          ? 'Dikkat becerisi gelişiyor'
          : 'Mantık becerisi gelişiyor';

    return { skillProfile, message };
  }

  async getPlanningSessions(childId: string) {
    const child = await this.prisma.child.findUnique({ where: { id: childId } });
    if (!child) {
      throw new NotFoundException('Child not found');
    }

    const sessions = await this.prisma.gameSession.findMany({
      where: {
        childId,
        gameId: 'planning',
        status: 'COMPLETED',
      },
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        createdAt: true,
        accuracy: true,
        duration: true,
        score: true,
        metadata: true,
      },
    });

    return {
      sessions: sessions.filter(s => s.metadata && typeof s.metadata === 'object' && 'planning' in (s.metadata as Record<string, any>))
    };
  }
}

