import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as jwt from 'jsonwebtoken';

@Injectable()
export class AuthService {
    private readonly TOKEN_EXPIRES_IN_DAYS = 180; // 6 months

    constructor(private readonly configService: ConfigService) { }

    generateToken(): string {
        const secret = this.configService.get<string>('JWT_SECRET');
        if (!secret) {
            throw new Error('JWT_SECRET not found in environment variables');
        }

        const payload = {
            sub: '123',
            username: 'test-user',
        };

        return jwt.sign(payload, secret, {
            expiresIn: `${this.TOKEN_EXPIRES_IN_DAYS}d`
        });
    }
}
