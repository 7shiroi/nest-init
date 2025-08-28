import { RedisOptions, Transport } from '@nestjs/microservices';

export const redisConfig: RedisOptions = {
  transport: Transport.REDIS,
  options: {
    host: (process.env.REDIS_HOST as string) || 'localhost',
    port: parseInt((process.env.REDIS_PORT as string) || '6379', 10),
    password: (process.env.REDIS_PASSWORD as string) || '',
    retryAttempts: 5,
    retryDelay: 1000,
  },
};
