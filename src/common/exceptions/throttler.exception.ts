import { HttpException, HttpStatus } from '@nestjs/common';
import { ApiResponse } from '../interfaces/api-response.interface';
import { ThrottlerMetadata } from '../interfaces/throttler-metadata.interface';

export class CustomThrottlerException extends HttpException {
  constructor(response: ApiResponse<ThrottlerMetadata>) {
    super(response, HttpStatus.TOO_MANY_REQUESTS);
  }
}
