import { Controller, Get, Param, BadRequestException } from '@nestjs/common';
import { IpsService } from './ips.service';
import { isIP } from 'net';

@Controller('ips')
export class IpsController {
    constructor(private readonly ipsService: IpsService) { }

    @Get(':ip')
    async checkIp(@Param('ip') ip: string): Promise<{ blocked: boolean }> {
        if (isIP(ip) === 0) {
            throw new BadRequestException('Invalid IP address');
        }
        const found = await this.ipsService.findOne(ip);
        return { blocked: !!found };
    }
}
