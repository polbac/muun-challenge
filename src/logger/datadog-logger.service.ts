import { LoggerService, Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class DatadogLogger implements LoggerService {
    private ddLogger: any;
    private isEnabled: boolean;

    constructor(private configService: ConfigService) {
        this.isEnabled = this.configService.get<string>('DD_API_KEY') ? true : false;

        if (this.isEnabled) {
            // Only require dd-trace if Datadog is enabled
            const tracer = require('dd-trace');
            tracer.init({
                service: this.configService.get<string>('DD_SERVICE') || 'muun-challenge',
                env: this.configService.get<string>('DD_ENV') || 'development',
                version: this.configService.get<string>('DD_VERSION') || '1.0.0',
                logInjection: true,
            });
            this.ddLogger = tracer;
        }
    }

    private formatMessage(message: any, context?: string): string {
        const timestamp = new Date().toISOString();
        const ctx = context ? `[${context}]` : '';
        return `${timestamp} ${ctx} ${typeof message === 'object' ? JSON.stringify(message) : message}`;
    }

    log(message: any, context?: string) {
        const formatted = this.formatMessage(message, context);
        console.log(formatted);
        if (this.isEnabled && this.ddLogger) {
            this.ddLogger.trace('log', { message, context });
        }
    }

    error(message: any, trace?: string, context?: string) {
        const formatted = this.formatMessage(message, context);
        console.error(formatted);
        if (trace) console.error(trace);

        if (this.isEnabled && this.ddLogger) {
            this.ddLogger.trace('error', { message, trace, context });
        }
    }

    warn(message: any, context?: string) {
        const formatted = this.formatMessage(message, context);
        console.warn(formatted);
        if (this.isEnabled && this.ddLogger) {
            this.ddLogger.trace('warn', { message, context });
        }
    }

    debug(message: any, context?: string) {
        const formatted = this.formatMessage(message, context);
        console.debug(formatted);
        if (this.isEnabled && this.ddLogger) {
            this.ddLogger.trace('debug', { message, context });
        }
    }

    verbose(message: any, context?: string) {
        const formatted = this.formatMessage(message, context);
        console.log(formatted);
        if (this.isEnabled && this.ddLogger) {
            this.ddLogger.trace('verbose', { message, context });
        }
    }
}
