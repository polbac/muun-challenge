import { Controller, Post, Body, HttpCode, HttpStatus } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiHeader, ApiResponse } from '@nestjs/swagger';
import { AuthService } from '../auth/auth.service';
import { IpsumService } from '../ipsum/ipsum.service';
import { IngestService } from '../ingest/ingest.service';

@ApiTags('admin')
@Controller('admin')
@ApiHeader({
    name: 'x-admin-token',
    description: 'Admin authentication token',
    required: true,
})
export class AdminController {
    constructor(
        private readonly authService: AuthService,
        private readonly ipsumService: IpsumService,
        private readonly ingestService: IngestService,
    ) { }

    @Post('token')
    @HttpCode(HttpStatus.OK)
    @ApiOperation({ summary: 'Generate a new JWT token' })
    @ApiResponse({
        status: 200,
        description: 'Token generated successfully',
        schema: {
            type: 'object',
            properties: {
                token: { type: 'string' }
            }
        }
    })
    generateToken() {
        const token = this.authService.generateToken();
        return { token };
    }

    @Post('ingest')
    @HttpCode(HttpStatus.OK)
    @ApiOperation({ summary: 'Trigger IP blocklist ingestion' })
    @ApiResponse({
        status: 200,
        description: 'Ingestion completed',
        schema: {
            type: 'object',
            properties: {
                success: { type: 'boolean' },
                totalIps: { type: 'number' }
            }
        }
    })
    async ingestIps() {
        try {
            const ips = await this.ipsumService.fetchIps();
            await this.ingestService.ingestIps(ips);

            return {
                success: true,
                totalIps: ips.length,
            };
        } catch (error) {
            return {
                success: false,
                totalIps: 0,
            };
        }
    }
}
