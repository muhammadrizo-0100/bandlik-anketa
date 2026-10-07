import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { Request, Response } from 'express';

@Catch()
export class AllExceptionsFilter implements ExceptionFilter {
  private readonly logger = new Logger(AllExceptionsFilter.name);

  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();

    const status =
      exception instanceof HttpException
        ? exception.getStatus()
        : HttpStatus.INTERNAL_SERVER_ERROR;

    const exceptionResponse =
      exception instanceof HttpException ? exception.getResponse() : null;

    let message = 'Internal server error';
    let errors: any = null;

    if (typeof exceptionResponse === 'object' && exceptionResponse !== null) {
      const resObj = exceptionResponse as Record<string, any>;
      message = resObj.message || message;
      errors = resObj.errors || null;
    } else if (typeof exceptionResponse === 'string') {
      message = exceptionResponse;
    } else if (exception instanceof Error) {
      message = exception.message;
    }

    this.logger.error(
      `[${request.method}] ${request.url} - Status: ${status} - Error: ${JSON.stringify(
        message,
      )}`,
    );

    response.status(status).json({
      success: false,
      statusCode: status,
      path: request.url,
      message,
      errors,
      timestamp: new Date().toISOString(),
    });
  }
}
