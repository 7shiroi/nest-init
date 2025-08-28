import {
  Injectable,
  OnModuleInit,
  OnModuleDestroy,
  Logger,
} from '@nestjs/common';
import { PrismaClient } from 'generated/prisma';

@Injectable()
export class PrismaService
  extends PrismaClient
  implements OnModuleInit, OnModuleDestroy
{
  private readonly logger: Logger;

  constructor() {
    super({
      log: ['query', 'info', 'warn', 'error'] as const,
    });
    this.logger = new Logger(PrismaService.name);
  }

  async onModuleInit() {
    try {
      await this.$connect();
      this.logger.log('Successfully connected to the database');
    } catch (error: unknown) {
      const errorMessage =
        error instanceof Error ? error.message : 'Unknown error';
      const errorStack = error instanceof Error ? error.stack : undefined;

      this.logger.error(
        'Failed to connect to the database. Please check your database connection settings.',
        errorStack,
      );
      throw new Error(
        `Database connection failed: ${errorMessage}. Please check the logs for more details.`,
      );
    }
  }

  async onModuleDestroy() {
    try {
      await this.$disconnect();
      this.logger.log('Successfully disconnected from the database');
    } catch (error: unknown) {
      const errorMessage =
        error instanceof Error ? error.message : 'Unknown error';
      const errorStack = error instanceof Error ? error.stack : undefined;

      this.logger.error(
        `Failed to disconnect from the database: ${errorMessage}`,
        errorStack,
      );
    }
  }
}
