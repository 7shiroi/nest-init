import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
} from '@nestjs/common';
import { Observable, tap } from 'rxjs';
import { ApiLogService } from '../services/api-log.service';
import { Request, Response } from 'express';
import { JwtUser } from '../decorators/get-user.decorator';

@Injectable()
export class ApiLogInterceptor implements NestInterceptor {
  constructor(private readonly apiLogService: ApiLogService) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const startTime = Date.now();
    const ctx = context.switchToHttp();
    const request = ctx.getRequest<Request>();
    const response = ctx.getResponse<Response>();
    const user = request.user as JwtUser | null;

    return next.handle().pipe(
      tap((responseBody) => {
        // Only log successful responses
        this.apiLogService.logApiRequest(
          request,
          response,
          user,
          startTime,
          responseBody,
        );
      }),
    );
  }
}
