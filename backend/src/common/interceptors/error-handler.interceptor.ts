import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
  HttpException,
} from '@nestjs/common';
import { Observable, throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { randomUUID } from 'crypto';
import { Request } from 'express';
import { LoggerService } from '../../logger/logger.service';

@Injectable()
export class ErrorHandlerInterceptor implements NestInterceptor {
  constructor(private readonly logger: LoggerService) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    return next.handle().pipe(
      catchError((error) => {
        const errorId = randomUUID();
        const req = context.switchToHttp().getRequest<Request>();
        const method = req?.method ?? 'UNKNOWN';
        const url = req?.url ?? 'UNKNOWN';

        if (error instanceof HttpException) {
          const status = error.getStatus();
          const response = error.getResponse();
          const detail = typeof response === 'object' && response !== null
            ? JSON.stringify((response as Record<string, unknown>).message ?? response)
            : response;
          this.logger.error(
            `[${errorId}] [${method} ${url}] ${status}: ${detail}`,
            undefined,
            'ErrorHandler',
          );
        } else {
          this.logger.error(
            `[${errorId}] [${method} ${url}] Unhandled: ${error?.message ?? error}`,
            error?.stack,
            'ErrorHandler',
          );
        }

        return throwError(() => error);
      }),
    );
  }
}
