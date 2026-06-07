import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';

@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit {
  private readonly logger = new Logger(PrismaService.name);

  async onModuleInit() {
    try {
      await this.$connect();
      this.logger.log('Database connection established.');
    } catch (err) {
      // Non-fatal: log the error but do NOT crash the process.
      // Individual requests will fail with DB errors until connectivity is restored.
      // NestJS watch-mode will restart if the file changes; Supabase pooler
      // may recover on its own after a transient network blip.
      this.logger.error(
        'Could not connect to database on startup. Server will continue running.',
        err instanceof Error ? err.message : String(err),
      );
    }
  }
}

