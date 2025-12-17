import { Module, Global } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import Redis from 'ioredis';
import { CacheService } from './cache.service';

@Global()
@Module({
  providers: [
    {
      provide: 'REDIS_CLIENT',
      useFactory: (configService: ConfigService) => {
        const host = configService.get<string>('REDIS_HOST');
        const port = configService.get<number>('REDIS_PORT');

        if (!host || !port) {
          throw new Error(
            'REDIS_HOST or REDIS_PORT is not defined in environment variables',
          );
        }

        return new Redis({
          host,
          port,
          enableOfflineQueue: false,
          commandTimeout: 1000,
        });
      },
      inject: [ConfigService],
    },
    CacheService,
  ],
  exports: ['REDIS_CLIENT', CacheService],
})
export class RedisModule {}
