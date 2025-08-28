import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
  HttpException,
} from '@nestjs/common';
import { Observable, throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { ApiResponse } from '../interfaces/api-response.interface';

interface ErrorResponse {
  message: string | string[];
  error: string;
  statusCode?: number;
}

@Injectable()
export class ErrorInterceptor implements NestInterceptor {
  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    return next.handle().pipe(
      catchError((error: unknown) => {
        if (error instanceof HttpException) {
          const response = error.getResponse() as ErrorResponse;
          const transformedError: ApiResponse = {
            success: false,
            message:
              typeof response === 'string'
                ? response
                : Array.isArray(response.message)
                  ? 'Validation failed'
                  : response.message,
            errors:
              typeof response === 'string'
                ? [response]
                : Array.isArray(response.message)
                  ? response.message
                  : [response.error || response.message],
          };
          return throwError(
            () => new HttpException(transformedError, error.getStatus()),
          );
        }
        return throwError(() => error);
      }),
    );
  }
}
