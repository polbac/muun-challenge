import { Injectable, Inject, Logger } from '@nestjs/common';
import Redis from 'ioredis';

@Injectable()
export class CacheService {
    private readonly logger = new Logger(CacheService.name);
    private readonly TTL = 7_200; // 24 hours

    constructor(@Inject('REDIS_CLIENT') private readonly redis: Redis) { }

    private getIpKey(ip: string): string {
        return `blocked:${ip}`;
    }

    async getBlockedIp(ip: string): Promise<boolean | null> {
        const key = this.getIpKey(ip);
        try {
            const val = await this.redis.get(key);
            if (val === null) return null;
            return val === '1';
        } catch (e) {
            this.logger.error(`Error getting key ${key}`, e);
            return null;
        }
    }

    async setBlockedIp(ip: string, blocked: boolean): Promise<void> {
        const key = this.getIpKey(ip);
        const val = blocked ? '1' : '0';
        try {
            await this.redis.set(key, val, 'EX', this.TTL);
        } catch (e) {
            this.logger.error(`Error setting key ${key}`, e);
        }
    }

    async flush(): Promise<void> {
        try {
            await this.redis.flushdb();
            this.logger.log('Cache flushed');
        } catch (e) {
            this.logger.error('Error flushing cache', e);
            throw e;
        }
    }
}
