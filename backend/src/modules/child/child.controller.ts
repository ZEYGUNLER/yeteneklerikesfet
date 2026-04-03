import { Body, Controller, Get, Post } from '@nestjs/common';
import { ChildService } from './child.service';
import { CreateChildDto } from './dto/create-child.dto';

@Controller('children')
export class ChildController {
  constructor(private readonly childService: ChildService) {}

  @Post()
  create(@Body() dto: CreateChildDto) {
    return this.childService.create(dto);
  }

  @Get()
  findAll() {
    return this.childService.findAll();
  }
}