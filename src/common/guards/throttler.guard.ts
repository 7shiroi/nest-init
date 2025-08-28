import { ExecutionContext, Injectable } from '@nestjs/common';
import {
  ThrottlerGuard as NestThrottlerGuard,
  ThrottlerLimitDetail,
} from '@nestjs/throttler';
import { ApiResponse } from '../interfaces/api-response.interface';
import { ThrottlerMetadata } from '../interfaces/throttler-metadata.interface';
import { CustomThrottlerException } from '../exceptions/throttler.exception';

@Injectable()
export class ThrottlerGuard extends NestThrottlerGuard {
  protected async throwThrottlingException(
    context: ExecutionContext,
    throttlerLimitDetail: ThrottlerLimitDetail,
  ): Promise<void> {
    const response: ApiResponse<ThrottlerMetadata> = {
      success: false,
      message: 'Too Many Requests',
      errors: 'Rate limit exceeded. Please try again later.',
      data: {
        total: throttlerLimitDetail.limit,
        limit: throttlerLimitDetail.limit,
        remainingTries: Math.max(
          0,
          throttlerLimitDetail.limit - throttlerLimitDetail.totalHits,
        ),
        ttl: throttlerLimitDetail.ttl,
      },
    };

    throw new CustomThrottlerException(response);
  }
}
