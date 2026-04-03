import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { SessionStatus } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { EndSessionDto } from './dto/end-session.dto';
import { StartSessionDto } from './dto/start-session.dto';

@Injectable()
export class GameSessionService {
  constructor(private readonly prisma: PrismaService) {}

  async startSession(dto: StartSessionDto) {
    return this.prisma.gameSession.create({
      data: {
        childId: dto.childId,
        gameId: dto.gameId,
        status: SessionStatus.ACTIVE,
      },
    });
  }

  async endSession(dto: EndSessionDto) {
    const session = await this.prisma.gameSession.findUnique({
      where: { id: dto.sessionId },
    });

    if (!session) {
      throw new NotFoundException('Session not found');
    }

    if (session.status === SessionStatus.COMPLETED) {
      throw new BadRequestException('Session already ended');
    }

    if (dto.score < 0 || dto.duration < 0 || dto.accuracy < 0) {
      throw new BadRequestException('Invalid session metrics');
    }

    const updatedSession = await this.prisma.gameSession.update({
      where: { id: dto.sessionId },
      data: {
        status: SessionStatus.COMPLETED,
        endTime: new Date(),
        score: dto.score,
        duration: dto.duration,
        accuracy: dto.accuracy,
      },
    });

    await this.updateSkillProfile(session.childId, dto.score);

    return updatedSession;
  }

  private async updateSkillProfile(childId: string, score: number) {
    const increment = Math.floor(score / 10);

    const existingProfile = await this.prisma.skillProfile.findUnique({
      where: { childId },
    });

    if (!existingProfile) {
      await this.prisma.skillProfile.create({
        data: {
          childId,
          memory: increment,
          attention: increment,
          logic: increment,
        },
      });
      return;
    }

    await this.prisma.skillProfile.update({
      where: { childId },
      data: {
        memory: existingProfile.memory + increment,
        attention: existingProfile.attention + increment,
        logic: existingProfile.logic + increment,
      },
    });
  }
}