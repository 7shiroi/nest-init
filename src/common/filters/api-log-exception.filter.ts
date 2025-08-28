import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import { Request, Response } from 'express';
import { ApiLogService } from '../services/api-log.service';
import { JwtUser } from '../decorators/get-user.decorator';

@Catch()
export class ApiLogExceptionFilter implements ExceptionFilter {
  constructor(private readonly apiLogService: ApiLogService) {}

  catch(exception: Error, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const request = ctx.getRequest<Request>();
    const response = ctx.getResponse<Response>();
    const user = request.user as JwtUser | null;
    const startTime = Date.now(); // This will be slightly off but better than nothing

    let status = HttpStatus.INTERNAL_SERVER_ERROR;
    let errorResponse = {
      success: false,
      message: 'Internal server error',
      errors: exception.stack,
    };

    if (exception instanceof HttpException) {
      status = exception.getStatus();
      errorResponse = exception.getResponse() as any;
    }

    response.status(status);

    // Log the error
    this.apiLogService.logApiRequest(
      request,
      response,
      user,
      startTime,
      errorResponse,
    );

    // Return the error response
    return response.json(errorResponse);
  }
}
