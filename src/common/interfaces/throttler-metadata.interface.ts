export interface ThrottlerMetadata {
  total: number;
  limit: number;
  remainingTries: number;
  ttl: number;
}
