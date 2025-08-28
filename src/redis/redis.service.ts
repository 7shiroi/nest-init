import { Injectable, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Redis } from 'ioredis';

@Injectable()
export class RedisService implements OnModuleInit, OnModuleDestroy {
  private redisClient: Redis;
  private readonly defaultTTL = 3600; // 1 hour in seconds

  constructor(private readonly configService: ConfigService) {
    this.redisClient = new Redis({
      host: this.configService.get('REDIS_HOST') || 'localhost',
      port: parseInt(this.configService.get('REDIS_PORT') || '6379', 10),
      password: this.configService.get('REDIS_PASSWORD') || '',
      retryStrategy: (times) => Math.min(times * 50, 2000),
    });
  }

  async onModuleInit() {
    // Test the connection
    try {
      await this.redisClient.ping();
    } catch (e) {
      console.error('Redis connection failed:', e);
    }
  }

  async onModuleDestroy() {
    await this.redisClient.quit();
  }

  async get<T>(key: string): Promise<T | null> {
    const value = await this.redisClient.get(key);
    if (!value) return null;
    return JSON.parse(value);
  }

  async set(
    key: string,
    value: any,
    ttl: number = this.defaultTTL,
  ): Promise<void> {
    await this.redisClient.set(key, JSON.stringify(value), 'EX', ttl);
  }

  async del(...keys: string[]): Promise<void> {
    if (keys.length > 0) {
      await this.redisClient.del(...keys);
    }
  }

  async clearCache(): Promise<void> {
    await this.redisClient.flushdb();
  }

  async getAllKeys(pattern: string): Promise<string[]> {
    const keys: string[] = [];
    let cursor = '0';
    do {
      const [newCursor, foundKeys] = await this.redisClient.scan(
        cursor,
        'MATCH',
        pattern,
      );
      cursor = newCursor;
      keys.push(...foundKeys);
    } while (cursor !== '0');
    return keys;
  }

  getClient(): Redis {
    return this.redisClient;
  }
}
