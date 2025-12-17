import { LoggerService, Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as winston from 'winston';

@Injectable()
export class DatadogLogger implements LoggerService {
    private winstonLogger: winston.Logger;
    private isDatadogEnabled: boolean;

    constructor(private configService: ConfigService) {
        this.isDatadogEnabled = !!this.configService.get<string>('DD_API_KEY');

        const transports: winston.transport[] = [
            // Always log to console
            new winston.transports.Console({
                format: winston.format.combine(
                    winston.format.timestamp(),
                    winston.format.colorize(),
                    winston.format.printf(({ timestamp, level, message, context, ...meta }) => {
                        const ctx = context ? `[${context}]` : '';
                        const metaStr = Object.keys(meta).length ? JSON.stringify(meta) : '';
                        return `${timestamp} ${level} ${ctx} ${message} ${metaStr}`;
                    })
                ),
            }),
        ];

        // Add Datadog HTTP transport if API key is configured
        if (this.isDatadogEnabled) {
            const ddApiKey = this.configService.get<string>('DD_API_KEY');
            const ddService = this.configService.get<string>('DD_SERVICE') || 'muun-challenge';
            const ddEnv = this.configService.get<string>('DD_ENV') || 'development';
            const ddSite = this.configService.get<string>('DD_SITE') || 'datadoghq.com';

            transports.push(
                new winston.transports.Http({
                    host: `http-intake.logs.${ddSite}`,
                    path: `/api/v2/logs`,
                    ssl: true,
                    headers: {
                        'DD-API-KEY': ddApiKey,
                        'Content-Type': 'application/json',
                    },
                    format: winston.format.combine(
                        winston.format.timestamp(),
                        winston.format.json()
                    ),
                })
            );
        }

        this.winstonLogger = winston.createLogger({
            level: 'debug',
            format: winston.format.combine(
                winston.format.timestamp(),
                winston.format.errors({ stack: true }),
                winston.format.json()
            ),
            defaultMeta: {
                service: this.configService.get<string>('DD_SERVICE') || 'muun-challenge',
                env: this.configService.get<string>('DD_ENV') || 'development',
            },
            transports,
        });
    }

    log(message: any, context?: string) {
        if (typeof message === 'object') {
            this.winstonLogger.info({ ...message, context });
        } else {
            this.winstonLogger.info(message, { context });
        }
    }

    error(message: any, trace?: string, context?: string) {
        if (typeof message === 'object') {
            this.winstonLogger.error({ ...message, trace, context });
        } else {
            this.winstonLogger.error(message, { trace, context });
        }
    }

    warn(message: any, context?: string) {
        if (typeof message === 'object') {
            this.winstonLogger.warn({ ...message, context });
        } else {
            this.winstonLogger.warn(message, { context });
        }
    }

    debug(message: any, context?: string) {
        if (typeof message === 'object') {
            this.winstonLogger.debug({ ...message, context });
        } else {
            this.winstonLogger.debug(message, { context });
        }
    }

    verbose(message: any, context?: string) {
        if (typeof message === 'object') {
            this.winstonLogger.verbose({ ...message, context });
        } else {
            this.winstonLogger.verbose(message, { context });
        }
    }
}
