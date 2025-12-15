import { Controller, Get, Param } from '@nestjs/common';
import { IpsService } from './ips.service';

@Controller('ips')
export class IpsController {
    constructor(private readonly ipsService: IpsService) { }

    @Get(':ip')
    async checkIp(@Param('ip') ip: string): Promise<{ blocked: boolean }> {
        const found = await this.ipsService.findOne(ip);
        return { blocked: !!found };
    }
}
