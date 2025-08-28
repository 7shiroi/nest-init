import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
  HttpStatus,
  StreamableFile,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { ApiResponse } from '../interfaces/api-response.interface';
import { Response } from 'express';
import { Reflector } from '@nestjs/core';
import { RESPONSE_MESSAGE } from '../decorators/response-message.decorator';

@Injectable()
export class TransformInterceptor<T>
  implements NestInterceptor<T, ApiResponse<T>>
{
  constructor(private reflector: Reflector) {}

  intercept(
    context: ExecutionContext,
    next: CallHandler,
  ): Observable<ApiResponse<T>> {
    const ctx = context.switchToHttp();
    const httpResponse = ctx.getResponse<Response>();
    const statusCode = httpResponse.statusCode;

    // Get custom message from decorator if it exists
    const customMessage = this.reflector.get<string>(
      RESPONSE_MESSAGE,
      context.getHandler(),
    );

    return next.handle().pipe(
      map((responseData: any) => {
        // Skip transformation for StreamableFile and other file responses
        if (responseData instanceof StreamableFile) {
          return responseData;
        }

        // Skip transformation for responses that have file-like content types
        const contentType = httpResponse.getHeader('content-type') as string;
        if (contentType && this.isFileContentType(contentType)) {
          return responseData;
        }

        // Skip transformation for responses that should be served directly
        // (e.g., when the route is for file serving)
        const request = ctx.getRequest();
        if (request.url && this.isFileServingRoute(request.url)) {
          return responseData;
        }

        // Extract metadata and data from the response
        const { metadata, data } = responseData || {};

        const apiResponse: ApiResponse<T> = {
          success: statusCode >= 200 && statusCode < 300,
          message: customMessage || this.getDefaultMessage(statusCode),
          data: data || responseData, // If data property exists, use it, otherwise use the entire response
        };

        // Add metadata if it exists
        if (metadata) {
          apiResponse.metadata = metadata;
        }

        return apiResponse;
      }),
    );
  }

  private isFileContentType(contentType: string): boolean {
    const fileContentTypes = [
      'image/',
      'video/',
      'audio/',
      'application/pdf',
      'application/octet-stream',
      'text/plain',
      'application/zip',
      'application/x-zip-compressed',
    ];

    return fileContentTypes.some((type) =>
      contentType.toLowerCase().includes(type),
    );
  }

  private isFileServingRoute(url: string): boolean {
    // Check if the URL is for serving assets
    return url.includes('/assets/secure/') || url.includes('/assets/');
  }

  private getDefaultMessage(statusCode: HttpStatus): string {
    switch (statusCode) {
      case HttpStatus.OK:
        return 'Success';
      case HttpStatus.CREATED:
        return 'Resource created successfully';
      case HttpStatus.NO_CONTENT:
        return 'Resource deleted successfully';
      case HttpStatus.BAD_REQUEST:
        return 'Bad request';
      case HttpStatus.UNAUTHORIZED:
        return 'Unauthorized';
      case HttpStatus.FORBIDDEN:
        return 'Forbidden';
      case HttpStatus.NOT_FOUND:
        return 'Resource not found';
      case HttpStatus.INTERNAL_SERVER_ERROR:
        return 'Internal server error';
      default:
        return 'Operation completed';
    }
  }
}
