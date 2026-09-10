import {
  Controller,
  Get,
  Logger,
  ServiceUnavailableException,
} from '@nestjs/common';
import { InjectDataSource } from '@nestjs/typeorm';
import { DataSource } from 'typeorm';

interface HealthResponse {
  status: 'ok';
  database: 'up';
  uptime: number;
  timestamp: string;
}

/**
 * Readiness probe. `start.sh` polls this instead of a domain endpoint so that
 * "the API answers" also means "the API can reach the database".
 */
@Controller('health')
export class HealthController {
  private readonly logger = new Logger(HealthController.name);

  constructor(
    @InjectDataSource()
    private readonly dataSource: DataSource,
  ) {}

  @Get()
  async check(): Promise<HealthResponse> {
    try {
      await this.dataSource.query('SELECT 1');
    } catch (error) {
      this.logger.error(
        'Health check failed: the database is unreachable',
        error instanceof Error ? error.stack : String(error),
      );
      // 503 so that `curl -sf` fails and callers can poll on it.
      throw new ServiceUnavailableException('Database is unreachable');
    }

    return {
      status: 'ok',
      database: 'up',
      uptime: Math.floor(process.uptime()),
      timestamp: new Date().toISOString(),
    };
  }
}
