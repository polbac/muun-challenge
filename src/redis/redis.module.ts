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
                const url = configService.get<string>('REDIS_URL');
                if (!url) {
                    throw new Error('REDIS_URL is not defined in environment variables');
                }
                return new Redis(url);
            },
            inject: [ConfigService],
        },
        CacheService,
    ],
    exports: ['REDIS_CLIENT', CacheService],
})
export class RedisModule { }
