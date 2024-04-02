import { ExceptionFilter, Catch, ArgumentsHost, HttpException, HttpStatus } from '@nestjs/common';
import { Request, Response } from 'express';

@Catch(HttpException)
export class HttpExceptionFilter implements ExceptionFilter {
  catch(exception: HttpException, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const status = exception.getStatus();
    const message = exception.getResponse();

    let errorMessage: string | { [key: string]: any } | null = null;

    if (typeof message === 'object' && !Array.isArray(message)) {
      errorMessage = message['errors'] || null;
    }

    const responseObj: any = {
      success: false,
      code: status,
    };

    if (errorMessage !== null) {
      responseObj.errors = errorMessage;
    }

    responseObj.message = typeof message === 'string' ? message : message['message'] || HttpStatus[status];

    response.status(status).json(responseObj);
  }
}
