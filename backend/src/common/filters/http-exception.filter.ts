import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  HttpStatus,
  Inject,
} from '@nestjs/common';
import { Request, Response } from 'express';
import { LoggerService } from '../../logger/logger.service';

@Catch()
export class HttpExceptionFilter implements ExceptionFilter {
  constructor(
    @Inject(LoggerService) private readonly logger: LoggerService,
  ) {}

  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const res = ctx.getResponse<Response>();
    const req = ctx.getRequest<Request>();

    let status = HttpStatus.INTERNAL_SERVER_ERROR;
    let message = 'Internal server error';
    let code = 'INTERNAL_ERROR';

    if (exception instanceof HttpException) {
      status = exception.getStatus();
      const response = exception.getResponse();
      if (typeof response === 'object' && response !== null) {
        const body = response as Record<string, unknown>;
        // class-validator returns message as array
        const rawMsg = body.message;
        message = Array.isArray(rawMsg) ? rawMsg.join('; ') : (rawMsg as string) ?? exception.message;
        code = (body.code as string) ?? `HTTP_${status}`;
      } else {
        message = response as string;
      }
    } else if (exception instanceof Error) {
      // Check for MongoDB duplicate key error
      if ((exception as any).code === 11000) {
        status = HttpStatus.CONFLICT;
        message = 'Duplicate entry';
        code = 'DUPLICATE_ENTRY';
      }
    }

    // All errors MUST be logged (Golden Rule)
    const method = req?.method ?? 'UNKNOWN';
    const url = req?.url ?? 'UNKNOWN';
    const logMessage = `[${method} ${url}] ${status} ${code}: ${message}`;

    if (status >= 500) {
      const stack = exception instanceof Error ? exception.stack : undefined;
      this.logger.error(logMessage, stack, 'ExceptionFilter');
    } else {
      this.logger.error(logMessage, undefined, 'ExceptionFilter');
    }

    res.status(status).json({
      success: false,
      error: { code, message },
      timestamp: new Date().toISOString(),
    });
  }
}
