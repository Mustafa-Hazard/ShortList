import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import type { Request, Response } from 'express';

@Catch()
export class HttpExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(HttpExceptionFilter.name);

  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();

    const isHttp = exception instanceof HttpException;
    const status = isHttp
      ? exception.getStatus()
      : HttpStatus.INTERNAL_SERVER_ERROR;

    const isProduction = process.env.NODE_ENV === 'production';

    let errorPayload: Record<string, any>;

    if (isHttp) {
      const res = exception.getResponse();
      errorPayload =
        typeof res === 'object' ? (res as Record<string, any>) : { message: res };
    } else {
      errorPayload = {
        statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
        message: isProduction
          ? 'Internal server error'
          : (exception as Error)?.message || 'Internal server error',
      };
    }

    if (status >= 500) {
      const sanitizedUrl = request?.url?.replace(
        /([?&](token|password|secret)=)[^&]+/gi,
        '$1***',
      );
      this.logger.error(
        `[${request?.method || 'UNKNOWN'}] ${sanitizedUrl} - Status: ${status} - Error: ${
          (exception as Error)?.message || 'Unknown error'
        }`,
        !isProduction ? (exception as Error)?.stack : undefined,
      );
    }

    response.status(status).json({
      ...errorPayload,
      timestamp: new Date().toISOString(),
      path: request?.url || '',
    });
  }
}
