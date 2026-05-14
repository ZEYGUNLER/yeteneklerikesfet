import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateChildDto } from './dto/create-child.dto';

@Injectable()
export class ChildService {
  constructor(private readonly prisma: PrismaService) {}

  createForParent(userId: string, dto: CreateChildDto) {
    const { name, age, birthDate, ...rest } = dto;
    return this.prisma.child.create({
      data: { 
        ...rest,
        userId, 
        name: name || rest.firstName, 
        age: age || 0,
        birthDate: new Date(birthDate),
      },
    });
  }

  listForParent(userId: string) {
    return this.prisma.child.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
    });
  }
}

