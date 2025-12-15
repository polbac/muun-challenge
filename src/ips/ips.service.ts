import { Injectable } from '@nestjs/common';
import { IpsRepository } from './ips.repository';
import { Ip } from './ip.entity';

@Injectable()
export class IpsService {
    constructor(private readonly ipsRepository: IpsRepository) { }

    async findOne(ip: string): Promise<Ip | null> {
        return this.ipsRepository.findByIp(ip);
    }
}
