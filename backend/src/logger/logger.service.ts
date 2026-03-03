import { Injectable, LoggerService as NestLoggerService } from '@nestjs/common';
import * as winston from 'winston';
import 'winston-daily-rotate-file';

// NestJS 기본 로그 레벨 매핑 및 색상
const LEVEL_MAP: Record<string, string> = {
  error: 'ERROR',
  warn: 'WARN',
  info: 'LOG',
  debug: 'DEBUG',
  verbose: 'VERBOSE',
};

const LEVEL_COLORS: Record<string, string> = {
  error: '\x1b[31m',   // red
  warn: '\x1b[33m',    // yellow
  info: '\x1b[32m',    // green
  debug: '\x1b[35m',   // magenta
  verbose: '\x1b[36m', // cyan
};

const RESET = '\x1b[0m';
const YELLOW = '\x1b[33m';

@Injectable()
export class LoggerService implements NestLoggerService {
  private logger: winston.Logger;
  private lastTimestamp = Date.now();

  constructor() {
    const pid = process.pid;

    this.logger = winston.createLogger({
      level: process.env.LOG_LEVEL ?? 'info',
      format: winston.format.combine(
        winston.format.timestamp(),
        winston.format.errors({ stack: true }),
        winston.format.json(),
      ),
      defaultMeta: { service: 'ainovel-api' },
      transports: [
        new winston.transports.Console({
          format: winston.format.printf(({ level, message, context }) => {
            const now = Date.now();
            const diff = now - this.lastTimestamp;
            this.lastTimestamp = now;

            const dateStr = new Date().toLocaleString('ko-KR', {
              year: 'numeric',
              month: '2-digit',
              day: '2-digit',
              hour: '2-digit',
              minute: '2-digit',
              second: '2-digit',
              hour12: true,
            });

            const color = LEVEL_COLORS[level] ?? '';
            const nestLevel = LEVEL_MAP[level] ?? level.toUpperCase();
            const ctx = context ? `${YELLOW}[${context}]${RESET}` : '';

            return (
              `${color}[Nest] ${pid}${RESET}  - ` +
              `${dateStr}     ${color}${nestLevel.padEnd(7)}${RESET}` +
              `${ctx} ${color}${message}${RESET}` +
              ` ${YELLOW}+${diff}ms${RESET}`
            );
          }),
        }),
        new winston.transports.DailyRotateFile({
          dirname: 'logs',
          filename: 'app-%DATE%.log',
          datePattern: 'YYYY-MM-DD',
          maxSize: '20m',
          maxFiles: '14d',
        }),
        new winston.transports.DailyRotateFile({
          dirname: 'logs',
          filename: 'error-%DATE%.log',
          datePattern: 'YYYY-MM-DD',
          level: 'error',
          maxSize: '20m',
          maxFiles: '30d',
        }),
      ],
    });
  }

  log(message: string, context?: string) {
    this.logger.info(message, { context });
  }

  error(message: string, trace?: string, context?: string) {
    this.logger.error(message, { trace, context });
  }

  warn(message: string, context?: string) {
    this.logger.warn(message, { context });
  }

  debug(message: string, context?: string) {
    this.logger.debug(message, { context });
  }

  verbose(message: string, context?: string) {
    this.logger.verbose(message, { context });
  }

  query(query: string, params?: unknown[], context?: string) {
    this.logger.debug(`Query: ${query}`, { params, context: context ?? 'Database' });
  }
}
