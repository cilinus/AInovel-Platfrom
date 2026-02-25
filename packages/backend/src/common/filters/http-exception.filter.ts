import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { FastifyReply } from 'fastify';

@Catch()
export class HttpExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(HttpExceptionFilter.name);

  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const reply = ctx.getResponse<FastifyReply>();

    let status = HttpStatus.INTERNAL_SERVER_ERROR;
    let message = 'Internal server error';
    let code = 'INTERNAL_ERROR';

    if (exception instanceof HttpException) {
      status = exception.getStatus();
      const response = exception.getResponse();
      if (typeof response === 'object' && response !== null) {
        const res = response as Record<string, unknown>;
        message = (res.message as string) ?? exception.message;
        code = (res.code as string) ?? `HTTP_${status}`;
      } else {
        message = response as string;
      }
    } else if (exception instanceof Error) {
      this.logger.error(exception.message, exception.stack);
      // Check for MongoDB duplicate key error
      if ((exception as any).code === 11000) {
        status = HttpStatus.CONFLICT;
        message = 'Duplicate entry';
        code = 'DUPLICATE_ENTRY';
      }
    }

    reply.status(status).send({
      success: false,
      error: { code, message },
      timestamp: new Date().toISOString(),
    });
  }
}
