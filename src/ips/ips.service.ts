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

        const isBlocked = await this.cacheService.getBlockedIp(ip);
        if (isBlocked !== null) {
            this.logger.debug(`Cache hit for ${ip}: ${isBlocked}`);
            if (isBlocked) {
                return { ip } as Ip;
            } else {
                return null;
            }
        }

        const found = await this.ipsRepository.findByIp(ip);


        await this.cacheService.setBlockedIp(ip, !!found);

        return found;
    }
}
