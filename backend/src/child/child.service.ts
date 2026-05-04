import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class ChildService {
  constructor(private readonly prisma: PrismaService) {}

  createForParent(userId: string, name: string, age: number) {
    return this.prisma.child.create({
      data: { userId, name, age },
      select: { id: true, name: true, age: true, createdAt: true },
    });
  }

  listForParent(userId: string) {
    return this.prisma.child.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      select: { id: true, name: true, age: true, createdAt: true },
    });
  }
}

