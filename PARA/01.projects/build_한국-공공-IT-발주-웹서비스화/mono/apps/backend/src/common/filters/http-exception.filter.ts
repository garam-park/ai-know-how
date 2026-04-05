import { ArgumentsHost, Catch, ExceptionFilter, HttpException } from '@nestjs/common';
import { Response } from 'express';

@Catch(HttpException)
export class HttpExceptionFilter implements ExceptionFilter {
  catch(exception: HttpException, host: ArgumentsHost): void {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const status = exception.getStatus();
    const exceptionResponse = exception.getResponse();

    let code = status * 1000;
    let message = exception.message;

    if (typeof exceptionResponse === 'object' && exceptionResponse !== null) {
      const resp = exceptionResponse as Record<string, unknown>;
      if (resp.code && typeof resp.code === 'number') {
        code = resp.code;
      }
      if (resp.message && typeof resp.message === 'string') {
        message = resp.message;
      }
    }

    response.status(status).json({
      code,
      message,
      result: null,
    });
  }
}
