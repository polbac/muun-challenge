import { Injectable, Logger } from '@nestjs/common';
import { IpsRepository } from './ips.repository';
import { Ip } from './ip.entity';
import { CacheService } from '../redis/cache.service';

@Injectable()
export class IpsService {
    private readonly logger = new Logger(IpsService.name);

    constructor(
        private readonly ipsRepository: IpsRepository,
        private readonly cacheService: CacheService,
    ) { }

    async findOne(ip: string): Promise<Ip | null> {
        const startTime = Date.now();

        // Try cache first
        const isBlocked = await this.cacheService.getBlockedIp(ip);
        if (isBlocked !== null) {
            const duration = Date.now() - startTime;

            // Structured log for Datadog dashboard
            this.logger.log({
                message: 'IP lookup - Cache hit',
                ip,
                source: 'cache',
                cache_hit: true,
                blocked: isBlocked,
                duration_ms: duration,
            });

            if (isBlocked) {
                return { ip } as Ip;
            } else {
                return null;
            }
        }

        // Cache miss - query database
        const found = await this.ipsRepository.findByIp(ip);
        const duration = Date.now() - startTime;

        // Structured log for Datadog dashboard
        this.logger.log({
            message: 'IP lookup - Database query',
            ip,
            source: 'database',
            cache_hit: false,
            blocked: !!found,
            duration_ms: duration,
        });

        await this.cacheService.setBlockedIp(ip, !!found);

        return found;
    }
}
