import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateChildDto } from './dto/create-child.dto';

@Injectable()
export class ChildService {
  constructor(private readonly prisma: PrismaService) {}

  async create(dto: CreateChildDto) {
    return this.prisma.child.create({
      data: {
        name: dto.name,
        age: dto.age,
        userId: dto.userId,
      },
    });
  }

  async findAll() {
    return this.prisma.child.findMany();
  }
}