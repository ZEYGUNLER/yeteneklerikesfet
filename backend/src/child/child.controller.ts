import { Body, Controller, Get, Post, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { CreateChildDto } from './dto/create-child.dto';
import { ChildService } from './child.service';

@UseGuards(JwtAuthGuard)
@Controller('children')
export class ChildController {
  constructor(private readonly children: ChildService) {}

  @Post()
  create(@CurrentUser() user: { sub: string }, @Body() dto: CreateChildDto) {
    return this.children.createForParent(user.sub, dto.name, dto.age);
  }

  @Get()
  list(@CurrentUser() user: { sub: string }) {
    return this.children.listForParent(user.sub);
  }
}

