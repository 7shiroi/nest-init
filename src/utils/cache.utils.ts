import { RedisService } from 'src/redis/redis.service';
import { PaginationMetadata } from 'src/common/interfaces/api-response.interface';

export const invalidateCache = async (
  redis: RedisService,
  pattern: string,
): Promise<void> => {
  try {
    const keys = await redis.getAllKeys(pattern);
    if (keys.length > 0) {
      await redis.del(...keys);
    }
  } catch (error) {
    console.error('Cache invalidation failed:', error);
  }
};

/**
 * Calculate pagination metadata with proper handling of empty collections
 * @param total - Total count of items
 * @param page - Current page number
 * @param limit - Items per page
 * @returns Pagination metadata with totalPages always >= 1
 */
export const calculatePaginationMetadata = (
  total: number,
  page: number,
  limit: number,
): PaginationMetadata => {
  // Ensure totalPages is at least 1 to handle empty collections gracefully
  const totalPages = Math.max(1, Math.ceil(total / limit));

  return {
    total,
    page,
    limit,
    totalPages,
  };
};

/**
 * Validate page number for pagination
 * @param page - Page number to validate
 * @param total - Total count of items
 * @param totalPages - Total number of pages
 * @returns true if page is valid, false otherwise
 */
export const isValidPage = (
  page: number,
  total: number,
  totalPages: number,
): boolean => {
  // Page must be at least 1
  if (page < 1) {
    return false;
  }

  // If there's no data, only page 1 is valid
  if (total === 0) {
    return page === 1;
  }

  // If there's data, page must not exceed totalPages
  return page <= totalPages;
};
