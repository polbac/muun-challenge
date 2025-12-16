import { Controller, Get, Param, UseGuards } from '@nestjs/common';
import { IpsService } from './ips.service';
import { GetIpDto } from './dtos/get-ip.dto';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { AuthGuard } from '@nestjs/passport';

@ApiTags('IPs')
@ApiBearerAuth()
@UseGuards(AuthGuard('jwt'))
@Controller('ips')
export class IpsController {
    constructor(private readonly ipsService: IpsService) { }

    @Get(':ip')
    @ApiOperation({ summary: 'Check if an IP is blocked' })
    @ApiResponse({ status: 200, description: 'Returns the blocked status of the IP', schema: { example: { blocked: true } } })
    @ApiResponse({ status: 400, description: 'Invalid IP address format' })
    @ApiResponse({ status: 401, description: 'Unauthorized' })
    async checkIp(@Param() params: GetIpDto): Promise<{ blocked: boolean }> {
        const found = await this.ipsService.findOne(params.ip);
        return { blocked: found ? true : false };
    }
}
