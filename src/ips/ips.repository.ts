import { Repository } from 'typeorm';
import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Ip } from './ip.entity';

@Injectable()
export class IpsRepository {
    constructor(
        @InjectRepository(Ip)
        private readonly repo: Repository<Ip>,
    ) { }

    async findByIp(ip: string): Promise<Ip | null> {
        return this.repo.findOne({ where: { ip } });
    }

    async save(ip: string): Promise<Ip> {
        return this.repo.save({ ip });
    }
}
