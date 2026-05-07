import { Controller, Get, Param, Query } from '@nestjs/common';
import { AnalyticsService } from './analytics.service';

@Controller('analytics')
export class AnalyticsController {
  constructor(private readonly analytics: AnalyticsService) {}

  @Get('skill-profile/:childId')
  getSkillProfile(@Param('childId') childId: string) {
    return this.analytics.getSkillProfile(childId);
  }

  @Get('dashboard/:childId')
  getDashboard(@Param('childId') childId: string) {
    return this.analytics.getDashboard(childId);
  }

  @Get('progress/:childId')
  getProgress(
    @Param('childId') childId: string,
    @Query('limit') limit?: string,
    @Query('days') days?: string,
  ) {
    const parsedLimit =
      limit === undefined ? undefined : Number.parseInt(limit, 10);
    const parsedDays = days === undefined ? undefined : Number.parseInt(days, 10);

    return this.analytics.getProgress(childId, {
      limit: Number.isFinite(parsedLimit) ? parsedLimit : undefined,
      days: Number.isFinite(parsedDays) ? parsedDays : undefined,
    });
  }
}

