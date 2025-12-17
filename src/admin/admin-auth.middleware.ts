import { Injectable, NestMiddleware, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Request, Response, NextFunction } from 'express';

@Injectable()
export class AdminAuthMiddleware implements NestMiddleware {
    constructor(private readonly configService: ConfigService) { }

    use(req: Request, res: Response, next: NextFunction) {
        const adminToken = this.configService.get<string>('ADMIN_TOKEN');
        const providedToken = req.headers['x-admin-token'];

        if (!adminToken) {
            throw new Error('ADMIN_TOKEN not configured in environment variables');
        }

        if (!providedToken || providedToken !== adminToken) {
            throw new UnauthorizedException('Invalid admin token');
        }

        next();
    }
}
