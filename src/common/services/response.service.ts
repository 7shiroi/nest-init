import { Injectable } from '@nestjs/common';
import { AssetsService } from 'src/modules/assets/assets.service';
import { type Asset } from 'generated/prisma';

export interface ApiResponseData<T = any> {
  data: T;
  message?: string;
  success?: boolean;
}

export interface PaginatedApiResponseData<T = any> extends ApiResponseData<T> {
  metadata: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

@Injectable()
export class ResponseService {
  constructor(private readonly assetsService: AssetsService) {}

  /**
   * Transform asset object to include temporary URL
   */
  async transformAsset(
    asset: Asset | null,
  ): Promise<(Omit<Asset, 'url'> & { tempUrl?: string }) | null> {
    if (!asset) return null;

    try {
      const tempUrl = await this.assetsService.generateTempUrl(asset.id);
      const { url, ...assetWithoutUrl } = asset;
      return {
        ...assetWithoutUrl,
        tempUrl,
      };
    } catch (error) {
      // If temp URL generation fails, return asset without tempUrl and url
      const { url, ...assetWithoutUrl } = asset;
      return assetWithoutUrl;
    }
  }

  /**
   * Transform an object that may contain asset references
   */
  async transformObjectWithAssets<T extends Record<string, any>>(
    obj: T,
    assetFields: string[] = ['image'],
  ): Promise<T> {
    const transformed = { ...obj } as any;

    for (const field of assetFields) {
      if (transformed[field]) {
        transformed[field] = await this.transformAsset(transformed[field]);
      }
    }

    return transformed as T;
  }

  /**
   * Transform an array of objects that may contain asset references
   */
  async transformArrayWithAssets<T extends Record<string, any>>(
    array: T[],
    assetFields: string[] = ['image'],
  ): Promise<T[]> {
    return Promise.all(
      array.map((item) => this.transformObjectWithAssets(item, assetFields)),
    );
  }

  /**
   * Create a successful API response
   */
  success<T>(data: T, message?: string): ApiResponseData<T> {
    return {
      data,
      message,
      success: true,
    };
  }

  /**
   * Create a paginated API response
   */
  paginated<T>(
    data: T[],
    metadata: PaginatedApiResponseData<T>['metadata'],
    message?: string,
  ): PaginatedApiResponseData<T[]> {
    return {
      data,
      metadata,
      message,
      success: true,
    };
  }

  /**
   * Create an error response
   */
  error(message: string, statusCode?: number): ApiResponseData<null> {
    return {
      data: null,
      message,
      success: false,
    };
  }

  /**
   * Create a created response
   */
  created<T>(data: T, message?: string): ApiResponseData<T> {
    return {
      data,
      message: message || 'Resource created successfully',
      success: true,
    };
  }

  /**
   * Create a no content response
   */
  noContent(message?: string): ApiResponseData<null> {
    return {
      data: null,
      message: message || 'Resource deleted successfully',
      success: true,
    };
  }

  /**
   * Create a not found response
   */
  notFound(message?: string): ApiResponseData<null> {
    return {
      data: null,
      message: message || 'Resource not found',
      success: false,
    };
  }

  /**
   * Create a bad request response
   */
  badRequest(
    message: string,
    errors?: string | string[] | Record<string, any>[],
  ): ApiResponseData<null> {
    return {
      data: null,
      message,
      success: false,
    };
  }

  /**
   * Create an unauthorized response
   */
  unauthorized(message?: string): ApiResponseData<null> {
    return {
      data: null,
      message: message || 'Unauthorized',
      success: false,
    };
  }

  /**
   * Create a forbidden response
   */
  forbidden(message?: string): ApiResponseData<null> {
    return {
      data: null,
      message: message || 'Forbidden',
      success: false,
    };
  }
}
